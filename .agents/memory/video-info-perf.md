---
name: video info fetch performance pattern
description: How /video/info avoids stacking multiple yt-dlp attempts sequentially, and caches results
---

The multi-client-candidate retry strategy (see ytdlp-format-ladder-flakiness.md) originally ran each `player_client` combo sequentially, each with its own timeout — worst case latency was the SUM of all attempts' timeouts (could exceed 100s). Switched to running all candidates in parallel with `Promise.all` (each with its own shorter per-attempt timeout, ~15s), then picking whichever settled result has the richest format list. This bounds worst-case latency to roughly one attempt's timeout instead of the sum.

Also added an in-memory cache keyed by YouTube video ID (extracted via regex from the URL) with a ~12 minute TTL, so repeat lookups for the same video (common — multiple users pasting the same popular link) return near-instantly instead of re-invoking yt-dlp.

**Why:** User reported the site "waiting a long time then 500ing" — root cause was the sequential retry loop plus zero caching, not a fundamentally slow yt-dlp call.

**How to apply:** When adding more retry/fallback attempts to any external-process-backed endpoint, default to racing them in parallel with bounded per-attempt timeouts rather than chaining them sequentially, unless there's a strong reason (e.g. cost) to prefer sequential. Also wire an AbortController tied to `res.on("close")` so client-side cancellation (new URL pasted, tab closed) actually kills the child process instead of leaking CPU.

**Update (2026-07-10):** `Promise.all` still bounds latency by the SLOWEST candidate even if the richest result comes back fast. Switched to a manual race with per-candidate `AbortController`s: resolve and abort the rest as soon as one candidate clears the "rich enough" format threshold, only falling back to "best of all settled" if none do. Guard against a signal that's already aborted at entry (skip spawning entirely) and make the error-path also set the `done` latch. Separately: on this environment, even the single cheapest yt-dlp `--dump-json` call floors at ~14-16s (pure network/extraction time, not fixable in code) — a per-attempt timeout below that floor produces false "request timed out" errors on legitimately-succeeding lookups. Also added `--concurrent-fragments 8` to the shared yt-dlp args, which speeds up the actual video *download* step (fragmented DASH/HLS) — it does nothing for the info-JSON probe itself.
