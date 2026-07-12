import { useState, useEffect, useRef } from "react";
import { Cookie, Settings, X, CheckCheck } from "lucide-react";

interface CookieBannerProps {
  onAcceptAll: () => void;
  onRejectAll: () => void;
  onOpenSettings: () => void;
}

/**
 * CookieBanner — floating card at the bottom of the screen.
 *
 * Design: white card on dark background so it is unmissable.
 * Animates in (slide-up + fade) on mount and out on dismiss.
 * z-index 9999 keeps it above nav, sidebars, ads, and popups.
 * Fully accessible: keyboard nav, ARIA labels, visible focus rings,
 * large touch targets (min 44 px height on mobile).
 */
export function CookieBanner({
  onAcceptAll,
  onRejectAll,
  onOpenSettings,
}: CookieBannerProps) {
  // Two-phase animation: enter (slide up) then exit (slide down).
  const [phase, setPhase] = useState<"entering" | "visible" | "exiting">("entering");
  const acceptRef = useRef<HTMLButtonElement>(null);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cancel any pending dismiss timer on unmount to prevent state updates after teardown.
  useEffect(() => {
    return () => {
      if (dismissTimer.current !== null) clearTimeout(dismissTimer.current);
    };
  }, []);

  // Trigger enter animation after first paint.
  useEffect(() => {
    const id = requestAnimationFrame(() => setPhase("visible"));
    return () => cancelAnimationFrame(id);
  }, []);

  // Focus "Accept All" after the banner becomes visible for screen-reader UX.
  useEffect(() => {
    if (phase !== "visible") return;
    const t = setTimeout(() => acceptRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, [phase]);

  /** Run exit animation then invoke the callback. */
  const dismiss = (callback: () => void) => {
    setPhase("exiting");
    dismissTimer.current = setTimeout(callback, 300);
  };

  const isEntering = phase === "entering";
  const isExiting = phase === "exiting";

  return (
    // Overlay container — full-width, positions the floating card.
    <div
      role="dialog"
      aria-label="Cookie consent"
      aria-modal="false"
      aria-live="polite"
      style={{ zIndex: 9999 }}
      className="fixed bottom-0 left-0 right-0 flex justify-center items-end pb-4 px-3 sm:px-4 pointer-events-none"
    >
      {/* Floating card */}
      <div
        className="pointer-events-auto w-full"
        style={{
          maxWidth: "780px",
          background: "#FFFFFF",
          border: "1px solid #D1D5DB",
          borderRadius: "14px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.10)",
          color: "#111827",
          // Slide-up / slide-down + fade transition
          transform: isEntering || isExiting ? "translateY(16px)" : "translateY(0)",
          opacity: isEntering || isExiting ? 0 : 1,
          transition: "transform 300ms cubic-bezier(0.22,1,0.36,1), opacity 280ms ease",
        }}
      >
        <div className="px-5 py-4 sm:px-6 sm:py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">

            {/* Icon + text */}
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <Cookie
                aria-hidden="true"
                className="w-5 h-5 shrink-0 mt-0.5"
                style={{ color: "#2563EB" }}
              />
              <div className="min-w-0">
                <p className="text-sm font-semibold" style={{ color: "#111827" }}>
                  We use cookies
                </p>
                <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "#374151" }}>
                  We use cookies for analytics, advertising, and to remember your
                  preferences. You can customise your choices below.{" "}
                  <button
                    onClick={onOpenSettings}
                    className="hover:underline focus:outline-none focus-visible:underline rounded"
                    style={{ color: "#2563EB" }}
                    aria-label="Open cookie settings to learn more"
                  >
                    Learn more
                  </button>
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-2 shrink-0 sm:flex-row sm:items-center">

              {/* Cookie Settings — grey background */}
              <button
                onClick={onOpenSettings}
                aria-label="Customise cookie settings"
                className="
                  inline-flex items-center justify-center gap-1.5
                  px-4 min-h-[44px] sm:min-h-[36px] rounded-lg
                  text-sm font-medium
                  transition-colors duration-150
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1
                "
                style={{
                  background: "#F3F4F6",
                  color: "#374151",
                  border: "1px solid #D1D5DB",
                  // focus ring color
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  ["--tw-ring-color" as any]: "#2563EB",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "#E5E7EB";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "#F3F4F6";
                }}
              >
                <Settings aria-hidden="true" className="w-3.5 h-3.5" />
                Cookie Settings
              </button>

              {/* Reject Non-Essential — white with grey border */}
              <button
                onClick={() => dismiss(onRejectAll)}
                aria-label="Reject non-essential cookies"
                className="
                  inline-flex items-center justify-center gap-1.5
                  px-4 min-h-[44px] sm:min-h-[36px] rounded-lg
                  text-sm font-medium
                  transition-colors duration-150
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1
                "
                style={{
                  background: "#FFFFFF",
                  color: "#374151",
                  border: "1px solid #D1D5DB",
                  ["--tw-ring-color" as any]: "#2563EB",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "#F9FAFB";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "#9CA3AF";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "#FFFFFF";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "#D1D5DB";
                }}
              >
                <X aria-hidden="true" className="w-3.5 h-3.5" />
                Reject Non-Essential
              </button>

              {/* Accept All — blue primary */}
              <button
                ref={acceptRef}
                onClick={() => dismiss(onAcceptAll)}
                aria-label="Accept all cookies"
                className="
                  inline-flex items-center justify-center gap-1.5
                  px-4 min-h-[44px] sm:min-h-[36px] rounded-lg
                  text-sm font-medium text-white
                  transition-colors duration-150
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1
                "
                style={{
                  background: "#2563EB",
                  border: "1px solid transparent",
                  ["--tw-ring-color" as any]: "#2563EB",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "#1D4ED8";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "#2563EB";
                }}
              >
                <CheckCheck aria-hidden="true" className="w-3.5 h-3.5" />
                Accept All
              </button>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
