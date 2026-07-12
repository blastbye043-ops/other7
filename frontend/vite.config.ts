import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig(({ command }) => {
  const rawPort = process.env.PORT;
  let port = 3000;
  if (rawPort) {
    const parsed = Number(rawPort);
    if (Number.isNaN(parsed) || parsed <= 0) {
      throw new Error(`Invalid PORT value: "${rawPort}"`);
    }
    port = parsed;
  }

  const basePath = process.env.BASE_PATH ?? "/";

  // Resolve the repo root (one level above frontend/)
  const repoRoot = path.resolve(import.meta.dirname, "..");

  return {
    base: basePath,
    plugins: [
      react(),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "src"),
        "@assets": path.resolve(repoRoot, "attached_assets"),
      },
      dedupe: ["react", "react-dom"],
    },
    root: path.resolve(import.meta.dirname),
    build: {
      // Use process.cwd() instead of import.meta.dirname — pnpm guarantees
      // CWD is the package directory (frontend/) when running scripts, making
      // this reliable across all environments including Vercel's build sandbox
      // where import.meta.dirname can resolve incorrectly.
      outDir: path.resolve(process.cwd(), "dist"),
      emptyOutDir: true,
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("node_modules/react/") || id.includes("node_modules/react-dom/")) {
              return "vendor-react";
            }
            if (id.includes("node_modules/@radix-ui/")) {
              return "vendor-radix";
            }
            if (id.includes("node_modules/@tanstack/")) {
              return "vendor-query";
            }
            if (id.includes("node_modules/lucide-react/")) {
              return "vendor-icons";
            }
            if (id.includes("node_modules/framer-motion/")) {
              return "vendor-motion";
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
      fs: { strict: false },
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
