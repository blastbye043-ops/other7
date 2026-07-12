---
name: Backend serving frontend static files
description: Rules for having an Express backend serve the built React SPA — CSP gotchas, SPA catch-all ordering, and path resolution.
---

## Rule

When Express serves a built React (Vite) SPA alongside an API, three things must hold:

1. **Do not set `scriptSrcElem` in the Helmet CSP when inline scripts exist.** Modern browsers use `script-src-elem` *instead of* `script-src` for `<script>` elements when the directive is present. If `scriptSrcElem` lacks `'unsafe-inline'`, inline `<script>` blocks (like the Consent Mode v2 bootstrap in index.html) are blocked even though `scriptSrc` allows them. Fix: omit `scriptSrcElem` entirely; put everything — including `'unsafe-inline'` — in `scriptSrc`.

2. **SPA catch-all must explicitly skip `/api` paths.** The fallback middleware that returns `index.html` for all unmatched GET requests will also match unknown `/api/*` routes unless guarded: `if (req.path.startsWith('/api/') || req.path === '/api') return next();`. Without this, broken API calls silently return 200 HTML, masking errors.

3. **Add an explicit API 404 handler before the SPA catch-all.** Mount `app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }))` after the main API router so clients always get JSON for unrecognised endpoints.

## Why
- Google Consent Mode v2 bootstrap must execute before any measurement script. If the inline script is CSP-blocked, all consent signals are lost and the site may be non-compliant.
- API clients (curl, fetch) that expect JSON 404 will break silently if they receive 200 HTML instead.

## How to apply
- Any time `scriptSrcElem` is tempting (to lock down third-party script sources), add the third-party host to `scriptSrc` instead, and do not add `scriptSrcElem`.
- Static file serving order: `express.static(frontendDist)` → API 404 handler → SPA fallback (GET only, skipping /api).
- Path from `backend/src/app.ts` or `backend/dist/index.mjs` to the built frontend: `path.join(import.meta.dirname, '../../frontend/dist/public')` — resolves to workspace root in both dev (tsx) and production (esbuild bundle) because directory depth from workspace root is the same for both.
