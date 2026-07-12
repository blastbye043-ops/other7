# YTDown

A production-ready YouTube video downloader — paste a URL, pick quality, download. Powered by yt-dlp and FFmpeg.

## Run & Operate

### Local development

Requirements: Node.js 20+, pnpm, `yt-dlp` and `ffmpeg` on PATH (or set `YT_DLP_PATH` / `FFMPEG_PATH`), optionally a PostgreSQL database.

```bash
# Install dependencies
pnpm install

# Copy and fill in environment variables
cp .env.example .env   # set DATABASE_URL if you want history

# (Optional) Push DB schema
pnpm --filter @workspace/db run push

# Start frontend (http://localhost:3000)
pnpm dev:frontend

# Start API server (http://localhost:8080)
pnpm dev:backend
```

### All commands

- `pnpm dev` — start both frontend + backend concurrently
- `pnpm dev:frontend` — Vite dev server (port 3000)
- `pnpm dev:backend` — Express API server (port 8080)
- `pnpm build` — typecheck + build all packages
- `pnpm start` — start built backend in production mode
- `pnpm typecheck` — full typecheck across all packages
- `pnpm setup` — pre-flight dependency check

### Required environment variables

- `DATABASE_URL` — Postgres connection string (optional; disables history/analytics when absent)
- `PORT` — port for API server (default: 8080) or frontend (default: 3000)
- `YT_DLP_PATH` / `FFMPEG_PATH` — optional; override binary locations if not on PATH
- `CORS_ORIGINS` — comma-separated allowed origins (set to your frontend domain in production)

## Stack

- pnpm workspaces, Node.js 22, TypeScript 5.9
- Frontend: React 19 + Vite 7 + Tailwind CSS 4 + shadcn/ui + Framer Motion
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod 3, drizzle-zod
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (ESM bundle)
- Downloader: yt-dlp + FFmpeg

## Where things live

- DB schema: `packages/db/src/schema/`
- API contract: `packages/api-spec/openapi.yaml`
- API routes: `backend/src/routes/` (video.ts, history.ts, formats.ts)
- Frontend pages: `frontend/src/pages/`
- Frontend theme: `frontend/src/index.css`
- Downloads stored in: OS temp dir by default (configurable via `DOWNLOADS_DIR`)

## Architecture decisions

- yt-dlp is invoked via `child_process.spawn` on the server side
- In-memory job map tracks download status; history is persisted to PostgreSQL
- Frontend polls `GET /api/video/download/:jobId` every 2s while job is pending/processing
- YouTube blocks the default `web` client from datacenter IPs; the backend races multiple `player_client` combos (android_embedded, tv_embedded, ios, android) in parallel and picks whichever yields the richest format list fastest
- `DATABASE_URL` is optional — download history is disabled gracefully without it

## Product

- Home: Paste YouTube URL → fetch video info → select format → download with progress tracking
- History: All past downloads with stats summary (requires DB)
- Formats: Browse all supported video/audio formats
- FAQ, About, Privacy, Terms, DMCA, Cookie Policy, Contact pages

## Deployment

See [DEPLOY.md](./DEPLOY.md) for full deployment instructions.

- **Frontend → Vercel**: static SPA, built with `pnpm build:frontend`, served from `frontend/dist/public/`
- **Backend → Render**: Dockerized Express API (`backend/Dockerfile`). Docker required because yt-dlp and ffmpeg must be bundled.
- Set `VITE_API_URL` in Vercel to the Render API's public URL
- Set `CORS_ORIGINS` on the Render service to the Vercel domain(s)

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._
