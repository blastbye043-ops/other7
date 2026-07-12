import { lazy, Suspense, useMemo } from "react";
import { CookieConsentContext } from "./context";
import { useCookieConsent } from "./use-cookie-consent";

// Lazy-load both UI overlays — they are never visible on initial paint.
// Returning visitors (who already accepted/rejected cookies) never see the
// banner at all, so there is no reason to pay the module-parse cost up front.
const CookieBanner = lazy(() =>
  import("./cookie-banner").then((m) => ({ default: m.CookieBanner }))
);
const CookieSettingsModal = lazy(() =>
  import("./cookie-settings-modal").then((m) => ({ default: m.CookieSettingsModal }))
);

interface Props {
  children: React.ReactNode;
}

/**
 * Wraps the app with consent state. Renders the banner and settings modal,
 * and exposes `openSettings` via CookieConsentContext so any child component
 * (e.g. footer, cookies page) can open the modal programmatically.
 */
export function CookieConsentProvider({ children }: Props) {
  const {
    showBanner,
    modalOpen,
    currentPrefs,
    acceptAll,
    rejectAll,
    savePreferences,
    openSettings,
    closeSettings,
  } = useCookieConsent();

  const ctx = useMemo(() => ({ openSettings }), [openSettings]);

  return (
    <CookieConsentContext.Provider value={ctx}>
      {children}

      {showBanner && (
        <Suspense fallback={null}>
          <CookieBanner
            onAcceptAll={acceptAll}
            onRejectAll={rejectAll}
            onOpenSettings={openSettings}
          />
        </Suspense>
      )}

      <Suspense fallback={null}>
        <CookieSettingsModal
          open={modalOpen}
          initialPrefs={currentPrefs}
          onSave={savePreferences}
          onAcceptAll={acceptAll}
          onRejectAll={rejectAll}
          onClose={closeSettings}
        />
      </Suspense>
    </CookieConsentContext.Provider>
  );
}
