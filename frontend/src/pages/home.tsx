import { useState, useRef, useCallback, useEffect, lazy, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { useStartDownload, useGetDownloadStatus, getVideoInfo, ApiError } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Search, Loader2, Download, CheckCircle, AlertTriangle,
  FileVideo, Eye, Calendar,
  Clipboard, X, RefreshCw,
} from "lucide-react";
import { FormatDropdown } from "@/components/format-dropdown";
import { Link } from "wouter";
import { SEO } from "@/components/layout/seo";
import { CopyButton } from "@/components/copy-button";
import { formatDuration, formatViews, formatDate } from "@/lib/format";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { AdPlaceholder } from "@/components/ui/ad-placeholder";
import { Skeleton } from "@/components/ui/skeleton";
import { getVideoPreview, isDirectDownloadEligible, getDirectDownloadUrl } from "@/lib/video-fast-path";

// All below-fold content (features, FAQ, compatibility, benefits, alternatives,
// safety sections) is lazy-loaded so it does not block initial paint.
const HomeBelowFold = lazy(() => import("@/pages/home-below-fold"));

// Matches youtube.com (watch, shorts, live), youtu.be short links, and YouTube Music.
// Keep in sync with the backend URL acceptance check in video.ts.
const YT_REGEX = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?.*v=|shorts\/|live\/)|youtu\.be\/|music\.youtube\.com\/watch\?).+/i;

/** Tracks whether the viewport is at/above the `lg` (1024px) breakpoint. */
function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== "undefined" && window.innerWidth >= 1024,
  );
  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
    const handler = () => setIsDesktop(mql.matches);
    handler();
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);
  return isDesktop;
}

