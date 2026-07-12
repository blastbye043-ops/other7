import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";
import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { globalLimiter } from "./middlewares/rate-limit";

const app: Express = express();

// ─── Path helpers ────────────────────────────────────────────────────────────
// Works in both dev (tsx, __dirname = backend/src) and production esbuild
// bundle (backend/dist/index.mjs). Either way, ../../ resolves to the
// monorepo root, and frontend/dist/public is the built React app.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendDist = path.join(__dirname, "..", "..", "frontend", "dist", "public");

// ─── Trust proxy ─────────────────────────────────────────────────────────────
// Required for express-rate-limit to read X-Forwarded-For correctly when
// running behind Replit's reverse proxy, Render, or any load balancer.
app.set("trust proxy", 1);

// ─── Request logging ─────────────────────────────────────────────────────────
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);

// ─── Security headers ─────────────────────────────────────────────────────────
// CSP is permissive enough to serve the React SPA and Google services while
// still blocking XSS and clickjacking.
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        // scriptSrc covers both inline and external <script> elements.
        // Do NOT add a scriptSrcElem directive — when present, browsers use it
        // instead of scriptSrc for <script> elements, which would block the
        // inline gtag Consent Mode v2 bootstrap in index.html.
        scriptSrc: [
          "'self'",
          // Google Tag Manager / Consent Mode v2
          "https://www.googletagmanager.com",
          // Google AdSense
          "https://pagead2.googlesyndication.com",
          "https://adservice.google.com",
          // Required for the inline gtag consent-default bootstrap in index.html
          // and the JSON-LD structured data blocks.
          "'unsafe-inline'",
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",                    // Tailwind / CSS-in-JS
          "https://fonts.googleapis.com",
        ],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: [
          "'self'",
          "data:",
          "blob:",
          "https:",                              // YouTube thumbnails, etc.
        ],
        connectSrc: [
          "'self'",
          "https://www.google-analytics.com",
          "https://analytics.google.com",
          "https://www.googletagmanager.com",
          "https://pagead2.googlesyndication.com",
          "https://region1.google-analytics.com",
        ],
        frameSrc: [
          "https://googleads.g.doubleclick.net",
          "https://tpc.googlesyndication.com",
        ],
        mediaSrc: ["'self'", "blob:"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: { policy: "same-origin" },
    crossOriginResourcePolicy: { policy: "cross-origin" },
    dnsPrefetchControl: { allow: false },
    frameguard: { action: "deny" },
    hidePoweredBy: true,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    ieNoOpen: true,
    noSniff: true,
    originAgentCluster: true,
    permittedCrossDomainPolicies: { permittedPolicies: "none" },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    xssFilter: true,
  }),
);

// ─── CORS ────────────────────────────────────────────────────────────────────
// Unset CORS_ORIGINS in production = reject all cross-origin browser requests
// (fails closed). In development = allow all origins.
const rawCorsOrigins = process.env.CORS_ORIGINS;
const isProduction = process.env.NODE_ENV === "production";

let corsOrigin: cors.CorsOptions["origin"];
if (rawCorsOrigins) {
  corsOrigin = rawCorsOrigins.split(",").map((s) => s.trim()).filter(Boolean);
} else if (isProduction) {
  logger.warn(
    "CORS_ORIGINS is not set — rejecting all cross-origin browser requests until it is configured.",
  );
  corsOrigin = false;
} else {
  corsOrigin = true;
}

// Only apply CORS to /api routes — static assets don't need it.
app.use("/api", cors({ origin: corsOrigin }));
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(globalLimiter);

// ─── API routes ──────────────────────────────────────────────────────────────
app.use("/api", router);

// ─── Serve built React app (production only) ─────────────────────────────────
// In development the Vite dev server owns the frontend; the Express backend
// only needs to handle /api/* routes.  Attempting to serve a non-existent
// dist directory floods logs with ENOENT errors and serves nothing useful.
//
// In production (NODE_ENV=production) the frontend must be built first
// (`pnpm build`), after which Express serves the static assets and provides
// the SPA index.html fallback for client-side routing (wouter).
const frontendIndexPath = path.join(frontendDist, "index.html");
const serveStaticFrontend = isProduction && fs.existsSync(frontendIndexPath);

if (serveStaticFrontend) {
  // Static assets — long-lived cache, content-hashed filenames from Vite build.
  app.use(
    express.static(frontendDist, {
      maxAge: "1y",
      etag: true,
      index: false,    // Let the SPA catch-all below handle /
      immutable: true,
    }),
  );
} else if (isProduction) {
  // Production but dist is missing — warn loudly so it's obvious.
  logger.warn(
    { frontendDist },
    "Frontend dist not found. Run `pnpm build` before starting in production.",
  );
}

// API 404 — unmatched /api/* routes return JSON, not HTML, so API clients
// get proper error semantics rather than the SPA index.html.
app.use("/api", (_req, res) => {
  res.status(404).json({ error: "Not found" });
});

// SPA fallback — serve index.html for all unmatched GET requests so that
// React Router (wouter) handles client-side navigation correctly.
// Only active in production with a built frontend present.
// Skips /api paths (already handled above) so a broken API path never
// accidentally returns HTML.
if (serveStaticFrontend) {
  app.use((req, res, next) => {
    if (req.method !== "GET") return next();
    if (req.path.startsWith("/api/") || req.path === "/api") return next();
    res.sendFile(frontendIndexPath, (err) => {
      if (err) next(err);
    });
  });
}

// Final catch-all — replaces Express's default "Cannot GET /" with a
// structured JSON response. This fires whenever a request reaches the API
// server but doesn't match any route: Render / Replit health probes at /,
// the /api preview URL in Replit, or any direct browser access to the API.
app.use((_req, res) => {
  res.status(404).json({
    service: "YTDown API",
    status: "ok",
    note: "This is the API server. All endpoints are under /api.",
  });
});

export default app;
