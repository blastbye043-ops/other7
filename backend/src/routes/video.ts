import { Router, type IRouter } from "express";
import { spawn, execSync } from "child_process";
import path from "path";
import os from "os";
import fs from "fs";
import { randomUUID } from "crypto";
import { db, downloadsTable } from "@workspace/db";
import {
  GetVideoInfoBody,
  StartDownloadBody,
  GetDownloadStatusParams,
} from "@workspace/api-zod";
import { logger } from "../lib/logger";
import { infoLimiter, downloadLimiter } from "../middlewares/rate-limit";
import { startCleanupScheduler } from "../lib/cleanup";

const router: IRouter = Router();

// Binary paths — configurable via env vars; fall back to names on PATH
const YT_DLP_PATH = process.env.YT_DLP_PATH || "yt-dlp";
// Resolve an absolute path to the ffmpeg binary for spawning directly
// (e.g. the `ffmpeg -version` availability check).
function resolveFfmpegBinary(): string {
  const configured = process.env.FFMPEG_PATH;
  if (configured) return configured;
  try {
    const resolved = execSync("which ffmpeg", { encoding: "utf8" }).trim();
    if (resolved) return resolved;
  } catch {
    // fall through to bare command name below
  }
  return "ffmpeg";
}
const FFMPEG_PATH = resolveFfmpegBinary();

// yt-dlp's --ffmpeg-location resolves ffprobe by taking the *directory* of
// whatever is passed. If given a bare command name (e.g. "ffmpeg" with no
// path separator), yt-dlp cannot derive a directory and its ffprobe lookup
// silently becomes None, causing MP3/audio extraction to fail with
// "expected str, bytes or os.PathLike object, not NoneType". So this is
// intentionally the *directory* containing ffmpeg/ffprobe, not the binary
// itself — a separate value from FFMPEG_PATH above.
const FFMPEG_LOCATION = path.isAbsolute(FFMPEG_PATH) ? path.dirname(FFMPEG_PATH) : FFMPEG_PATH;

// Downloads directory — configurable, defaults to OS temp dir
const downloadsDir =
  process.env.DOWNLOADS_DIR ||
  path.join(os.tmpdir(), "ytdown-downloads");

if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir, { recursive: true });
}

type JobStatus = "pending" | "processing" | "done" | "failed";

interface Job {
  jobId: string;
  status: JobStatus;
  url: string;
  formatId: string;
  audioOnly: boolean;
  audioBitrate: number | null;
  progress: number | null;
  downloadUrl: string | null;
  filename: string | null;
  error: string | null;
  createdAt: string;
  title: string | null;
  thumbnail: string | null;
  ext: string | null;
}

const jobs = new Map<string, Job>();

startCleanupScheduler(downloadsDir, jobs);

// MP3 bitrates offered as synthetic conversion options — actual extraction
// happens via ffmpeg at download time, not natively provided by yt-dlp.
const MP3_BITRATES = [320, 256, 192, 128] as const;

// Cache ffmpeg availability so we don't spawn a process on every /video/info
// request. Re-checked once per process lifetime — ffmpeg presence doesn't
// change at runtime.
let ffmpegAvailableCache: boolean | null = null;
function checkFfmpegAvailable(): Promise<boolean> {
  if (ffmpegAvailableCache !== null) return Promise.resolve(ffmpegAvailableCache);
  return new Promise((resolve) => {
    const proc = spawn(FFMPEG_PATH, ["-version"], { timeout: 5000 });
    proc.on("error", () => {
      ffmpegAvailableCache = false;
      resolve(false);
    });
    proc.on("close", (code) => {
      ffmpegAvailableCache = code === 0;
      resolve(ffmpegAvailableCache);
    });
  });
}

// Flags applied to every yt-dlp invocation, minus the client selection
// (that is injected per-call — see CLIENT_CANDIDATES below).
// - no-call-home: do not contact yt-dlp's update server on each run (faster).
// - concurrent-fragments: fetch up to 8 DASH/HLS fragments in parallel
//   instead of 1-at-a-time. Most of a video's length ends up served as
//   fragmented DASH from this server's IP (see CLIENT_CANDIDATES comment),
//   so this materially cuts wall-clock download time for both the info
//   probe (negligible there) and, more importantly, the actual download.
const COMMON_YTDLP_ARGS = ["--no-call-home", "--concurrent-fragments", "8"];

// Candidate `player_client` combos tried (in order) when fetching video info.
// From this server's IP range, YouTube's default `web` client is fully
// blocked, and even the clients that *do* work (android/ios/tv_embedded) are
// inconsistently allowed to serve the full HLS/DASH format ladder — the same
// combo can return a single muxed 360p format on one request and the full
// 144p-4K + audio-only ladder on the next. There is no reliable way to force
// the rich response every time, so we retry with several combos and keep
// whichever attempt yields the most usable (non-storyboard) formats.
// "android" alone is kept last as the guaranteed-to-work fallback (always
// yields at least one downloadable 360p format).
const CLIENT_CANDIDATES = [
  "android_embedded,tv_embedded,ios,android",
  "tv_embedded,ios,android",
  "android_embedded,android",
  "android",
];

// Broad combo used for the actual download step. Format IDs (itags) are
// stable across clients, so as long as ONE of these clients can resolve the
// requested itag, the download succeeds — regardless of which candidate
// combo happened to expose that itag during the /video/info call.
const DOWNLOAD_CLIENT_ARG = "android_embedded,tv_embedded,ios,android";

/**
 * Spawn yt-dlp with the given args.
 * @param args         Additional arguments beyond COMMON_YTDLP_ARGS.
 * @param timeoutMs    Kill the process after this many ms (default 60 s).
 *                     Use a larger value for actual downloads.
 * @param playerClient `youtube:player_client=` value to use for this call.
 * @param signal       Optional AbortSignal — killed immediately if aborted
 *                     (e.g. the HTTP client disconnected or a newer request
 *                     superseded this one).
 */
