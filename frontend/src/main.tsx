import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { setBaseUrl } from "@workspace/api-client-react";
import { ErrorBoundary } from "@/components/error-boundary";

// In production, point the API client at the deployed API server.
// Set VITE_API_URL in your deployment environment (e.g. https://api.yourdomain.com).
// Leave unset to use same-origin API calls (e.g. when running the API and frontend
// on the same host, or when Vercel rewrites /api/* to the API server).
const apiUrl = import.meta.env.VITE_API_URL as string | undefined;
if (apiUrl) {
  const clean = apiUrl.replace(/\/+$/, "");
  setBaseUrl(clean);

  // Warm up the TCP + TLS connection to the API origin so the first /api/video/info
  // request doesn't pay the full connection-establishment cost.
  // Only needed when the API is cross-origin (VITE_API_URL is set); same-origin
  // requests reuse the existing connection automatically.
  try {
    const origin = new URL(clean).origin;
    const link = document.createElement("link");
    link.rel = "preconnect";
    link.href = origin;
    link.crossOrigin = "anonymous";
    document.head.appendChild(link);
  } catch {
    // Malformed VITE_API_URL — skip preconnect, API calls will still work.
  }
}

const container = document.getElementById("root");
if (!container) {
  throw new Error(
    '[YTOUDown] Root element #root not found. The HTML template may be missing <div id="root">.',
  );
}

createRoot(container).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
);
