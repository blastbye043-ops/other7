---
name: Replit Vite HMR fix
description: How to fix Vite HMR WebSocket failing in Replit's HTTPS/WSS proxied environment
---

# Replit Vite HMR WebSocket Fix

## The rule
Add `hmr: { clientPort: 443 }` to `vite.config.ts` server config, gated on `REPLIT_DOMAINS` env var so it only applies in Replit.

```ts
server: {
  ...(process.env.REPLIT_DOMAINS ? { hmr: { clientPort: 443 } } : {}),
}
```

**Why:** Replit proxies all traffic through port 443 (HTTPS/WSS). Without this, the browser tries to open the HMR WebSocket to the local dev port (e.g. 25301) directly, which fails because the proxy doesn't forward WebSocket connections that way. The fix tells the browser's HMR client to connect on port 443 instead.

**How to apply:** Any Vite app running inside Replit that shows "failed to connect to websocket" in the browser console with a mismatch between the external Replit domain and the local port.

## First-time setup
When a pnpm workspace project is imported (zip upload), `node_modules` won't exist. Run `pnpm install` from the workspace root before starting any workflows.