function runYtDlp(
  args: string[],
  timeoutMs = 60_000,
  playerClient: string | null = DOWNLOAD_CLIENT_ARG,
  signal?: AbortSignal,
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error("Request was cancelled."));
      return;
    }
    const fullArgs = [
      ...COMMON_YTDLP_ARGS,
      // playerClient === null means "no override" — let yt-dlp fall back to
      // its own default client auto-selection instead of forcing one of our
      // hardcoded combos. Passing an empty string here would instead send
      // `--extractor-args youtube:player_client=`, which yt-dlp treats as an
      // (invalid) explicit empty client list, not "no override" — so the
      // flag must be omitted entirely rather than passed with an empty value.
      ...(playerClient ? ["--extractor-args", `youtube:player_client=${playerClient}`] : []),
      ...args,
    ];
    const proc = spawn(YT_DLP_PATH, fullArgs, { timeout: timeoutMs });
    let stdout = "";
    let stderr = "";
    let cancelled = false;

    const onAbort = () => {
      cancelled = true;
      proc.kill("SIGTERM");
    };
    signal?.addEventListener("abort", onAbort);

    proc.stdout.on("data", (d: Buffer) => { stdout += d.toString(); });
    proc.stderr.on("data", (d: Buffer) => { stderr += d.toString(); });
    proc.on("close", (code, sig) => {
      signal?.removeEventListener("abort", onAbort);
      if (cancelled) {
        reject(new Error("Request was cancelled."));
      } else if (code === 0) {
        resolve(stdout.trim());
      } else if (sig === "SIGTERM" || sig === "SIGKILL") {
        reject(new Error(`yt-dlp timed out after ${Math.round(timeoutMs / 1000)} seconds.`));
      } else {
        reject(new Error(stderr.trim() || `yt-dlp exited with code ${code}`));
      }
    });
    proc.on("error", (err: NodeJS.ErrnoException) => {
      signal?.removeEventListener("abort", onAbort);
      if (err.code === "ENOENT") {
        reject(
          new Error(
            `yt-dlp binary not found at "${YT_DLP_PATH}". ` +
            `Install yt-dlp and ensure it is on PATH, or set the YT_DLP_PATH environment variable.`,
          ),
        );
      } else {
        reject(err);
      }
    });
  });
}

// Matches yt-dlp's `--newline` progress output, e.g.:
//   [download]  42.5% of   10.00MiB at    1.20MiB/s ETA 00:07
const PROGRESS_RE = /\[download\]\s+(\d{1,3}(?:\.\d+)?)%/;

/**
 * Same contract as runYtDlp, but additionally parses `--newline` progress
 * output line-by-line and reports percentage updates via onProgress as they
 * arrive, instead of only resolving once at the very end. Used for the
 * download step so the client sees a real, moving progress bar instead of a
 * value frozen at 5% for the entire multi-second/minute transfer.
 */
function runYtDlpWithProgress(
  args: string[],
  timeoutMs: number,
  playerClient: string,
  onProgress: (pct: number) => void,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const fullArgs = [
      ...COMMON_YTDLP_ARGS,
      "--extractor-args", `youtube:player_client=${playerClient}`,
      "--newline",
      ...args,
    ];
    const proc = spawn(YT_DLP_PATH, fullArgs, { timeout: timeoutMs });
    let stdout = "";
    let lineBuffer = "";
    let stderr = "";

    proc.stdout.on("data", (d: Buffer) => {
      const chunk = d.toString();
      stdout += chunk;
      lineBuffer += chunk;
      let idx: number;
      while ((idx = lineBuffer.indexOf("\n")) !== -1) {
        const line = lineBuffer.slice(0, idx);
        lineBuffer = lineBuffer.slice(idx + 1);
        const m = line.match(PROGRESS_RE);
        if (m) onProgress(parseFloat(m[1]));
      }
    });
    proc.stderr.on("data", (d: Buffer) => { stderr += d.toString(); });
    proc.on("close", (code, sig) => {
      if (code === 0) {
        resolve(stdout.trim());
      } else if (sig === "SIGTERM" || sig === "SIGKILL") {
        reject(new Error(`yt-dlp timed out after ${Math.round(timeoutMs / 1000)} seconds.`));
      } else {
        reject(new Error(stderr.trim() || `yt-dlp exited with code ${code}`));
      }
    });
    proc.on("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "ENOENT") {
        reject(
          new Error(
            `yt-dlp binary not found at "${YT_DLP_PATH}". ` +
            `Install yt-dlp and ensure it is on PATH, or set the YT_DLP_PATH environment variable.`,
          ),
        );
      } else {
        reject(err);
      }
    });
  });
}

