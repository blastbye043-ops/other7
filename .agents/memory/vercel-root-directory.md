---
name: Vercel Root Directory = frontend/
description: This Vercel project has Root Directory set to frontend/ — all commands run from there, not the repo root.
---

# Vercel Root Directory is `frontend/`

All Vercel commands (installCommand, buildCommand) run from `/vercel/path0/frontend/`, not the repo root.

**Why:** The Vercel project was configured with Root Directory = `frontend/` in the dashboard. This caused every `frontend/dist` path in `outputDirectory` to resolve as `frontend/frontend/dist` — never found. `cd frontend` in buildCommand also fails because we're already inside it.

**How to apply:**
- `installCommand`: must `cd ..` first to reach the repo root for workspace installs: `cd .. && pnpm install`
- `buildCommand`: runs directly from `frontend/` — no `cd` needed: `pnpm run build && cp -r dist _site`
- `outputDirectory`: relative to `frontend/` — use simple names like `_site` or `dist`, never `frontend/dist`
- `vite.config.ts` `outDir`: use `process.cwd()` not `import.meta.dirname` — Vite 7 bundles the config via esbuild into a temp location making `import.meta.dirname` unreliable; `process.cwd()` correctly returns the package directory when pnpm runs the script
