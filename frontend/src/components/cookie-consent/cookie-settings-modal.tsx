import { useState, useEffect, useRef } from "react";
import { X, CheckCheck, ShieldCheck, BarChart2, Megaphone, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ConsentPreferences } from "./types";

interface ToggleProps {
  id: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
  label: string;
}

function Toggle({ id, checked, disabled, onChange, label }: ToggleProps) {
  return (
    <button
      role="switch"
      id={id}
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={[
        "relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent",
        "transition-colors duration-200 ease-in-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        disabled
          ? "cursor-not-allowed opacity-50 bg-primary"
          : checked
          ? "cursor-pointer bg-primary"
          : "cursor-pointer bg-muted",
      ].join(" ")}
    >
      <span
        aria-hidden="true"
        className={[
          "pointer-events-none inline-block h-5 w-5 rounded-full bg-background shadow-lg",
          "transition-transform duration-200 ease-in-out",
          checked ? "translate-x-5" : "translate-x-0",
        ].join(" ")}
      />
    </button>
  );
}

interface CookieSettingsModalProps {
  open: boolean;
  initialPrefs: ConsentPreferences;
  onSave: (prefs: ConsentPreferences) => void;
  onAcceptAll: () => void;
  onRejectAll: () => void;
  onClose: () => void;
}

export function CookieSettingsModal({
  open,
  initialPrefs,
  onSave,
  onAcceptAll,
  onRejectAll,
  onClose,
}: CookieSettingsModalProps) {
  const [prefs, setPrefs] = useState<ConsentPreferences>(initialPrefs);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Sync prefs when modal opens
  useEffect(() => {
    if (open) {
      setPrefs(initialPrefs);
      // Focus close button when opened
      setTimeout(() => closeRef.current?.focus(), 50);
    }
  }, [open, initialPrefs]);

  // Trap focus inside modal and close on Escape
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const categories = [
    {
      key: "required" as const,
      icon: ShieldCheck,
      title: "Required Cookies",
      badge: "Always Active",
      description:
        "Essential for the website to function. They enable core features like security, session management, and your download history. These cannot be disabled.",
      always: true,
      value: true,
    },
    {
      key: "analytics" as const,
      icon: BarChart2,
      title: "Analytics Cookies",
      badge: null,
      description:
        "Help us understand how visitors use the site — which pages are popular, how long people stay, and where they come from. All data is aggregated and anonymous. Powered by Google Analytics.",
      always: false,
      value: prefs.analytics,
    },
    {
      key: "advertising" as const,
      icon: Megaphone,
      title: "Advertising Cookies",
      badge: null,
      description:
        "Allow Google AdSense to show personalised or non-personalised ads based on your consent. Includes ad measurement and conversion tracking. Rejecting will allow non-personalised ads only.",
      always: false,
      value: prefs.advertising,
    },
    {
      key: "functional" as const,
      icon: Star,
      title: "Functional Cookies",
      badge: null,
      description:
        "Remember your preferences such as language, theme, and recently used settings to improve your experience on return visits.",
      always: false,
      value: prefs.functional,
    },
  ] as const;

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cookie-settings-title"
        className={[
          "fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2",
          "max-h-[90dvh] overflow-y-auto",
          "rounded-xl border border-border/60 bg-background shadow-2xl",
          "animate-in zoom-in-95 fade-in duration-200",
        ].join(" ")}
      >
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between px-6 py-4 border-b border-border/40 bg-background z-10">
          <h2 id="cookie-settings-title" className="text-base font-semibold">
            Cookie Settings
          </h2>
          <button
            ref={closeRef}
            onClick={onClose}
            aria-label="Close cookie settings"
            className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <X aria-hidden="true" className="w-4 h-4" />
          </button>
        </div>

        {/* Categories */}
        <div className="px-6 py-4 space-y-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Choose which cookies you allow us to use. Your preferences are saved
            for 12 months and can be changed at any time from the Cookie Policy
            page.
          </p>

          {categories.map(({ key, icon: Icon, title, badge, description, always, value }) => (
            <div
              key={key}
              className="rounded-lg border border-border/40 bg-muted/30 p-4 space-y-2"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <Icon aria-hidden="true" className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-sm font-medium truncate">{title}</span>
                  {badge && (
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                      {badge}
                    </span>
                  )}
                </div>
                <Toggle
                  id={`toggle-${key}`}
                  label={`Toggle ${title}`}
                  checked={value}
                  disabled={always}
                  onChange={(v) => {
                    if (key === "required") return;
                    setPrefs((p) => ({ ...p, [key]: v }));
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed pl-6">
                {description}
              </p>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="sticky bottom-0 flex flex-col-reverse sm:flex-row gap-2 px-6 py-4 border-t border-border/40 bg-background">
          <Button
            variant="outline"
            size="sm"
            onClick={onRejectAll}
            className="flex-1 min-h-[44px] sm:min-h-9"
          >
            Reject Non-Essential
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSave(prefs)}
            className="flex-1 min-h-[44px] sm:min-h-9"
          >
            Save Preferences
          </Button>
          <Button
            size="sm"
            onClick={onAcceptAll}
            className="flex-1 min-h-[44px] sm:min-h-9 bg-primary hover:bg-primary/90"
          >
            <CheckCheck aria-hidden="true" className="w-3.5 h-3.5 mr-1.5" />
            Accept All
          </Button>
        </div>
      </div>
    </>
  );
}