/** Strip characters that are unsafe in a Content-Disposition filename. */
function sanitizeFilename(name: string): string {
  return name.replace(/[\\/:*?"<>|\r\n]+/g, " ").trim().slice(0, 150) || "video";
}

/**
 * Build a Content-Disposition header value that's safe for ANY title,
 * including non-Latin1 characters (CJK, Cyrillic, emoji, accents — i.e. most
 * real YouTube titles). Node's res.writeHead throws ERR_INVALID_CHAR if a
 * raw header string contains a character outside Latin-1, so a plain
 * `filename="${title}.mp4"` would crash the streaming download route for a
 * large fraction of real videos. RFC 5987's `filename*=UTF-8''<percent-
 * encoded>` form carries the real Unicode name, alongside an ASCII-only
 * `filename=` fallback for older clients that don't understand filename*.
 */
function buildContentDisposition(rawName: string): string {
  const asciiFallback = rawName.replace(/[^\x20-\x7E]/g, "_").replace(/"/g, "'");
  const encoded = encodeURIComponent(rawName);
  return `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encoded}`;
}

/**
 * Map a raw yt-dlp / system error message to a human-readable string
 * suitable for displaying directly to the user.
 */
function classifyError(msg: string): { status: number; error: string } {
  const m = msg.toLowerCase();

  // Binary missing
  if (m.includes("yt-dlp binary not found") || m.includes("no such file") && m.includes("yt-dlp")) {
    return { status: 503, error: "yt-dlp is not installed on the server. Please contact the administrator." };
  }
  if (m.includes("ffmpeg") && (m.includes("not found") || m.includes("no such file"))) {
    return { status: 503, error: "FFmpeg is not installed on the server. Please contact the administrator." };
  }

  // Timeout
  if (m.includes("timed out")) {
    return { status: 504, error: "The request timed out. YouTube may be slow — please try again." };
  }

  // Network / connectivity
  if (m.includes("network") || m.includes("connection refused") || m.includes("getaddrinfo") || m.includes("econnrefused")) {
    return { status: 502, error: "Unable to reach YouTube. Check the server's network connection and try again." };
  }

  // Rate limited by YouTube
  if (m.includes("too many requests") || m.includes("429") || m.includes("rate limit")) {
    return { status: 429, error: "YouTube is temporarily rate-limiting requests from this server. Please wait a few minutes and try again." };
  }

  // Video unavailable / removed / geo-blocked
  if (m.includes("video unavailable") || m.includes("this video is not available") || m.includes("this video has been removed")) {
    return { status: 422, error: "This video is unavailable or has been removed." };
  }
  if (m.includes("not available in your country") || m.includes("blocked") || m.includes("geo") || m.includes("region")) {
    return { status: 422, error: "This video is blocked in the server's region (geo-restricted)." };
  }

  // Copyright
  if (m.includes("copyright") || m.includes("content id")) {
    return { status: 422, error: "This video has been blocked due to a copyright claim." };
  }

  // Auth / age — use specific phrases to avoid false-positives on unrelated messages
  if (
    m.includes("sign in") ||
    m.includes("login required") ||
    m.includes("age-restricted") ||
    m.includes("age restricted") ||
    m.includes("confirm your age") ||
    m.includes("inappropriate for some users")
  ) {
    return { status: 422, error: "This video is age-restricted or requires sign-in." };
  }
  if (m.includes("members-only") || m.includes("membership")) {
    return { status: 422, error: "This video is for channel members only." };
  }

  // Private
  if (m.includes("private video") || m.includes("this video is private")) {
    return { status: 422, error: "This video is private." };
  }

  // Not found / bad URL
  if (m.includes("not found") || m.includes("does not exist") || m.includes("unable to extract")) {
    return { status: 422, error: "Video not found. Please check the URL and try again." };
  }

  // Playlist (when single video expected)
  if (m.includes("playlist") && m.includes("use --no-playlist")) {
    return { status: 422, error: "Playlists are not supported. Please provide a direct video URL." };
  }

  // Fallback — include the raw message so it's never completely opaque
  return { status: 422, error: `Download failed: ${msg.slice(0, 300)}` };
}

/**
 * Persist a download record for analytics / history purposes.
 *
 * This is FIRE-AND-FORGET — it never blocks the download pipeline and never
 * throws. Both synchronous exceptions (e.g. query-builder errors) and async
 * rejections (e.g. DB connection failures) are caught and logged so the caller
 * is never affected. If the database is not configured, it returns immediately.
 */
function recordDownloadAsync(data: {
  url: string;
  title: string;
  thumbnail: string | null;
  format: string;
  ext: string;
  filesize: number | null;
  status: "done" | "failed";
}): void {
  if (!db) {
    // DATABASE_URL not configured — analytics disabled, skip silently.
    return;
  }
  try {
    db.insert(downloadsTable)
      .values(data)
      .catch((err: unknown) => {
        logger.error({ err }, "Failed to record download analytics (non-critical — download unaffected)");
      });
  } catch (err: unknown) {
    logger.error({ err }, "Failed to record download analytics (non-critical — download unaffected)");
  }
}

// In-memory cache of parsed video info, keyed by YouTube video ID. Avoids
// re-invoking yt-dlp (the slowest part of the whole pipeline, ~5-30s) when
// multiple requests come in for the same video within a short window.
// Video metadata (title, formats, thumbnail) is stable for the lifetime of a
// video — 30 minutes is safe and meaningfully reduces repeat lookups.
const VIDEO_INFO_CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
// Hard cap on the number of entries. When full, the least-recently-used entry
// is evicted (getCachedVideoInfo re-inserts on hit to keep hot entries alive).
const VIDEO_INFO_CACHE_MAX_SIZE = 500;
const videoInfoCache = new Map<string, { data: any; expiresAt: number; winningClient: string }>();

// In-flight fetches, keyed by video ID (or URL for videos whose ID cannot be
// extracted). Coalesces concurrent requests for the same video so that only ONE
// set of yt-dlp processes runs at a time — extra callers attach to the existing
// promise and get the result for free when it resolves.
interface InflightEntry {
  promise: Promise<{ info: any; winningClient: string }>;
  controller: AbortController;
  /** Number of HTTP requests currently waiting on this promise. */
  waiters: number;
}
const inFlightFetches = new Map<string, InflightEntry>();

function extractVideoId(url: string): string | null {
  const patterns = [
    /[?&]v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/live\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m) return m[1];
  }
  return null;
}

function getCachedVideoInfo(videoId: string | null): { data: any; winningClient: string } | null {
  if (!videoId) return null;
  const entry = videoInfoCache.get(videoId);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    videoInfoCache.delete(videoId);
    return null;
  }
  // LRU touch: delete + re-insert so this entry moves to the end of insertion
  // order, making it the last to be evicted when the cache is full.
  videoInfoCache.delete(videoId);
  videoInfoCache.set(videoId, entry);
  return { data: entry.data, winningClient: entry.winningClient };
}

function setCachedVideoInfo(videoId: string | null, data: any, winningClient: string): void {
  if (!videoId) return;
  // Evict the least-recently-used entry (first in insertion order) when full.
  if (videoInfoCache.size >= VIDEO_INFO_CACHE_MAX_SIZE) {
    const oldestKey = videoInfoCache.keys().next().value;
    if (oldestKey !== undefined) videoInfoCache.delete(oldestKey);
  }
  videoInfoCache.set(videoId, { data, winningClient, expiresAt: Date.now() + VIDEO_INFO_CACHE_TTL_MS });
}

/**
 * Look up which player_client combo most recently resolved this video's
 * info (from the still-valid /video/info cache), so /video/download can
 * hand yt-dlp that single winning client directly instead of the full
 * DOWNLOAD_CLIENT_ARG fallback chain. yt-dlp tries each client in a
 * comma-separated list sequentially until one works, so skipping straight
 * to the client we already know succeeds removes that internal retry
 * latency from the download's extraction step.
 */
function getWinningClientForDownload(url: string): string {
  const videoId = extractVideoId(url);
  const cached = getCachedVideoInfo(videoId);
  return cached?.winningClient ?? DOWNLOAD_CLIENT_ARG;
}

/**
 * Fetch `--dump-json` info for a video by racing all CLIENT_CANDIDATES in
 * PARALLEL (rather than sequentially) and returning as soon as the FIRST
 * attempt that clears a "rich enough" format threshold settles — the rest
 * are aborted immediately instead of being waited on.
 *
 * Previously this awaited `Promise.all` over every candidate before picking
 * a winner, so latency was bounded by the SLOWEST of the 4 attempts even
 * when the richest response came back almost instantly. Racing with early
 * cancellation instead bounds latency to whichever candidate resolves
 * fastest with a good-enough result, which is what actually matters to the
 * user waiting on the page.
 */
async function fetchVideoInfoWithBestFormats(
  url: string,
  signal?: AbortSignal,
): Promise<{ info: any; winningClient: string }> {
  // yt-dlp's own extraction round-trip to YouTube (info-JSON only, no
  // download) measured 14-16s on this server even for the cheapest
  // single-client call — that's network/extraction time, not something the
  // client-combo choice or code can shrink further. The timeout must sit
  // safely above that floor or every attempt gets killed by our own clock
  // before yt-dlp had a chance to finish, which is what was causing
  // legitimate slow-but-working lookups to surface as "request timed out".
  const PER_ATTEMPT_TIMEOUT_MS = 25_000;
  // Lowered from 4 → 2: waiting for a genuinely rich ladder (4+ usable
  // formats) meant every request paid for the SLOWEST candidate to also
  // clear that bar, even when a faster candidate already had a perfectly
  // downloadable 2-3 format response. This is the main lever on the
  // "download button takes forever to appear" complaint — the yt-dlp round
  // trip itself (14-16s per attempt) can't be shortened further, but we no
  // longer force the race to wait for the richest of 4 parallel attempts
  // when a solid-enough one already finished.
  const RICH_THRESHOLD = 2;
  const LAST_RESORT_TIMEOUT_MS = 30_000;

  return new Promise((resolve, reject) => {
    let best: any = null;
    let bestCount = -1;
    let bestClient = DOWNLOAD_CLIENT_ARG;
    let lastError: unknown = null;
    let settledCount = 0;
    let done = false;
    let lastResortTried = false;
    const controllers = CLIENT_CANDIDATES.map(() => new AbortController());

    // Propagate the parent abort (e.g. client disconnected) to every attempt.
    const onParentAbort = () => controllers.forEach((c) => c.abort());
    signal?.addEventListener("abort", onParentAbort);

    const finish = (info: any, winningClient: string) => {
      if (done) return;
      done = true;
      signal?.removeEventListener("abort", onParentAbort);
      controllers.forEach((c) => c.abort());
      resolve({ info, winningClient });
    };

    const finishError = () => {
      if (done) return;

      // Last resort: every forced player_client combo failed or timed out.
      // yt-dlp's own default client auto-selection (no --extractor-args
      // override at all) uses different, self-adapting fallback logic than
      // our hardcoded CLIENT_CANDIDATES list, and can succeed even when
      // every one of our forced combos is currently being blocked for this
      // server's IP — which, per the CLIENT_CANDIDATES comment above, shifts
      // unpredictably. This is what most often turns a real "YouTube is
      // rejecting our client list right now" situation into a working
      // result instead of a user-facing timeout.
      if (!lastResortTried) {
        lastResortTried = true;
        runYtDlp(
          ["--dump-json", "--no-playlist", "--no-warnings", "--ffmpeg-location", FFMPEG_LOCATION, url],
          LAST_RESORT_TIMEOUT_MS,
          null, // omit the override entirely — yt-dlp picks its own default client
          signal,
        )
          .then((jsonStr) => JSON.parse(jsonStr))
          .then((info) => finish(info, DOWNLOAD_CLIENT_ARG))
          .catch((err) => {
            if (done) return;
            done = true;
            signal?.removeEventListener("abort", onParentAbort);
            reject(
              err instanceof Error
                ? err
                : lastError instanceof Error
                  ? lastError
                  : new Error("Failed to fetch video info."),
            );
          });
        return;
      }

      done = true;
      signal?.removeEventListener("abort", onParentAbort);
      reject(lastError instanceof Error ? lastError : new Error("Failed to fetch video info."));
    };

    // If the caller's signal is already aborted before we even start (e.g.
    // the client disconnected between request receipt and this call), don't
    // spawn any yt-dlp processes at all.
    if (signal?.aborted) {
      controllers.forEach((c) => c.abort());
      finishError();
      return;
    }

    CLIENT_CANDIDATES.forEach((client, i) => {
      runYtDlp(
        [
          "--dump-json",
          "--no-playlist",
          "--no-warnings",
          "--ffmpeg-location", FFMPEG_LOCATION,
          url,
        ],
        PER_ATTEMPT_TIMEOUT_MS,
        client,
        controllers[i].signal,
      )
        .then((jsonStr) => JSON.parse(jsonStr))
        .then((info) => {
          if (done) return;
          const usableCount = Array.isArray(info.formats)
            ? info.formats.filter((f: any) => f.vcodec !== "none" || f.acodec !== "none").length
            : 0;
          if (usableCount > bestCount) {
            best = info;
            bestCount = usableCount;
            bestClient = client;
          }
          if (usableCount >= RICH_THRESHOLD) {
            finish(info, client);
            return;
          }
          settledCount += 1;
          // All candidates settled without hitting the rich threshold —
          // return whatever the best of them was rather than erroring out.
          if (settledCount === CLIENT_CANDIDATES.length) {
            if (best) finish(best, bestClient);
            else finishError();
          }
        })
        .catch((err) => {
          if (done) return;
          lastError = err;
          settledCount += 1;
          if (settledCount === CLIENT_CANDIDATES.length) {
            if (best) finish(best, bestClient);
            else finishError();
          }
        });
    });
  });
}

// In-memory cache for the oEmbed preview, separate from the full video-info
// cache (different shape, and we want it to survive independently).
const previewCache = new Map<string, { data: any; expiresAt: number }>();
const PREVIEW_CACHE_TTL_MS = 30 * 60 * 1000;

/**
 * Near-instant title/author/thumbnail preview via YouTube's public oEmbed
 * endpoint — no yt-dlp subprocess involved. Typically resolves in a few
 * hundred ms (a single small JSON HTTP call) versus the 14-16s the full
 * yt-dlp format-list extraction takes. The frontend fires this in parallel
 * with /video/info and paints the video card immediately, while the format
 * list streams in a couple seconds later — this is the single biggest lever
 * for *perceived* video-info speed, since the user sees something happen
 * almost instantly instead of staring at a skeleton for 15 seconds.
 *
 * Intentionally has no formats/duration/view-count — those require yt-dlp
 * and still go through /video/info.
 */
router.post("/video/preview", infoLimiter, async (req, res) => {
  const parsed = GetVideoInfoBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid URL" });
    return;
  }
  const { url } = parsed.data;
  const isYouTubeUrl =
    url.includes("youtube.com") || url.includes("youtu.be") || url.includes("music.youtube.com");
  if (!isYouTubeUrl) {
    res.status(400).json({ error: "Only YouTube URLs are supported (youtube.com, youtu.be, music.youtube.com)." });
    return;
  }

  const videoId = extractVideoId(url);
  const cacheKey = videoId ?? url;
  const cached = previewCache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) {
    res.json(cached.data);
    return;
  }

  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const resp = await fetch(oembedUrl, { signal: controller.signal });
    clearTimeout(timeout);

    if (!resp.ok) {
      // Not fatal — the frontend falls back to showing the skeleton until
      // /video/info resolves. 404 typically means the video is private,
      // unlisted-without-embed, or the URL is malformed.
      res.status(resp.status === 404 ? 404 : 502).json({ error: "Preview unavailable." });
      return;
    }

    const oembed = (await resp.json()) as {
      title?: string;
      author_name?: string;
      thumbnail_url?: string;
    };

    const data = {
      id: videoId,
      title: oembed.title || "Loading title…",
      uploader: oembed.author_name || "",
      // oEmbed's own thumbnail_url (hqdefault, always present) is used as
      // the safe default. /video/info swaps this for the full-res thumbnail
      // a couple seconds later — using maxresdefault here instead would
      // sometimes 404 (not all videos have one) and flash a broken image.
      thumbnail: oembed.thumbnail_url || "",
    };

    previewCache.set(cacheKey, { data, expiresAt: Date.now() + PREVIEW_CACHE_TTL_MS });
    res.json(data);
  } catch (err) {
    req.log.warn({ err, url }, "video/preview: oEmbed lookup failed");
    res.status(502).json({ error: "Preview unavailable." });
  }
});