export default function Home() {
  const [url, setUrl] = useState("");
  /** The URL that is actually being / has been queried. Set immediately on
   *  form submit or paste; set after a short debounce when user types a
   *  valid URL by hand (e.g. typing/editing an existing value). */
  const [queryUrl, setQueryUrl] = useState<string | null>(null);
  // Bumped every time queryUrl is committed by an explicit user action
  // (submit, paste, debounced-typing commit) — NOT on background refetches.
  // Lets the mobile scroll effect below distinguish "same URL loaded again
  // via a fresh user action" from "React Query silently revalidated".
  const loadIdRef = useRef(0);

  const commitQueryUrl = useCallback((next: string | null) => {
    loadIdRef.current += 1;
    setQueryUrl(next);
  }, []);

  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  /** Anchor for the loaded video card — used to smooth-scroll it into view. */
  const videoCardRef = useRef<HTMLDivElement>(null);
  /** Timer ref for the URL debounce — cleared on unmount and on explicit submit. */
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-fetch when the user types a valid YouTube URL. Kept short (150ms) —
  // just enough to avoid firing mid-keystroke while a full URL is still being
  // typed/edited character-by-character. Explicit actions (paste button,
  // form submit) skip this delay entirely and commit immediately, since
  // those are unambiguous signals the URL is final — every millisecond
  // matters given the ~15s yt-dlp lookup that follows.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = url.trim();
    if (!trimmed || !YT_REGEX.test(trimmed) || trimmed === queryUrl) return;
    debounceRef.current = setTimeout(() => {
      commitQueryUrl(trimmed);
      setActiveJobId(null);
    }, 150);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [url, queryUrl, commitQueryUrl]);

  // Drives the mobile-only video-card reorder below. Read synchronously from
  // window.innerWidth on first render (this is a client-only SPA, so there is
  // no hydration mismatch to worry about) to avoid a layout flash on desktop,
  // then kept in sync via matchMedia. Actual DOM order is swapped per
  // breakpoint (not just CSS `order`), so screen-reader/tab order always
  // matches what's visually shown — no meaningful-sequence mismatch.
  const isDesktop = useIsDesktop();

  // Video info fetch — cached per URL for 15 min stale / 30 min GC.
  // AbortSignal cancels the in-flight request on URL change.
  const {
    data: video,
    isFetching: videoFetching,
    error: videoError,
    refetch: retryVideoInfo,
  } = useQuery({
    queryKey: ["video-info", queryUrl],
    queryFn: ({ signal }) => getVideoInfo({ url: queryUrl! }, { signal }),
    enabled: !!queryUrl,
    // yt-dlp's client-vs-YouTube-IP racing (see backend) is occasionally
    // flaky by nature — a single attempt can legitimately time out even for
    // a perfectly normal, non-restricted video, then succeed a moment later.
    // Auto-retry once for exactly that class of failure (timeouts / 5xx from
    // our own server) so the user doesn't see an error for a transient blip.
    // Never retry 4xx (bad URL, unsupported host, etc.) — retrying won't fix
    // a validation error, it'll just waste 15+ more seconds before showing
    // the same failure.
    retry: (failureCount, error) => {
      const status = error instanceof ApiError ? error.status : undefined;
      if (status !== undefined && status < 500) return false;
      return failureCount < 1;
    },
    retryDelay: 500,
    staleTime: 15 * 60 * 1000,
    gcTime:    30 * 60 * 1000,
  });

  // Fast preview — fires in PARALLEL with the query above, not after it.
  // Resolves in a few hundred ms (oEmbed, no yt-dlp) versus the ~15s the
  // full format-list lookup takes, so the video card (thumbnail + title)
  // can render almost immediately while only the format picker keeps
  // showing a skeleton. Silently ignored on failure — the full video-info
  // query is still the source of truth and the UI falls back to its own
  // skeleton until that resolves either way.
  const { data: preview } = useQuery({
    queryKey: ["video-preview", queryUrl],
    queryFn: ({ signal }) => getVideoPreview(queryUrl!, { signal }),
    enabled: !!queryUrl,
    retry: false,
    staleTime: 15 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  // Smooth-scroll the loaded video card into view whenever a NEW explicit
  // load action (submit / paste / debounced-typing commit) finishes loading
  // (mobile only — on desktop the card was already visible below the ad, in
  // its unchanged position). Keyed on `loadIdRef` — bumped only by
  // `commitQueryUrl` — rather than the `video` object or `queryUrl` string,
  // so: (a) an incidental background refetch of the same URL (e.g. React
  // Query revalidation) doesn't re-trigger the scroll, but (b) an explicit
  // reload of the SAME url (e.g. clear then re-submit it) still scrolls,
  // since that's a fresh user action with a fresh load id.
  const scrolledForLoadIdRef = useRef<number | null>(null);
  useEffect(() => {
    if (isDesktop || !video || videoFetching || !videoCardRef.current) return;
    if (scrolledForLoadIdRef.current === loadIdRef.current) return;
    scrolledForLoadIdRef.current = loadIdRef.current;
    const raf = requestAnimationFrame(() => {
      const el = videoCardRef.current;
      if (!el) return;
      const top = el.getBoundingClientRect().top + window.scrollY - 16;
      window.scrollTo({ top, behavior: "smooth" });
    });
    return () => cancelAnimationFrame(raf);
  }, [isDesktop, video, videoFetching]);

  const startDownloadMutation = useStartDownload();

  const { data: jobStatus } = useGetDownloadStatus(activeJobId || "", {
    query: {
      queryKey: ["download-status", activeJobId],
      enabled: !!activeJobId,
      refetchInterval: (query) => {
        if (!query.state.data) return 2000;
        const status = query.state.data.status;
        return status === "pending" || status === "processing" ? 2000 : false;
      },
    },
  });

  const handlePaste = useCallback(async () => {
    if (!navigator.clipboard?.readText) {
      toast.error("Clipboard not supported", { description: "Your browser doesn't support clipboard access. Please paste manually." });
      return;
    }
    try {
      const text = (await navigator.clipboard.readText()).trim();
      if (!text) {
        toast.error("Clipboard is empty", { description: "Copy a YouTube link first, then click Paste." });
        return;
      }
      if (!YT_REGEX.test(text)) {
        toast.error("Not a YouTube link", { description: "Please copy a valid YouTube URL (youtube.com or youtu.be) first." });
        return;
      }
      setUrl(text);
      // Pasting is an explicit, unambiguous signal the URL is final — commit
      // immediately instead of waiting on the typing debounce, so the lookup
      // (the slow part) starts as early as possible.
      if (debounceRef.current) clearTimeout(debounceRef.current);
      setActiveJobId(null);
      commitQueryUrl(text);
      inputRef.current?.focus();
    } catch {
      toast.error("Clipboard access denied", { description: "Allow clipboard access in your browser, or paste the link manually." });
    }
  }, [commitQueryUrl]);

  const handleClear = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setUrl("");
    setQueryUrl(null);
    setActiveJobId(null);
    inputRef.current?.focus();
  }, []);

  const handleGetInfo = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;
    // Skip the debounce — commit immediately on explicit form submit.
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setActiveJobId(null);
    commitQueryUrl(trimmed);
  }, [url, commitQueryUrl]);

  const handleDownload = useCallback((formatId: string) => {
    // Use queryUrl (the committed URL that produced the displayed formats) —
    // NOT the live input value, which may have been edited since the fetch
    // completed. Mismatch between displayed formats and download URL causes
    // "Download does nothing" failures.
    if (!queryUrl) return;

    // Fast path: plain video/audio formats (i.e. everything except the
    // synthetic "mp3-*" conversion options) are single yt-dlp streams that
    // don't need server-side ffmpeg processing. Skip the job-creation +
    // polling flow entirely and navigate straight to the streaming endpoint
    // — the browser's own download manager takes it from there, starting
    // essentially instantly instead of waiting for a full server-side
    // download-then-serve round trip.
    if (isDirectDownloadEligible(formatId)) {
      window.location.href = getDirectDownloadUrl(queryUrl, formatId);
      toast.success("Download starting…", { description: "Your browser will show download progress." });
      return;
    }

    // MP3 conversion still needs an ffmpeg pass on the server, so it stays
    // on the job/polling flow (now with real progress — see backend).
    startDownloadMutation.mutate({ data: { url: queryUrl, formatId } }, {
      onSuccess: (data) => setActiveJobId(data.jobId),
      onError: (err) => toast.error("Failed to start download", { description: err.data?.error }),
    });
  }, [queryUrl, startDownloadMutation]);

  const isJobActive = jobStatus?.status === "pending" || jobStatus?.status === "processing";
  const jobDone = jobStatus?.status === "done";
  const jobFailed = jobStatus?.status === "failed";
  const hasVideoLoaded = !!video && !videoFetching;

  return (
    <div className="max-w-4xl mx-auto space-y-12 md:space-y-24">
      <SEO
        title="Free YouTube Video Downloader"
        description="YouTube Downloader YTOUDown: paste a link, choose MP4 or MP3, and download YouTube videos and Shorts fast — free, browser-based, no account needed."
        path="/"
        speakableSelectors={["h1", "#main-summary", ".speakable"]}
      />

      {/*
        ── Hero + results block ──
        Desktop (lg+): always Form → Badges → Ad → Results (unchanged).
        Mobile (<lg), no video loaded: Form → Badges → Ad.
        Mobile (<lg), video loaded: Form → Video card → Badges → Ad — the
        card appears immediately below the button instead of being pushed
        below the trust badges and ad.

        Each piece is defined once below and placed into the JSX tree in the
        order appropriate for the current breakpoint + state (see the render
        below) — actual DOM order changes, not just visual `order`, so
        screen-reader/keyboard order always matches what's visually shown.
      */}
      {(() => {
        const heroBlock = (
        <section className="text-center space-y-6 pt-8 md:pt-12 pb-4">
          {/*
            Wrapped in <article> to signal a self-contained, definitive summary
            to LLM crawlers and AI answer engines.
          */}
          <article className="space-y-4">
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-extrabold tracking-tight speakable">
              Download YouTube Videos{" "}
              <span className="text-primary">Fast</span> with YTOUDown
            </h1>
            <p
              id="main-summary"
              className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto speakable"
            >
              Save your favorite YouTube videos quickly using YTOUDown. Simply paste a YouTube video link,
              choose the available download quality, and download your video directly to your device.
              No software installation. No complicated setup. Just a fast and easy downloading experience.
            </p>
            {/* Conversational H2 — signals answer-engine intent; the form below is the answer */}
            <h2 className="text-xl md:text-2xl font-semibold text-foreground/90 max-w-2xl mx-auto speakable">
              How can I download YouTube videos without software?
            </h2>
          </article>

          <form onSubmit={handleGetInfo} className="flex flex-col sm:flex-row gap-2 max-w-2xl mx-auto mt-8">
            <div className="relative flex-1">
              <Search aria-hidden="true" className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5 pointer-events-none" />
              <Input
                ref={inputRef}
                placeholder="https://www.youtube.com/watch?v=..."
                className="pl-12 pr-16 sm:pr-28 h-14 text-base sm:text-lg bg-card border-2 border-border focus-visible:ring-primary focus-visible:border-primary rounded-xl"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={videoFetching || isJobActive}
                aria-label="YouTube video URL"
              />
              {/* ── Paste / Clear button ── */}
              {url ? (
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={videoFetching || isJobActive}
                  aria-label="Clear URL"
                  className={[
                    "absolute right-2 top-1/2 -translate-y-1/2",
                    "inline-flex items-center gap-1.5 px-2.5 sm:px-3 h-10 rounded-lg",
                    "text-sm font-medium transition-all duration-200 select-none",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/60 focus-visible:ring-offset-1",
                    "disabled:opacity-40 disabled:cursor-not-allowed",
                    "bg-red-500/10 hover:bg-red-500/15 text-red-400 border border-red-500/30 hover:border-red-500/45 hover:scale-[1.03] active:scale-95",
                  ].join(" ")}
                >
                  <X aria-hidden="true" className="w-4 h-4 shrink-0" />
                  <span className="hidden sm:inline">Clear</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handlePaste}
                  disabled={videoFetching || isJobActive}
                  aria-label="Paste YouTube URL"
                  className={[
                    "absolute right-2 top-1/2 -translate-y-1/2",
                    "inline-flex items-center gap-1.5 px-2.5 sm:px-3 h-10 rounded-lg",
                    "text-sm font-medium transition-all duration-200 select-none",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
                    "disabled:opacity-40 disabled:cursor-not-allowed",
                    "bg-muted/70 hover:bg-primary/10 hover:text-primary border border-border hover:border-primary/40 text-muted-foreground hover:scale-[1.03] active:scale-95",
                  ].join(" ")}
                >
                  <Clipboard aria-hidden="true" className="w-4 h-4 shrink-0 text-muted-foreground" />
                  <span className="hidden sm:inline">Paste</span>
                </button>
              )}
            </div>
            <Button
              type="submit"
              className="h-14 px-8 rounded-xl text-lg font-semibold w-full sm:w-auto"
              disabled={!url || videoFetching || isJobActive}
            >
              {videoFetching
                ? <><Loader2 aria-hidden="true" className="w-5 h-5 animate-spin" /><span className="sr-only">Getting video…</span></>
                : "Get Video"}
            </Button>
          </form>
        </section>
        );

        const badgesBlock = (
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground pt-2">
          <span className="flex items-center gap-1.5"><CheckCircle aria-hidden="true" className="w-4 h-4 text-green-500" /> Fast Processing</span>
          <span className="flex items-center gap-1.5"><CheckCircle aria-hidden="true" className="w-4 h-4 text-green-500" /> No Registration Required</span>
          <span className="flex items-center gap-1.5"><CheckCircle aria-hidden="true" className="w-4 h-4 text-green-500" /> Works on Desktop &amp; Mobile</span>
        </div>
        );

        const adBlock = (
        <AdPlaceholder
          id="hero-banner-ad"
          type="banner"
          desktopHeight={90}
          mobileHeight={100}
          showOnDesktop={true}
          showOnMobile={true}
          showPlaceholder={true}
        />
        );

        // When the fast oEmbed preview has already resolved (typically well
        // under a second), show the real thumbnail/title immediately instead
        // of a generic skeleton — only the format list (which needs the full
        // ~15s yt-dlp lookup) keeps its skeleton. This is what makes the page
        // feel instant even though the full lookup hasn't finished.
        const loadingBlock = videoFetching ? (
          <div
            className="grid md:grid-cols-3 gap-8 items-start"
            role="status"
            aria-label="Loading video information…"
          >
            {/* Video card — real thumbnail/title from the fast preview when available */}
            <div className="md:col-span-1 rounded-xl border border-border bg-card overflow-hidden">
              {preview ? (
                <div className="aspect-video relative bg-black">
                  <img
                    src={preview.thumbnail}
                    alt={preview.title}
                    className="object-cover w-full h-full"
                    width="480"
                    height="270"
                    loading="eager"
                    decoding="async"
                    fetchPriority="high"
                  />
                </div>
              ) : (
                <Skeleton className="aspect-video w-full rounded-none" />
              )}
              <div className="p-4 space-y-3">
                {preview ? (
                  <>
                    <h3 className="font-bold leading-tight break-words" title={preview.title}>
                      {preview.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">{preview.uploader}</p>
                  </>
                ) : (
                  <>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/3" />
                  </>
                )}
                <div className="flex gap-4 pt-1">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-24" />
                </div>
                {preview && (
                  <p className="text-xs text-muted-foreground">
                    Fetching view count &amp; download options…
                  </p>
                )}
              </div>
            </div>
            {/* Format picker skeleton — still needs the full yt-dlp lookup */}
            <div className="md:col-span-2 space-y-4">
              <Skeleton className="h-7 w-44" />
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
            </div>
          </div>
        ) : null;

        const errorBlock = videoError && !videoFetching ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 animate-in fade-in duration-300">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <div className="min-w-0 space-y-0.5">
                <p className="font-semibold text-sm text-destructive">Failed to load video info</p>
                <p className="text-sm text-muted-foreground break-words">
                  {(videoError as ApiError<{ error?: string }>).data?.error ?? videoError.message}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 self-start sm:self-auto"
              onClick={() => retryVideoInfo()}
            >
              <RefreshCw className="w-4 h-4 mr-2" /> Retry
            </Button>
          </div>
        ) : null;

        const videoCardBlock = hasVideoLoaded ? (
          <div
            ref={videoCardRef}
            className="grid md:grid-cols-3 gap-8 items-start animate-in fade-in slide-in-from-bottom-8 duration-300">
          <Card className="md:col-span-1 overflow-hidden border-border bg-card">
            <div className="aspect-video relative bg-black">
              <img
                src={video.thumbnail}
                alt={video.title}
                className="object-cover w-full h-full"
                width="480"
                height="270"
                loading="eager"
                decoding="async"
                fetchPriority="high"
              />
              <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-sm text-white px-2 py-1 rounded text-xs font-mono font-medium">
                {formatDuration(video.duration)}
              </div>
            </div>
            <CardContent className="p-4 space-y-4">
              <div>
                <div className="flex items-start gap-2">
                  <h3 className="font-bold leading-tight flex-1 break-words" title={video.title}>
                    {video.title}
                  </h3>
                  <CopyButton text={video.title} label="Copy title" successMessage="Title copied!" variant="ghost" size="icon" iconOnly className="flex-shrink-0 mt-0.5 h-7 w-7" />
                </div>
                <p className="text-sm text-muted-foreground mt-1">{video.uploader}</p>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5"><Eye aria-hidden="true" className="w-3.5 h-3.5" /> {formatViews(video.viewCount)} views</div>
                <div className="flex items-center gap-1.5"><Calendar aria-hidden="true" className="w-3.5 h-3.5" /> {formatDate(video.uploadDate)}</div>
              </div>
              {video.description ? (
                <div className="relative rounded-lg border border-border bg-muted/40 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Description</span>
                    <CopyButton text={video.description} label="Copy description" successMessage="Copied!" variant="ghost" size="sm" iconOnly={false} className="h-6 text-xs px-2" />
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed max-h-24 overflow-y-auto whitespace-pre-wrap">
                    {video.description}
                  </p>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <div className="md:col-span-2 space-y-6">
            {activeJobId && jobStatus ? (
              <Card className="border-primary/50 bg-primary/5 shadow-[0_0_30px_-10px_hsl(var(--primary))]">
                <CardContent className="p-8 flex flex-col items-center justify-center text-center space-y-6">
                  {isJobActive && (
                    <>
                      <Loader2 aria-hidden="true" className="w-12 h-12 animate-spin text-primary" />
                      <div className="space-y-2 w-full max-w-sm">
                        <h3 className="text-xl font-bold">Processing Video...</h3>
                        <p className="text-muted-foreground text-sm">Please wait while we prepare your download.</p>
                        {jobStatus.progress != null && (
                          <div className="space-y-2 pt-4">
                            <div className="flex justify-between text-sm font-medium font-mono">
                              <span>{jobStatus.progress.toFixed(1)}%</span>
                            </div>
                            <Progress value={jobStatus.progress} className="h-2" />
                          </div>
                        )}
                      </div>
                    </>
                  )}
                  {jobDone && jobStatus.downloadUrl && (
                    <>
                      <CheckCircle aria-hidden="true" className="w-16 h-16 text-green-500" />
                      <div className="space-y-2">
                        <h3 className="text-2xl font-bold text-green-500">Ready to Download</h3>
                        <p className="text-muted-foreground">Your file has been processed successfully.</p>
                      </div>
                      <a href={jobStatus.downloadUrl} download={jobStatus.filename || "video"} className="w-full max-w-sm">
                        <Button size="lg" className="w-full font-bold text-lg h-14 bg-green-600 hover:bg-green-700 text-white gap-2">
                          <Download aria-hidden="true" className="w-5 h-5" /> Download File
                        </Button>
                      </a>
                    </>
                  )}
                  {jobFailed && (
                    <>
                      <AlertTriangle aria-hidden="true" className="w-16 h-16 text-destructive" />
                      <div className="space-y-2">
                        <h3 className="text-2xl font-bold text-destructive">Processing Failed</h3>
                        <p className="text-muted-foreground">{jobStatus.error || "An unknown error occurred."}</p>
                      </div>
                      <Button variant="outline" onClick={() => setActiveJobId(null)}>Try Another Format</Button>
                    </>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Results Banner Ad — appears only after a successful video fetch,
                    before the format/download section. Maintains ≥48 px safe distance
                    from download buttons via the space-y-6 gap. */}
                <AdPlaceholder
                  id="results-banner-ad"
                  type="banner"
                  desktopHeight={90}
                  mobileHeight={100}
                  showOnDesktop={true}
                  showOnMobile={true}
                  showPlaceholder={true}
                />
                {/* 48 px safe gap above download buttons */}
                <div className="space-y-4 pt-6">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <FileVideo aria-hidden="true" className="w-5 h-5 text-primary" /> Choose Format
                </h3>
                <FormatDropdown
                  formats={video.formats}
                  onDownload={handleDownload}
                  isPending={startDownloadMutation.isPending}
                  ffmpegAvailable={video.ffmpegAvailable}
                />
                </div>
              </div>
            )}
          </div>
        </div>
        ) : null;

        return (
          <div className="flex flex-col gap-8 md:gap-10">
            {heroBlock}
            {isDesktop || !hasVideoLoaded ? (
              <>
                {badgesBlock}
                {adBlock}
                {loadingBlock}
                {errorBlock}
                {videoCardBlock}
              </>
            ) : (
              <>
                {videoCardBlock}
                {badgesBlock}
                {adBlock}
                {loadingBlock}
                {errorBlock}
              </>
            )}
          </div>
        );
      })()}

      {/*
        Below-fold informational sections — lazy-loaded so they don't block
        the hero's first paint. Suspense fallback is null because these sections
        are well below the viewport on load; the spinner would never be seen and
        would cause an unnecessary layout shift.
      */}
      <Suspense fallback={null}>
        <HomeBelowFold />
      </Suspense>
    </div>
  );
}
