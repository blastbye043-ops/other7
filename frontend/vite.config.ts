import { defineConfig, type Plugin, type ResolvedConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import fs from "node:fs/promises";

/**
 * Vite plugin: inline critical CSS + defer the rest.
 *
 * Runs only during `vite build`. After the bundle is written, it passes
 * the built index.html through Google's `critters` library which:
 *  1. Reads the linked CSS file(s) from disk.
 *  2. Determines which rules apply to the HTML as-rendered (`:root`,
 *     `html`, `body`, `*`, plus all CSS custom-property declarations).
 *  3. Inlines those rules as a `<style>` tag in `<head>`.
 *  4. Converts the original `<link rel="stylesheet">` to a non-blocking
 *     preload so the remaining CSS loads without delaying FCP.
 *
 * For a Tailwind SPA the most valuable inlined rules are the `:root`
 * custom-property declarations (all color tokens, radius, font vars) which
 * are applied to `:root` and therefore always matched, regardless of whether
 * the page is server-rendered. This eliminates the flash of unstyled custom
 * properties before the 181 KB stylesheet finishes downloading.
 */
function inlineCriticalCss(): Plugin {
  let config: ResolvedConfig;
  return {
    name: "inline-critical-css",
    apply: "build",
    configResolved(resolved) {
      config = resolved;
    },
    async closeBundle() {
      const outDir = config.build.outDir as string;
      const htmlPath = path.join(outDir, "index.html");
      try {
        // Dynamic import so the module is only loaded during builds and
        // doesn't affect dev-server startup time.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const CrittersModule = await import("critters") as any;
        const Critters = CrittersModule.default ?? CrittersModule;
        const critters = new Critters({
          path: outDir,
          publicPath: config.base,
          // 'swap' uses the loadCSS pattern: keeps the full stylesheet but
          // makes it non-blocking while the inlined critical CSS handles FCP.
          preload: "swap",
          // Font handling is done separately via self-hosted @fontsource files.
          fonts: false,
          // Don't remove rules from the source stylesheet — only add the
          // inline <style>; the full sheet is still loaded for correctness.
          pruneSource: false,
          logLevel: "warn",
        });
        const html = await fs.readFile(htmlPath, "utf-8");
        const inlined = await critters.process(html);
        await fs.writeFile(htmlPath, inlined);
        config.logger.info("✓ Critical CSS inlined (critters)");
      } catch (err) {
        // Non-fatal: if critters fails (e.g. malformed CSS) the full
        // stylesheet is still linked and the site works correctly.
        config.logger.warn(`[inline-critical-css] Skipped: ${err}`);
      }
    },
  };
}

export default defineConfig(async ({ command }) => {
  const isBuild = command === "build";

  // PORT defaults to 3000 when not set (local dev, build, preview).
  // In production-like environments (Render, Railway, etc.) PORT is injected by the platform.
  const rawPort = process.env.PORT;
  let port = 3000;

  if (rawPort) {
    const parsed = Number(rawPort);
    if (Number.isNaN(parsed) || parsed <= 0) {
      throw new Error(`Invalid PORT value: "${rawPort}"`);
    }
    port = parsed;
  }

  // BASE_PATH defaults to "/" for local dev and Vercel root deployments.
  const basePath = process.env.BASE_PATH ?? "/";

  return {
    base: basePath,
    plugins: [
      react(),
      tailwindcss(),
      inlineCriticalCss(),
    ],
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "src"),
        "@assets": path.resolve(import.meta.dirname, "..", "attached_assets"),
      },
      dedupe: ["react", "react-dom"],
    },
    root: path.resolve(import.meta.dirname),
    build: {
      outDir: path.resolve(import.meta.dirname, "dist/public"),
      emptyOutDir: true,
      // Keep chunks reasonably sized without over-splitting.
      // Stable vendor chunks (react, radix) get long-lived cache headers.
      rollupOptions: {
        output: {
          manualChunks(id) {
            // React core — changes rarely, deserves its own cache bucket.
            if (id.includes("node_modules/react/") || id.includes("node_modules/react-dom/")) {
              return "vendor-react";
            }
            // Radix UI primitives — large and stable.
            if (id.includes("node_modules/@radix-ui/")) {
              return "vendor-radix";
            }
            // TanStack Query — changes infrequently.
            if (id.includes("node_modules/@tanstack/")) {
              return "vendor-query";
            }
            // Lucide icons — large icon set, better isolated.
            if (id.includes("node_modules/lucide-react/")) {
              return "vendor-icons";
            }
          },
        },
      },
    },
    server: {
      port,
      strictPort: true,
      host: "0.0.0.0",
      allowedHosts: true,
      fs: { strict: true },
      // Replit proxies traffic through port 443 (HTTPS/WSS), so the HMR
      // WebSocket must connect to that port instead of the local dev port.
      // Only applied when running inside Replit (REPLIT_DOMAINS is set).
      ...(process.env.REPLIT_DOMAINS ? { hmr: { clientPort: 443 } } : {}),
      // In local dev, proxy /api/* to the backend so the frontend can use
      // relative URLs without setting VITE_API_URL.
      proxy: {
        "/api": {
          target: `http://localhost:${process.env.BACKEND_PORT ?? 8080}`,
          changeOrigin: true,
        },
      },
    },
    preview: {
      port,
      host: "0.0.0.0",
      allowedHosts: true,
    },
  };
});
