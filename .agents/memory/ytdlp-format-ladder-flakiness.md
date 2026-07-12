---
name: yt-dlp format ladder flakiness on server IPs
description: Why /video/info sometimes returns only one format and how it's mitigated
---

From this environment's outbound IP, YouTube's default `web` player client is fully blocked. `android` alone reliably works but only exposes a single muxed ~360p progressive format (no separate resolutions, no audio-only tracks). Clients that expose the full HLS/DASH ladder (144p-4K video-only + audio-only), like `android_embedded`/`tv_embedded`/`ios`, are inconsistently allowed — the exact same `--extractor-args youtube:player_client=...` combo can return the full ladder on one request and just format 18 on the very next, with no code-visible reason (not rate-limit errors, just fewer formats).

**Why:** This is YouTube-side, per-request server behavior, not a bug in our code or a fixable yt-dlp flag. No client combo was found that guarantees the rich response every time.

**How to apply:** `/video/info` retries a sequence of client combos (richest-to-safest) via `fetchVideoInfoWithBestFormats`, keeping whichever attempt returns the most non-storyboard formats, with `"android"` alone as the guaranteed-min fallback. Downloads use a broad multi-client combo so any itag exposed during info-fetch can still resolve. Also: MP3/audio synthetic options must fall back to using ANY muxed format with audio (not just dedicated audio-only tracks) as the ffmpeg extraction source, since audio-only tracks are often unavailable when only format 18 comes back.
