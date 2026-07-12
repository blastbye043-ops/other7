---
name: Split deploy: Vercel + Render
description: Deploying a monorepo's static frontend to Vercel and a yt-dlp/ffmpeg-dependent API to Render as a Docker service.
---

For an app whose backend shells out to system binaries (yt-dlp, ffmpeg),
Vercel serverless functions and Render's native Node runtime are both
unsuitable — neither lets you install arbitrary system packages. Render's
Docker runtime does, so the backend goes there; the frontend (pure static
build) goes to Vercel.

**Key decisions, with reasons:**

- Render service must be `runtime: docker` with the Dockerfile path pointing
  into the monorepo subpackage, but the **build context must be the repo
  root** — a service like this depends on pnpm workspace libs (e.g. a shared
  `db` package), and esbuild bundles those straight from their TS source
  (their package.json `exports` point at `./src`, not a compiled `dist`), so
  no separate lib build/typecheck step is needed before bundling — just
  `pnpm install` then bundle.
- Use the `<tool>_linux` standalone PyInstaller release asset instead of the
  bare `<tool>` asset when a CLI tool offers both — the bare one is often a
  Python zipapp that silently requires a `python3` interpreter on PATH,
  which fails at runtime (not build time) with a confusing "No such file or
  directory" error if you didn't install Python in the image.
- Verify checksums (e.g. `SHA2-256SUMS`) for binaries pulled via `curl` in a
  Dockerfile, and run the container as a non-root user — both are cheap and
  were flagged in review as missing hardening.
- CORS should fail closed (`origin: false`, not default-allow) in production
  when the allowed-origins env var is unset, so a forgotten env var doesn't
  silently expose the API to any origin. Browser-only restriction — direct
  API calls are unaffected.
- For a static SPA on Vercel, the standard `"/(.*)" -> "/index.html"` rewrite
  is safe and does NOT break existing static files (favicon, robots.txt,
  build assets, etc.) — Vercel serves any file that exists in the output
  directory before falling back to a rewrite. Don't over-engineer the rewrite
  pattern trying to exclude specific static paths.