router.post("/video/info", infoLimiter, async (req, res) => {
  const parsed = GetVideoInfoBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid URL" });
    return;
  }

  const { url } = parsed.data;

  const isYouTubeUrl =
    url.includes("youtube.com") ||
    url.includes("youtu.be") ||
    url.includes("music.youtube.com");

  if (!isYouTubeUrl) {
    res.status(400).json({ error: "Only YouTube URLs are supported (youtube.com, youtu.be, music.youtube.com)." });
    return;
  }

  const startedAt = Date.now();
  const videoId = extractVideoId(url);
  req.log.info({ url, videoId }, "video/info: request received");

  // Kick off the ffmpeg availability probe immediately, in parallel with the
  // yt-dlp info fetch below, instead of awaiting it afterwards. It's
  // independent of the video/URL, so there's no reason to pay for it
  // sequentially — this only matters on the very first request per process
  // (result is cached after that), but it's free to do right.
  const ffmpegAvailablePromise = checkFfmpegAvailable();

  try {
    // ── 1. Memory cache hit (fastest path: ~0 ms) ──────────────────────────
    const cached = getCachedVideoInfo(videoId);
    let info: any;
    let cacheHit = false;
    if (cached) {
      info = cached.data;
      cacheHit = true;
      req.log.info({ url, videoId }, "video/info: cache hit");
    } else {
      // ── 2. In-flight coalescing ──────────────────────────────────────────
      // If another request is already running yt-dlp for this video, attach to
      // its promise instead of spawning a second set of processes. The result
      // is shared — no extra work, no extra wait.
      const cacheKey = videoId ?? url;
      let entry = inFlightFetches.get(cacheKey);

      if (entry) {
        entry.waiters++;
        req.log.info({ url, videoId, waiters: entry.waiters }, "video/info: joining in-flight fetch");
      } else {
        // ── 3. Cache miss + no in-flight: spawn yt-dlp ────────────────────
        // The fetch-level AbortController is only triggered when ALL waiting
        // HTTP clients have disconnected — a single disconnect does not abort
        // the shared fetch while others are still waiting.
        const controller = new AbortController();
        const promise = fetchVideoInfoWithBestFormats(url, controller.signal)
          .finally(() => { inFlightFetches.delete(cacheKey); });
        entry = { promise, controller, waiters: 1 };
        inFlightFetches.set(cacheKey, entry);
        req.log.info({ url, videoId }, "video/info: cache miss — invoking yt-dlp");
      }

      // Track this request's contribution to the waiter count so we can
      // decrement it (and possibly abort the fetch) if the client disconnects
      // before the promise settles.
      const liveEntry = entry;
      const onClose = () => {
        if (res.writableEnded) return;
        liveEntry.waiters--;
        if (liveEntry.waiters <= 0) {
          liveEntry.controller.abort();
        }
      };
      res.on("close", onClose);

      let result: { info: any; winningClient: string };
      try {
        result = await liveEntry.promise;
      } finally {
        res.off("close", onClose);
      }

      info = result.info;
      setCachedVideoInfo(videoId, info, result.winningClient);
    }

    type BuiltFormat = {
      formatId: string;
      ext: string;
      quality: string;
      resolution: string | null;
      filesize: number | null;
      vcodec: string | null;
      acodec: string | null;
      fps: number | null;
      tbr: number | null;
      container: "mp4" | "webm" | "audio";
      hasAudio: boolean;
      audioBitrate: number | null;
    };

    const videoFormats: BuiltFormat[] = [];
    const seen = new Set<string>();

    if (info.formats) {
      for (const f of info.formats) {
        if (!f.format_id) continue;
        const ext = f.ext || "mp4";
        const vcodec = f.vcodec && f.vcodec !== "none" ? f.vcodec : null;
        const acodec = f.acodec && f.acodec !== "none" ? f.acodec : null;

        // Skip formats with neither a video nor audio track (e.g. mhtml storyboards).
        if (!vcodec && !acodec) continue;

        const isAudioOnly = !vcodec && !!acodec;
        const resolution = f.resolution || (f.height ? `${f.height}p` : null);
        const quality = isAudioOnly
          ? (f.abr ? `${Math.round(f.abr)}kbps` : f.format_note || "audio")
          : resolution || f.format_note || f.format || "unknown";

        let container: BuiltFormat["container"];
        if (isAudioOnly) container = "audio";
        else if (ext === "webm") container = "webm";
        else container = "mp4";

        const key = `${container}-${quality}-${ext}-${vcodec ?? ""}-${acodec ?? ""}`;
        if (seen.has(key)) continue;
        seen.add(key);

        videoFormats.push({
          formatId: f.format_id,
          ext,
          quality,
          resolution,
          filesize: f.filesize || f.filesize_approx || null,
          vcodec,
          acodec,
          fps: f.fps || null,
          tbr: f.tbr || null,
          container,
          hasAudio: !!acodec,
          audioBitrate: null,
        });
      }
    }

    const getHeight = (f: BuiltFormat) =>
      parseInt((f.resolution || f.quality || "").replace("p", "")) || 0;

    const mp4Formats = videoFormats
      .filter((f) => f.container === "mp4" && f.vcodec)
      .sort((a, b) => getHeight(b) - getHeight(a) || (b.tbr ?? 0) - (a.tbr ?? 0));

    const webmFormats = videoFormats
      .filter((f) => f.container === "webm" && f.vcodec)
      .sort((a, b) => getHeight(b) - getHeight(a) || (b.tbr ?? 0) - (a.tbr ?? 0));

    const audioFormats = videoFormats
      .filter((f) => f.container === "audio")
      .sort((a, b) => (b.tbr ?? 0) - (a.tbr ?? 0));

    // Cap each group to a reasonable, non-overwhelming set of distinct resolutions/qualities.
    const dedupeByQuality = (list: BuiltFormat[], limit: number) => {
      const out: BuiltFormat[] = [];
      const qualitiesSeen = new Set<string>();
      for (const f of list) {
        if (qualitiesSeen.has(f.quality)) continue;
        qualitiesSeen.add(f.quality);
        out.push(f);
        if (out.length >= limit) break;
      }
      return out;
    };

    const finalMp4 = dedupeByQuality(mp4Formats, 8);
    const finalWebm = dedupeByQuality(webmFormats, 6);

    // Audio: dedupe by container ext instead of raw bitrate label so we surface
    // one option per distinct audio flavor (M4A, WEBM/Opus, AAC, etc.) rather
    // than several near-identical bitrate variants of the same codec.
    const dedupeAudioByExt = (list: BuiltFormat[], limit: number) => {
      const out: BuiltFormat[] = [];
      const extsSeen = new Set<string>();
      for (const f of list) {
        if (extsSeen.has(f.ext)) continue;
        extsSeen.add(f.ext);
        out.push(f);
        if (out.length >= limit) break;
      }
      return out;
    };
    let finalAudio = dedupeAudioByExt(audioFormats, 6);

    // Human-friendly labels: top pick becomes "Best Audio"; the rest are
    // labeled by their container/codec (M4A, AAC, WEBM Audio, Opus, ...).
    const audioLabel = (f: BuiltFormat): string => {
      if (f.ext === "m4a") return "M4A";
      if (f.acodec?.startsWith("mp4a")) return "AAC";
      if (f.ext === "webm") return "WEBM Audio";
      if (f.acodec?.startsWith("opus")) return "Opus";
      return f.ext.toUpperCase();
    };
    finalAudio = finalAudio.map((f, i) => ({
      ...f,
      quality: i === 0 ? "Best Audio" : audioLabel(f),
    }));

    const ffmpegAvailable = await ffmpegAvailablePromise;

    // Synthetic MP3 conversion options — only offered when ffmpeg is present
    // and there is SOME stream with an audio track to convert from. Prefer a
    // dedicated audio-only track when the video exposes one, but fall back to
    // any muxed video+audio format (e.g. the guaranteed 360p progressive
    // format) so MP3 conversion is still offered even when YouTube only
    // serves a single muxed format from this server's IP.
    const audioSource: BuiltFormat | undefined =
      finalAudio[0] ??
      finalMp4.find((f) => f.hasAudio) ??
      finalWebm.find((f) => f.hasAudio);

    const mp3Options: BuiltFormat[] = [];
    if (ffmpegAvailable && audioSource) {
      const bestAudio = audioSource;
      for (const bitrate of MP3_BITRATES) {
        mp3Options.push({
          formatId: `mp3-${bitrate}`,
          ext: "mp3",
          quality: `MP3 ${bitrate}kbps`,
          resolution: null,
          filesize: null,
          vcodec: null,
          acodec: bestAudio.acodec,
          fps: null,
          tbr: bitrate,
          container: "audio",
          hasAudio: true,
          audioBitrate: bitrate,
        });
      }
    }

    const bestFormats = [...finalMp4, ...finalWebm, ...mp3Options, ...finalAudio];

    res.json({
      id: info.id,
      title: info.title || "Unknown Title",
      url: info.webpage_url || url,
      formats: bestFormats,
      duration: info.duration || null,
      thumbnail: info.thumbnail || "",
      uploader: info.uploader || info.channel || "Unknown",
      viewCount: info.view_count || null,
      uploadDate: info.upload_date || null,
      description: info.description ? info.description.slice(0, 500) : null,
      ffmpegAvailable,
    });
    req.log.info(
      { url, videoId, cacheHit, totalMs: Date.now() - startedAt },
      "video/info: response sent",
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    req.log.error(
      { err, url, videoId, totalMs: Date.now() - startedAt },
      "video/info: failed",
    );
    if (res.writableEnded) {
      // Client already disconnected (superseded by a newer request) —
      // nothing to send, and res.json() would throw on a closed connection.
      return;
    }
    const { status, error } = classifyError(msg);
    res.status(status).json({ error });
  }
});

