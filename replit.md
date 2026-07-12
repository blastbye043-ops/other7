# YTOUDown

A production-ready YouTube video downloader — paste a URL, pick quality, download. Powered by yt-dlp and FFmpeg, with download history, format browser, FAQ, and About pages.

## Run & Operate

### Local development
Requirements: Node.js 20+, pnpm, `yt-dlp` and `ffmpeg` on PATH (or set `YT_DLP_PATH` / `FFMPEG_PATH`), a PostgreSQL database.

```bash
# Install dependencies
pnpm install

# Copy and fill in environment variables
cp .env.example .env   # set DATABASE_URL at minimum

# Push DB schema
pnpm --filter @workspace/db run push

# Start frontend (http://localhost:3000)
pnpm --filter @workspace/ytdown run dev

# Start API server (reads PORT from env, defaults shown in .env.example)
PORT=8080 pnpm --filter @workspace/api-server run dev
```

### All commands
- `pnpm --filter @workspace/api-server run dev` — run the API server
- `pnpm --filter @workspace/ytdown run dev` — run the frontend (defaults to port 3000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)

### Required environment variables
- `DATABASE_URL` — Postgres connection string (required for API server)
- `PORT` — port for each server (API and frontend both read this; run them on different ports)
- `YT_DLP_PATH` / `FFMPEG_PATH` — optional; override binary locations if not on PATH
- `DOWNLOADS_DIR` — optional; where downloaded files are stored (defaults to `artifacts/api-server/downloads/`)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS + shadcn/ui + Framer Motion
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Downloader: yt-dlp + FFmpeg

## Where things live

- DB schema: `lib/db/src/schema/downloads.ts`
- API contract: `lib/api-spec/openapi.yaml`
- API routes: `artifacts/api-server/src/routes/` (video.ts, history.ts, formats.ts)
- Frontend pages: `artifacts/ytdown/src/pages/`
- Frontend theme: `artifacts/ytdown/src/index.css`
- Downloads stored in: `artifacts/api-server/downloads/` (created at runtime)

## Architecture decisions

- yt-dlp is invoked via child_process `spawn` on the server side; downloads are stored as files in `artifacts/api-server/downloads/`
- In-memory job map tracks download status (jobId → Job); history is persisted to PostgreSQL
- Frontend polls `GET /api/video/download/:jobId` every 2s while job is pending/processing
- Every yt-dlp call forces `--extractor-args "youtube:player_client=android"` (`BASE_YTDLP_ARGS` in `video.ts`). YouTube blocks the default web/embedded clients from server IPs (nsig extraction failures, "not available on this app"); the Android client works without cookies or a PO token. Do not remove this.
- In Replit dev, yt-dlp comes from the Nix store (`YT_DLP_PATH` env var). In the Render Docker image, it's the standalone binary downloaded fresh on every build (see `artifacts/api-server/Dockerfile`) — intentionally not pinned, since YouTube's blocking behavior changes often and staying current matters more than reproducibility here.
- FFmpeg path is from the Nix store in Replit dev; installed via `apt-get` in the Render Docker image.

## Product

- Home: Paste YouTube URL → fetch video info → select format → download with progress tracking
- History: All past downloads with stats summary (total count, success rate, total size, popular formats)
- Formats: Browse all supported video/audio formats
- FAQ: 10 common questions about the downloader
- About: Product overview and legal notice

## Gotchas

- After installing new Python packages (yt-dlp), the YT_DLP_PATH env var defaults to the pip install location
- yt-dlp must be installed via `pip install yt-dlp` in the Replit environment
- DB schema changes require `pnpm --filter @workspace/db run push`
- After OpenAPI spec changes, always run codegen before touching types

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Deployment (Vercel + Render)

The frontend and API are deployed separately to two different providers:

- **Frontend → Vercel**: static build only (`vercel.json`). Build command `pnpm --filter @workspace/ytdown build`, output `artifacts/ytdown/dist/public`. Set `VITE_API_URL` in Vercel project settings to the Render API's public URL (e.g. `https://ytdown-api.onrender.com`) — without it the frontend calls same-origin `/api/*`, which doesn't exist on Vercel since the API isn't hosted there.
- **API → Render**: Docker web service (`render.yaml` blueprint + `artifacts/api-server/Dockerfile`). Docker is required because yt-dlp and ffmpeg aren't available on Render's native Node runtime. Deploy via Render dashboard → New → Blueprint, pointing at this repo; the blueprint also provisions a free Postgres database and wires `DATABASE_URL` automatically.
- After the Vercel deploy is live, set `CORS_ORIGINS` on the Render service to the Vercel domain(s) (comma-separated) so the API only accepts requests from the real frontend.
- Vercel serverless functions were intentionally removed (no `api/` dir) — yt-dlp/ffmpeg don't run in that environment, which is exactly why the API moved to Render's Docker runtime instead.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
