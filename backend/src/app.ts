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
// In dev (tsx, __dirname = backend/src) and in production esbuild bundle
// (backend/dist/index.mjs), ../../ resolves to the monorepo root.
// The Vite build outputs to <repo-root>/public — Vercel's default output dir.
// The backend references the same path for single-host self-serve setups.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendDist = path.join(__dirname, "..", "..", "public");

// ─── Trust proxy ─────────────────────────────────────────────────────────────
// Required for express-rate-limit to read X-Forwarded-For correctly when
// running behind a reverse proxy, load balancer, or CDN.
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
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        // Do NOT add scriptSrcElem — browsers prefer it over scriptSrc for
        // <script> elements, which would block inline scripts (e.g. JSON-LD).
        scriptSrc: [
          "'self'",
          "https://www.googletagmanager.com",
          "https://pagead2.googlesyndication.com",
          "https://adservice.google.com",
          "'unsafe-inline'",
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://fonts.googleapis.com",
        ],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "blob:", "https:"],
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
// CORS_ORIGINS unset in production = reject all cross-origin browser requests.
// In development = allow all origins for convenience.
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

app.use("/api", cors({ origin: corsOrigin }));
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(globalLimiter);

// ─── API routes ──────────────────────────────────────────────────────────────
app.use("/api", router);

// ─── Serve built React app (production only) ─────────────────────────────────
// In development the Vite dev server owns the frontend.
// In production (NODE_ENV=production) Express serves the static assets and
// provides the SPA index.html fallback for client-side routing.
const frontendIndexPath = path.join(frontendDist, "index.html");
const serveStaticFrontend = isProduction && fs.existsSync(frontendIndexPath);

if (serveStaticFrontend) {
  app.use(
    express.static(frontendDist, {
      maxAge: "1y",
      etag: true,
      index: false,
      immutable: true,
    }),
  );
} else if (isProduction) {
  logger.warn(
    { frontendDist },
    "Frontend dist not found. Run `pnpm build` before starting in production.",
  );
}

// API 404 — unmatched /api/* routes return JSON, not HTML.
app.use("/api", (_req, res) => {
  res.status(404).json({ error: "Not found" });
});

// SPA fallback — serve index.html for all unmatched GET requests so that
// wouter handles client-side navigation correctly.
if (serveStaticFrontend) {
  app.use((req, res, next) => {
    if (req.method !== "GET") return next();
    if (req.path.startsWith("/api/") || req.path === "/api") return next();
    res.sendFile(frontendIndexPath, (err) => {
      if (err) next(err);
    });
  });
}

// Final catch-all — structured JSON response for any unmatched request.
app.use((_req, res) => {
  res.status(404).json({
    service: "YTDown API",
    status: "ok",
    note: "This is the API server. All endpoints are under /api.",
  });
});

export default app;