router.post("/video/download", downloadLimiter, async (req, res) => {
  const parsed = StartDownloadBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  const { url, formatId, audioOnly } = parsed.data;
  const isMp3Conversion = formatId.startsWith("mp3-");
  const audioBitrate = isMp3Conversion
    ? parseInt(formatId.slice(4), 10) || 192
    : (parsed.data as { audioBitrate?: number | null }).audioBitrate ?? null;

  const jobId = randomUUID();
  const job: Job = {
    jobId,
    status: "pending",
    url,
    formatId,
    audioOnly: isMp3Conversion ? true : audioOnly || false,
    audioBitrate,
    progress: 0,
    downloadUrl: null,
    filename: null,
    error: null,
    createdAt: new Date().toISOString(),
    title: null,
    thumbnail: null,
    ext: null,
  };
  jobs.set(jobId, job);

  res.json({
    jobId,
    status: job.status,
    url,
    formatId,
    progress: job.progress,
    downloadUrl: null,
    filename: null,
    error: null,
    createdAt: job.createdAt,
  });

  processDownload(jobId).catch((err) => {
    logger.error({ err, jobId }, "Download job failed unexpectedly");
  });
});

async function processDownload(jobId: string) {
  const job = jobs.get(jobId);
  if (!job) return;

  job.status = "processing";
  job.progress = 5;

  const isMp3Conversion = job.formatId.startsWith("mp3-");
  const outputTemplate = path.join(downloadsDir, `${jobId}.%(ext)s`);
  // Reuse the player_client that already proved to work for this video during
  // /video/info (cached by video ID) instead of the full DOWNLOAD_CLIENT_ARG
  // fallback chain — skips yt-dlp's own internal per-client retry sequence,
  // which otherwise adds several seconds before the actual download starts.
  const downloadClient = getWinningClientForDownload(job.url);
  const args = [
    "--no-playlist",
    "--no-warnings",
    "--ffmpeg-location", FFMPEG_LOCATION,
    // Downloads are bandwidth-bound (unlike the /video/info probe, which is a
    // single small JSON response), so fetch more DASH/HLS fragments in
    // parallel here than the COMMON_YTDLP_ARGS default — this measurably
    // cuts wall-clock time for higher-resolution formats split into many
    // fragments.
    "--concurrent-fragments", "16",
    "-f", isMp3Conversion ? "bestaudio/best" : job.formatId,
    "--output", outputTemplate,
    "--print-json",
  ];

  if (isMp3Conversion) {
    args.push(
      "--extract-audio",
      "--audio-format", "mp3",
      "--audio-quality", `${job.audioBitrate ?? 192}k`,
    );
  } else if (job.audioOnly) {
    args.push("--extract-audio", "--audio-format", "mp3");
  }

  args.push(job.url);

  // Live progress: yt-dlp's own [download] NN.N% lines are parsed as they
  // stream in and mapped onto the job's progress field in real time, instead
  // of leaving it frozen at 5% for the whole transfer (previous behavior —
  // the job only ever jumped from 5 straight to 100). Reserve the top of the
  // range for finalization (moving/reading the file, DB write) so 100% is
  // only ever reported once the job is truly done.
  const onProgress = (pct: number) => {
    const scaled = 5 + Math.round((pct / 100) * 90); // 5 → 95
    if (scaled > (job.progress ?? 0)) job.progress = scaled;
  };

  try {
    // Allow up to 10 minutes for a download — large videos at high quality
    // can take several minutes on a server with limited bandwidth.
    let output: string;
    try {
      output = await runYtDlpWithProgress(args, 10 * 60_000, downloadClient, onProgress);
    } catch (err) {
      // The cached winning client can go stale (YouTube's per-client
      // allowlist shifts unpredictably — see CLIENT_CANDIDATES comment
      // above), so a failure on the fast path falls back to the full
      // multi-client chain before giving up, same as pre-cache behavior.
      if (downloadClient === DOWNLOAD_CLIENT_ARG) throw err;
      logger.warn(
        { jobId, downloadClient, err },
        "Download failed with cached winning client — retrying with full client fallback chain",
      );
      output = await runYtDlpWithProgress(args, 10 * 60_000, DOWNLOAD_CLIENT_ARG, onProgress);
    }

    let info: { title?: string; thumbnail?: string; ext?: string; filesize?: number; filesize_approx?: number } = {};
    try {
      info = JSON.parse(output);
    } catch {
      info = {};
    }

    const files = fs.readdirSync(downloadsDir).filter(f => f.startsWith(jobId));
    if (files.length === 0) {
      throw new Error("Downloaded file not found");
    }

    const filename = files[0];
    const ext = path.extname(filename).slice(1);
    const filesize = fs.statSync(path.join(downloadsDir, filename)).size;

    // Mark job complete before touching the database — the download is done
    // regardless of whether analytics recording succeeds.
    job.status = "done";
    job.progress = 100;
    job.filename = filename;
    job.downloadUrl = `/api/video/file/${filename}`;
    job.title = info.title || "Video";
    job.thumbnail = info.thumbnail || null;
    job.ext = ext;

    // Non-blocking analytics — fire-and-forget, never awaited.
    // A database failure here cannot affect the completed download.
    recordDownloadAsync({
      url: job.url,
      title: job.title,
      thumbnail: job.thumbnail,
      format: job.formatId,
      ext,
      filesize,
      status: "done",
    });
  } catch (err) {
    const rawMsg = err instanceof Error ? err.message : String(err);
    const { error: friendlyError } = classifyError(rawMsg);
    job.status = "failed";
    job.error = friendlyError;
    logger.error({ err, jobId, rawMsg }, "Download processing failed");

    // Non-blocking analytics — fire-and-forget, never awaited.
    recordDownloadAsync({
      url: job.url,
      title: job.title || "Unknown",
      thumbnail: null,
      format: job.formatId,
      ext: "unknown",
      filesize: null,
      status: "failed",
    });
  }
}

