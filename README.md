# YTOUDown — YouTube Video Downloader

A full-stack YouTube video downloader. Paste a URL, pick quality (up to 4K or MP3 audio), and download — no account needed.

**Stack:** React 19 · Vite 7 · Express 5 · TypeScript 5.9 · PostgreSQL · Drizzle ORM · Tailwind CSS v4 · yt-dlp · FFmpeg

---

## Project structure

```
ytoudown/
├── frontend/          # React + Vite web app
├── backend/           # Express API server
├── packages/
│   ├── db/            # Drizzle ORM schema + database client
│   ├── api-zod/       # Zod request/response schemas (generated from OpenAPI)
│   ├── api-client/    # TanStack Query hooks for the API (generated)
│   └── api-spec/      # OpenAPI spec + Orval codegen config
├── .env.example       # ← copy this to .env and fill it in
├── pnpm-workspace.yaml
└── README.md          # ← you are here
```

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 20 or 22 | https://nodejs.org |
| pnpm | 9+ | `npm i -g pnpm` |
| PostgreSQL | 14+ | https://postgresql.org |
| yt-dlp | latest | `pip install yt-dlp` or https://github.com/yt-dlp/yt-dlp |
| FFmpeg | any recent | `brew install ffmpeg` / `apt install ffmpeg` |

---

## Local setup

### 1 — Install dependencies

```bash
pnpm install
```

### 2 — Configure environment

```bash
cp .env.example .env
```

Open `.env` and set **at minimum**:

```env
DATABASE_URL=postgres://postgres:password@localhost:5432/ytoudown
```

See `.env.example` for all available variables with descriptions.

### 3 — Create the database

In psql (or your preferred Postgres client):

```sql
CREATE DATABASE ytoudown;
```

Then push the schema:

```bash
# Run from the repo root
pnpm --filter @workspace/db run push
```

> This creates all tables. Re-run after any schema change in `packages/db/src/schema/`.

### 4 — Start development servers

Open **two terminals**:

**Terminal 1 — Backend API** (http://localhost:8080):
```bash
pnpm --filter @workspace/api-server run dev
# or from the root: pnpm dev:backend
```

**Terminal 2 — Frontend** (http://localhost:3000):
```bash
PORT=3000 pnpm --filter @workspace/ytdown run dev
# or from the root: PORT=3000 pnpm dev:frontend
```

The frontend Vite dev server automatically proxies `/api/*` to `http://localhost:8080` (or `$BACKEND_PORT` if set). No need to set `VITE_API_URL` locally.

> **yt-dlp / FFmpeg:** make sure both are on your PATH, or set `YT_DLP_PATH` and `FFMPEG_PATH` in `.env`.

---

## Available commands

```bash
# Install all dependencies
pnpm install

# Start frontend dev server (port 3000)
PORT=3000 pnpm --filter @workspace/ytdown run dev  # or: pnpm dev:frontend

# Start backend dev server (port 8080)
pnpm --filter @workspace/api-server run dev        # or: pnpm dev:backend

# Type-check everything
pnpm run typecheck

# Build everything (typecheck + compile)
pnpm run build

# Push DB schema changes to your database
pnpm --filter @workspace/db run push

# Regenerate API client from OpenAPI spec
pnpm --filter @workspace/api-spec run codegen
```

---

## Environment variables reference

### Backend (`backend/`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | ✅ | — | Postgres connection string |
| `PORT` | no | `8080` | Port the API server listens on |
| `CORS_ORIGINS` | prod ✅ | *(see note)* | Comma-separated allowed origins. **Unset = allow all in dev; reject all in production.** Always set this in production. |
| `LOG_LEVEL` | no | `info` | Pino log level: `trace` / `debug` / `info` / `warn` / `error` |
| `YT_DLP_PATH` | no | `yt-dlp` | Absolute path to yt-dlp binary if not on `$PATH` |
| `FFMPEG_PATH` | no | `ffmpeg` | Absolute path to ffmpeg binary if not on `$PATH` |
| `DOWNLOADS_DIR` | no | `backend/downloads/` | Temporary storage for processed video files |

### Frontend (`frontend/`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | no | `3000` | Port the Vite dev server listens on |
| `BACKEND_PORT` | no | `8080` | Port of local API server — used by Vite's `/api/*` dev proxy |
| `BASE_PATH` | no | `/` | URL sub-path prefix (e.g. `/app` when deployed behind a reverse proxy) |
| `VITE_SITE_URL` | prod only | `https://ytoudown.com` | Public frontend URL used for canonical URLs and SEO meta tags |
| `VITE_API_URL` | prod only | *(same-origin)* | Public API server URL. Unset = use relative `/api/*` (proxied by Vite in dev, same-origin in prod) |

---

## Deployment

### Frontend → Vercel

1. Import the repo in Vercel
2. Set **Build Command**: `pnpm --filter @workspace/ytdown run build`
3. Set **Output Directory**: `frontend/dist/public`
4. Set **Install Command**: `pnpm install`
5. Add env var: `VITE_API_URL=https://your-api.onrender.com`

### Backend → Render (Docker)

1. Create a new **Web Service** from this repo
2. Set **Docker file path**: `./backend/Dockerfile`
3. Add env vars: `DATABASE_URL` (Render can auto-provision Postgres), `CORS_ORIGINS`

See `render.yaml` for the full Render blueprint (auto-provisions Postgres).

---

## Making schema changes

1. Edit files in `packages/db/src/schema/`
2. Run `pnpm --filter @workspace/db run push` to apply to your local database
3. In production, run the push command against your production `DATABASE_URL`

## Regenerating the API client

If you change `packages/api-spec/openapi.yaml`:

```bash
pnpm --filter @workspace/api-spec run codegen
```

This regenerates `packages/api-zod/src/` and `packages/api-client/src/`.
