---
name: DB optional pattern
description: How the DB package and download pipeline handle missing DATABASE_URL gracefully
---

# DB Optional Pattern

## The rule
`packages/db/src/index.ts` exports `db` and `pool` as **nullable** (`null` when `DATABASE_URL` is not set). Callers must guard with `if (!db)` before use. The module logs a warning instead of throwing.

**Why:** The original code threw at module import time when `DATABASE_URL` was missing. This crashed `backend/src/routes/video.ts` at startup — the entire download route failed to register, so no downloads were possible even though downloading needs no database.

**How to apply:** Any new feature that optionally uses the database should import `db` from `@workspace/db`, guard with `if (!db)`, and never let a DB failure block the core user action.

## Fire-and-forget analytics pattern (recordDownloadAsync)
In `backend/src/routes/video.ts`, analytics writes use this pattern:
```ts
function recordDownloadAsync(data: { ... }): void {
  if (!db) return;               // DB not configured — skip silently
  try {
    db.insert(table).values(data)
      .catch((err: unknown) => { logger.error({ err }, "...non-critical..."); });
  } catch (err: unknown) {
    logger.error({ err }, "...non-critical...");  // catches sync exceptions too
  }
}
```
- Never awaited — never blocks the download job state machine
- Job status is set to "done" BEFORE calling recordDownloadAsync
- Both sync exceptions (query-builder) and async rejections (network) are caught

## History routes (history.ts)
Each handler checks `if (!db)` at the top and returns `503` with a clear message when DB is unavailable. History/stats are optional; downloading is not.