// Formats eligible for direct streaming are exactly those yt-dlp can hand
// back as a single already-muxed stream (a plain format_id — the itags this
// app ever offers are never "137+140"-style combined selectors, see
// /video/info above). MP3 conversion and the (currently unused-by-the-UI)
// audioOnly flag both require an ffmpeg extraction pass and stay on the
// job/disk pipeline below.
function isStreamEligible(formatId: string, audioOnly: boolean | undefined): boolean {
  return !formatId.startsWith("mp3-") && !audioOnly;
}

/**
 * Direct streaming download — pipes yt-dlp's stdout straight through to the
 * HTTP response as bytes arrive from YouTube, instead of writing the whole
 * file to disk and making the browser fetch it a second time afterwards.
 *
 * Previous pipeline: YouTube → (full file to server disk) → job "done" →
 *   browser GETs /video/file/:id → (full file to browser). Total wall time
 *   was roughly the SUM of both transfers, and the user saw no useful
 *   progress until the *server's* copy had completely finished.
 *
 * This pipeline: YouTube → server → browser, continuously, in one pass.
 * Total wall time is roughly the MAX of the two transfer rates rather than
 * their sum, the browser's native download manager shows real byte-level
 * progress from the first chunk, and no space is used on server disk at
 * all for this path.
 *
 * A plain GET (rather than the job-creation POST) so it can be triggered by
 * simple browser navigation (`<a href>` / `window.location`) — the browser's
 * own network stack then streams the response straight to disk without ever
 * buffering the whole file in page memory, which a fetch()+blob approach
 * would do and which risks OOM-ing the tab on large videos.
 */
