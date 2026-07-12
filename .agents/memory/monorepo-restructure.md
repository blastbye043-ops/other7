---
name: Monorepo restructure — Replit to standard layout
description: How the project was moved from artifacts/lib Replit layout to frontend/backend/packages; key gotchas and final working config.
---

## Rule
After moving workspace package directories, always delete all node_modules and pnpm-lock.yaml and reinstall from scratch. pnpm's symlinks embed relative paths and go stale on directory moves — partial reinstall does not fix broken @types symlinks.

**Why:** Moving `artifacts/api-server` → `backend` left `backend/node_modules/@types/express` as a broken symlink. TypeScript's TS7016 appeared to be a config issue but was actually a broken symlink. Diagnosis: `readlink` + `cat package.json` on the symlink target returned ENOENT.

**How to apply:** Whenever renaming/moving a pnpm workspace package directory:
```bash
find . -name "node_modules" -not -path "*/.pnpm/*" -maxdepth 4 -exec rm -rf {} + 2>/dev/null
rm -f pnpm-lock.yaml
pnpm install
```

## Final directory layout
```
frontend/            @workspace/ytdown       — React 19 + Vite 7
backend/             @workspace/api-server   — Express 5 + tsx watch
packages/db/         @workspace/db           — Drizzle ORM + PostgreSQL
packages/api-zod/    @workspace/api-zod      — Zod schemas (OpenAPI generated)
packages/api-client/ @workspace/api-client   — TanStack Query hooks
packages/api-spec/   @workspace/api-spec     — OpenAPI spec + Orval codegen
```

## Orval codegen paths
`packages/api-spec/orval.config.ts` still pointed at the pre-restructure `lib/api-client-react` / `lib/api-zod` paths after the move to `packages/api-client` / `packages/api-zod`. Codegen silently failed on the react-query client (ENOENT on custom-fetch.ts) until the config's `root`-relative paths were updated to `packages/api-client` and `packages/api-zod`.

**Why:** the restructure moved directories but did not touch tool configs that reference paths by string (orval.config.ts, similar codegen configs elsewhere).

**How to apply:** after any package rename/move, grep for the old directory name across config files (`orval.config.ts`, `tsconfig.json` references, etc.), not just `package.json`/imports.

## Key config decisions
- `backend/tsconfig.json`: `"types": ["node"]` overrides base `"types": []` so @types/express etc. are found.
- `backend/src/index.ts`: Express 5 changed `app.listen` callback — no `err` param. Use `server.on("error", ...)` instead.
- `backend/package.json` dev script: `tsx watch src/index.ts` — no `--env-file` flag (fails when .env absent).
- Frontend Vite proxy: `/api → http://localhost:${BACKEND_PORT ?? 8080}` so VITE_API_URL is not needed in local dev.
- PORT defaults: backend defaults to 8080; frontend reads PORT env var, defaults to 3000 locally.
- CORS_ORIGINS unset: allow-all in dev context, reject-all in production (fails closed by design).
- Root package.json convenience scripts: `dev:frontend` → `@workspace/ytdown`, `dev:backend` → `@workspace/api-server`.
