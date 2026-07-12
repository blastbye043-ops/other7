# YTDown — YouTube Video Downloader

A production-ready, full-stack YouTube video downloader. Paste a URL, pick quality (up to 4K or MP3 audio), and download — no account needed.

**Stack:** React 19 · Vite 7 · Express 5 · TypeScript 5.9 · PostgreSQL · Drizzle ORM · Tailwind CSS v4 · yt-dlp · FFmpeg

---

## Project Structure

```
ytdown/
├── frontend/          # React + Vite SPA
│   └── src/
│       ├── pages/     # Route pages (home, history, faq, about, …)
│       ├── components/# UI components (shadcn/ui + layout)
│       └── hooks/     # Custom React hooks
├── backend/           # Express 5 API server
│   └── src/
│       ├── routes/    # video.ts, history.ts, formats.ts, healthz.ts
│       ├── lib/       # logger, cleanup scheduler
│       └── middlewares/
├── packages/
│   ├── db/            # Drizzle ORM schema + PostgreSQL client
│   ├── api-zod/       # Shared Zod schemas (generated from OpenAPI)
│   ├── api-client/    # TanStack Query hooks (generated)
│   └── api-spec/      # OpenAPI spec + Orval codegen config
├── scripts/
│   └── setup.sh       # Pre-flight dependency check
├── .env.example       # Copy this to .env and fill in values
├── vercel.json        # Frontend Vercel deployment config
├── render.yaml        # Backend Render deployment blueprint
├── backend/Dockerfile # Docker image for the API (includes yt-dlp + ffmpeg)
└── DEPLOY.md          # Full deployment guide
```

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 20+ | https://nodejs.org or `nvm install --lts` |
| pnpm | 9+ | `npm i -g pnpm` or `corepack enable` |
| yt-dlp | latest | `pip install yt-dlp` or `brew install yt-dlp` |
| ffmpeg | any recent | `brew install ffmpeg` / `sudo apt install ffmpeg` |
| PostgreSQL | 14+ | Optional — app works without a database |

Run the pre-flight check to verify everything is installed:

```bash
pnpm setup
```

---

## Local Development

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Open `.env` and set `DATABASE_URL` if you want download history. The downloader works without a database.

### 3. (Optional) Push Database Schema

```bash
pnpm --filter @workspace/db run push
```

### 4. Start Development Servers

```bash
# Start both frontend + backend together
pnpm dev

# Or start separately in two terminals:
pnpm dev:backend    # API server → http://localhost:8080
pnpm dev:frontend   # Vite dev → http://localhost:3000
```

The Vite dev server proxies `/api/*` to `http://localhost:8080` automatically.

---

## Available Commands

```bash
pnpm dev               # Start both servers concurrently
pnpm dev:frontend      # Vite dev server only (port 3000)
pnpm dev:backend       # Express API only (port 8080)
pnpm build             # Full typecheck + build all packages
pnpm build:frontend    # Build frontend → frontend/dist/public/
pnpm build:backend     # Bundle backend → backend/dist/index.mjs
pnpm start             # Start built backend in production mode
pnpm typecheck         # TypeScript check across all packages
pnpm setup             # Pre-flight dependency check
```

---

## Environment Variables

### Backend

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | — | Postgres connection string. Omit to disable history |
| `PORT` | `8080` | API server port |
| `CORS_ORIGINS` | open (dev) / closed (prod) | Comma-separated allowed origins |
| `YT_DLP_PATH` | `yt-dlp` | Override yt-dlp binary path |
| `FFMPEG_PATH` | `ffmpeg` | Override ffmpeg binary path |
| `DOWNLOADS_DIR` | OS temp dir | Temporary download storage |
| `LOG_LEVEL` | `info` | Pino log level |

### Frontend

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Vite dev server port |
| `BACKEND_PORT` | `8080` | Local API port (used by Vite proxy) |
| `VITE_API_URL` | same-origin | Production API URL (set when API and frontend are on different domains) |
| `VITE_SITE_URL` | `https://ytoudown.com` | Public site URL for SEO / canonical tags |

---

## Production Build

```bash
pnpm build

# Outputs:
#   frontend/dist/public/    → static files (deploy to Vercel / CDN)
#   backend/dist/index.mjs   → bundled API server

# Start production backend (also serves frontend if VITE_API_URL is unset)
NODE_ENV=production PORT=8080 pnpm start
```

---

## Deployment

See **[DEPLOY.md](./DEPLOY.md)** for full step-by-step instructions (Vercel + Render).

---

## Architecture Notes

- yt-dlp is spawned via `child_process.spawn` — never runs client-side
- Downloads are stored temporarily in `DOWNLOADS_DIR` and auto-cleaned after 1 hour
- YouTube blocks the default `web` client from server IPs — the backend races multiple `player_client` combos in parallel and picks the richest format response
- Database is optional — downloader works without it; history and analytics return 503 when DB is unconfigured

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/video/info` | Fetch video metadata + available formats |
| `POST` | `/api/video/preview` | Quick thumbnail + title preview |
| `POST` | `/api/video/download` | Start a download job |
| `GET` | `/api/video/download/:jobId` | Poll job status / stream file |
| `GET` | `/api/history` | Download history (requires DB) |
| `GET` | `/api/formats` | List supported formats |
| `GET` | `/api/healthz` | Health check |
