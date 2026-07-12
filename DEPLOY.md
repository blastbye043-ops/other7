# YTDown — Deployment Guide

This guide covers deploying YTDown to production:
- **Frontend** → [Vercel](https://vercel.com) (static SPA)
- **Backend** → [Render](https://render.com) (Dockerized Node.js API with yt-dlp + ffmpeg)

The two services are deployed separately. The frontend calls the backend via `VITE_API_URL`.

---

## Architecture Overview

```
Browser
  │
  ├─► Vercel (frontend)
  │     └─ Static React SPA (frontend/dist/public/)
  │         └─► VITE_API_URL ──────────────────────────────┐
  │                                                         │
  └─────────────────────────────────────────────────────────▼
                                              Render (backend API)
                                                Docker container
                                                yt-dlp + ffmpeg + Express
                                                └─► PostgreSQL (optional)
```

---

## Part 1 — Deploy the Backend to Render

The backend requires Docker because yt-dlp and ffmpeg must be bundled in the image.

### Option A: Render Blueprint (Automatic)

1. Fork or clone this repo to your GitHub account
2. Go to [Render Dashboard](https://dashboard.render.com) → **New** → **Blueprint**
3. Connect your GitHub repo
4. Render will detect `render.yaml` and auto-create:
   - A Docker web service (`ytoudown-api`)
   - A free PostgreSQL database (`ytoudown-db`)
   - Wire `DATABASE_URL` automatically
5. After the first deploy, go to your service → **Environment** and add:
   ```
   CORS_ORIGINS=https://your-app.vercel.app
   ```

### Option B: Manual Render Setup

1. Go to [Render Dashboard](https://dashboard.render.com) → **New** → **Web Service**
2. Connect your GitHub repo
3. Configure:
   - **Environment**: Docker
   - **Dockerfile Path**: `./backend/Dockerfile`
   - **Docker Build Context**: `.` (repo root — required for workspace packages)
   - **Health Check Path**: `/api/healthz`
4. Add environment variables:
   ```
   NODE_ENV=production
   DATABASE_URL=<your postgres connection string>
   CORS_ORIGINS=https://your-app.vercel.app
   PORT=8080
   ```
5. (Optional) Create a PostgreSQL database in Render and link it

### Backend Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | ✅ | Set to `production` |
| `DATABASE_URL` | optional | Postgres connection string. Omit to disable history |
| `CORS_ORIGINS` | ✅ prod | Comma-separated allowed frontend origins |
| `PORT` | — | Render sets this automatically; default `8080` |
| `YT_DLP_PATH` | — | Dockerfile sets `/usr/local/bin/yt-dlp` |
| `FFMPEG_PATH` | — | Dockerfile sets `/usr/bin/ffmpeg` |
| `DOWNLOADS_DIR` | — | Defaults to OS temp dir |
| `LOG_LEVEL` | — | `info` (default) |

---

## Part 2 — Deploy the Frontend to Vercel

### Step-by-Step

1. Go to [Vercel Dashboard](https://vercel.com/dashboard) → **Add New** → **Project**
2. Import your GitHub repository
3. Configure the project:
   - **Framework Preset**: Other
   - **Build Command**: `pnpm --filter @workspace/ytdown run build`
   - **Output Directory**: `frontend/dist/public`
   - **Install Command**: `pnpm install`
4. Add environment variables (under **Settings → Environment Variables**):
   ```
   VITE_API_URL=https://ytoudown-api.onrender.com
   VITE_SITE_URL=https://your-app.vercel.app
   ```
   Replace `ytoudown-api.onrender.com` with your actual Render service URL.
5. Click **Deploy**

> The `vercel.json` in the repo root already configures SPA routing rewrites,
> caching headers, and security headers. No extra Vercel config is needed.

### Frontend Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | ✅ | Full URL of your Render backend, e.g. `https://ytoudown-api.onrender.com` |
| `VITE_SITE_URL` | optional | Your Vercel domain for SEO canonical URLs |

---

## Part 3 — After Both Are Deployed

### 1. Set CORS on Render

In your Render service → **Environment**, set:
```
CORS_ORIGINS=https://your-app.vercel.app
```

If you have a custom domain on Vercel, include both:
```
CORS_ORIGINS=https://your-app.vercel.app,https://yourdomain.com
```

Then click **Save Changes** — Render will redeploy automatically.

### 2. Verify the Deployment

Test the API health check:
```bash
curl https://ytoudown-api.onrender.com/api/healthz
# Expected: {"status":"ok"}
```

Test the frontend:
- Open `https://your-app.vercel.app`
- Paste a YouTube URL and click Fetch
- Verify video info loads and download works

### 3. Apply Database Schema to Production

If you provisioned a Postgres database on Render:
```bash
# Run from your local machine against production DB
DATABASE_URL="<your render postgres url>" pnpm --filter @workspace/db run push
```

Or use Render's shell feature to run this directly on the server.

---

## Custom Domain (Optional)

### Vercel Custom Domain
1. Vercel Dashboard → your project → **Settings** → **Domains**
2. Add your domain and follow DNS instructions
3. Update `CORS_ORIGINS` on Render to include the new domain
4. Update `VITE_SITE_URL` in Vercel environment variables

### Render Custom Domain
1. Render Dashboard → your service → **Settings** → **Custom Domain**
2. Add your domain and follow DNS instructions
3. Update `VITE_API_URL` in Vercel environment variables to the new domain

---

## Local Production Test

Test the full production build locally before deploying:

```bash
# 1. Build everything
pnpm build

# 2. Start the backend in production mode
#    (serves frontend too since it reads frontend/dist/public/)
NODE_ENV=production DATABASE_URL="..." pnpm start

# 3. Open http://localhost:8080
```

---

## Troubleshooting

### Frontend shows blank page / 404 on refresh
- The `vercel.json` SPA rewrites handle this. If you bypassed `vercel.json`, ensure your Vercel project settings are correct.

### "CORS error" in browser console
- Ensure `CORS_ORIGINS` on Render matches your Vercel domain exactly (no trailing slash)
- Double-check `VITE_API_URL` in Vercel matches your Render service URL

### "yt-dlp not found" error
- The Dockerfile installs yt-dlp at `/usr/local/bin/yt-dlp` and sets `YT_DLP_PATH`
- If this error appears, the Docker build may have failed — check Render's build logs

### API is slow on first request (cold start)
- Render's free tier hibernates services after 15 minutes of inactivity
- Upgrade to a paid Render instance for always-on availability, or use a cron job to ping `/api/healthz` every 10 minutes

### Database connection errors in production
- Verify `DATABASE_URL` is set correctly on Render
- Render's internal Postgres connection strings look like: `postgres://user:pass@host/dbname`
- Run schema migration: `DATABASE_URL="..." pnpm --filter @workspace/db run push`

---

## Re-deploying

### Frontend (Vercel)
Vercel automatically redeploys on every push to the main branch.

To deploy manually:
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from repo root
vercel --prod
```

### Backend (Render)
Render automatically redeploys on every push to the main branch.

To trigger a manual deploy: Render Dashboard → your service → **Manual Deploy** → **Deploy latest commit**.

---

## Environment Variable Quick Reference

### Vercel (Frontend)
```env
VITE_API_URL=https://ytoudown-api.onrender.com
VITE_SITE_URL=https://your-app.vercel.app
```

### Render (Backend)
```env
NODE_ENV=production
DATABASE_URL=postgres://user:pass@host:5432/dbname
CORS_ORIGINS=https://your-app.vercel.app
PORT=8080
LOG_LEVEL=info
```