router.get("/video/download/direct", downloadLimiter, async (req, res) => {
  const url = typeof req.query.url === "string" ? req.query.url : "";
  const formatId = typeof req.query.formatId === "string" ? req.query.formatId : "";

  if (!url || !formatId) {
    res.status(400).json({ error: "Missing url or formatId." });
    return;
  }
  const isYouTubeUrl =
    url.includes("youtube.com") || url.includes("youtu.be") || url.includes("music.youtube.com");
  if (!isYouTubeUrl) {
    res.status(400).json({ error: "Only YouTube URLs are supported." });
    return;
  }
  if (!isStreamEligible(formatId, false)) {
    res.status(400).json({ error: "This format requires server-side conversion — use the standard download flow." });
    return;
  }

  const videoId = extractVideoId(url);
  const cached = getCachedVideoInfo(videoId);
  // Same "skip yt-dlp's internal client fallback chain when we already know
  // which one works" trick used by the job-based download path above.
  const downloadClient = cached?.winningClient ?? DOWNLOAD_CLIENT_ARG;

  let filenameBase = "video";
  let ext = "mp4";
  let knownFilesize: number | null = null;
  if (cached?.data) {
    if (cached.data.title) filenameBase = sanitizeFilename(cached.data.title);
    const fmt = Array.isArray(cached.data.formats)
      ? cached.data.formats.find((f: any) => f.format_id === formatId)
      : null;
    if (fmt?.ext) ext = fmt.ext;
    if (fmt) knownFilesize = fmt.filesize ?? fmt.filesize_approx ?? null;
  }

  const args = [
    ...COMMON_YTDLP_ARGS,
    "--extractor-args", `youtube:player_client=${downloadClient}`,
    "--no-playlist",
    "--no-warnings",
    "--ffmpeg-location", FFMPEG_LOCATION,
    "--concurrent-fragments", "16",
    "-f", formatId,
    "-o", "-",
    url,
  ];

  const proc = spawn(YT_DLP_PATH, args, { timeout: 10 * 60_000 });
  let headersSent = false;
  let stderr = "";
  // Node can fire both 'error' and 'close' for the same failed spawn in some
  // versions/platforms — guard so we never attempt to send a second response.
  let settled = false;

  const cleanupOnDisconnect = () => {
    if (!res.writableEnded) proc.kill("SIGTERM");
  };
  req.on("close", cleanupOnDisconnect);

  proc.stdout.once("data", (firstChunk: Buffer) => {
    headersSent = true;
    const contentType =
      ext === "mp4" ? "video/mp4" :
      ext === "webm" ? "video/webm" :
      ext === "m4a" ? "audio/mp4" :
      ext === "opus" ? "audio/opus" :
      "application/octet-stream";
    const headers: Record<string, string> = {
      "Content-Type": contentType,
      "Content-Disposition": buildContentDisposition(`${filenameBase}.${ext}`),
      "Cache-Control": "no-store",
    };
    // When we already know the file size (from the cached /video/info format
    // list), send it as Content-Length so the browser's native download
    // manager shows a real percentage/ETA instead of just a byte counter.
    // Omitted when unknown — Node then falls back to chunked transfer, which
    // still streams correctly, just without a determinate progress bar.
    if (knownFilesize && knownFilesize > 0) {
      headers["Content-Length"] = String(knownFilesize);
    }
    res.writeHead(200, headers);
    res.write(firstChunk);
    proc.stdout.pipe(res);
  });

  proc.stderr.on("data", (d: Buffer) => {
    stderr += d.toString();
  });

  proc.on("error", (err: NodeJS.ErrnoException) => {
    if (settled) return;
    settled = true;
    req.off("close", cleanupOnDisconnect);
    if (headersSent) {
      res.destroy();
      return;
    }
    const msg = err.code === "ENOENT" ? "yt-dlp binary not found." : err.message;
    const { status, error } = classifyError(msg);
    res.status(status).json({ error });
  });

  proc.on("close", (code, sig) => {
    if (settled) return;
    settled = true;
    req.off("close", cleanupOnDisconnect);
    if (!headersSent) {
      // Nothing ever streamed — safe to still send a normal JSON error.
      const msg =
        sig === "SIGTERM" || sig === "SIGKILL"
          ? "The request timed out. YouTube may be slow — please try again."
          : stderr.trim() || `yt-dlp exited with code ${code}`;
      const { status, error } = classifyError(msg);
      res.status(status).json({ error });
      return;
    }
    // Headers (and possibly a partial body) already went out — the HTTP
    // status is locked in at 200, so a failure here can only end the
    // connection, not report a clean error. The browser's download manager
    // will surface this as a failed/incomplete download.
    if (code === 0) res.end();
    else res.destroy();
  });

  // Non-blocking analytics — best effort, mirrors the job-based path.
  proc.on("close", (code) => {
    recordDownloadAsync({
      url,
      title: cached?.data?.title || "Video",
      thumbnail: cached?.data?.thumbnail || null,
      format: formatId,
      ext,
      filesize: null,
      status: code === 0 ? "done" : "failed",
    });
  });
});

router.get("/video/download/:jobId", (req, res) => {
  const parsed = GetDownloadStatusParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid job ID" });
    return;
  }

  const job = jobs.get(parsed.data.jobId);
  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }

  res.json({
    jobId: job.jobId,
    status: job.status,
    url: job.url,
    formatId: job.formatId,
    progress: job.progress,
    downloadUrl: job.downloadUrl,
    filename: job.filename,
    error: job.error,
    createdAt: job.createdAt,
  });
});

router.get("/video/file/:filename", (req, res) => {
  const filename = req.params.filename;
  if (!filename || filename.includes("..") || filename.includes("/")) {
    res.status(400).json({ error: "Invalid filename" });
    return;
  }

  const filePath = path.join(downloadsDir, filename);
  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: "File not found or has expired" });
    return;
  }

  res.download(filePath, filename, (err) => {
    if (err) req.log.error({ err }, "Error sending file");
  });
});

export default router;
