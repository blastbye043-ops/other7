import { useState, useCallback, useEffect } from "react";
import {
  type ConsentPreferences,
  type ConsentState,
  type StoredConsent,
  ACCEPT_ALL,
  CONSENT_KEY,
  CONSENT_TTL_MS,
  CONSENT_VERSION,
  REJECT_ALL,
} from "./types";

// Notify Google Consent Mode v2 of the user's choice.
function updateGtag(prefs: ConsentPreferences) {
  if (typeof window === "undefined") return;
  const w = window as Window & {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  };
  if (typeof w.gtag !== "function") return;

  w.gtag("consent", "update", {
    analytics_storage: prefs.analytics ? "granted" : "denied",
    ad_storage: prefs.advertising ? "granted" : "denied",
    ad_user_data: prefs.advertising ? "granted" : "denied",
    ad_personalization: prefs.advertising ? "granted" : "denied",
    functionality_storage: prefs.functional ? "granted" : "denied",
    personalization_storage: prefs.functional ? "granted" : "denied",
    security_storage: "granted", // always — required for security features
  });
}

function loadStored(): ConsentState {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return { status: "pending" };
    const stored = JSON.parse(raw) as StoredConsent;
    // Expire if version mismatch or older than TTL
    if (
      stored.version !== CONSENT_VERSION ||
      Date.now() - stored.timestamp > CONSENT_TTL_MS
    ) {
      localStorage.removeItem(CONSENT_KEY);
      return { status: "pending" };
    }
    return { status: "decided", preferences: stored.preferences };
  } catch {
    return { status: "pending" };
  }
}

function persist(prefs: ConsentPreferences) {
  const record: StoredConsent = {
    version: CONSENT_VERSION,
    timestamp: Date.now(),
    preferences: prefs,
  };
  localStorage.setItem(CONSENT_KEY, JSON.stringify(record));
}

export function useCookieConsent() {
  const [state, setState] = useState<ConsentState>({ status: "pending" });
  const [modalOpen, setModalOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage after first render to avoid SSR mismatch
  useEffect(() => {
    const stored = loadStored();
    setState(stored);
    if (stored.status === "decided") {
      updateGtag(stored.preferences);
    }
    setHydrated(true);
  }, []);

  const decide = useCallback((prefs: ConsentPreferences) => {
    persist(prefs);
    updateGtag(prefs);
    setState({ status: "decided", preferences: prefs });
    setModalOpen(false);
  }, []);

  const acceptAll = useCallback(() => decide(ACCEPT_ALL), [decide]);
  const rejectAll = useCallback(() => decide(REJECT_ALL), [decide]);
  const savePreferences = useCallback((prefs: ConsentPreferences) => decide(prefs), [decide]);

  const openSettings = useCallback(() => setModalOpen(true), []);
  const closeSettings = useCallback(() => setModalOpen(false), []);

  const showBanner = hydrated && state.status === "pending";
  const currentPrefs =
    state.status === "decided" ? state.preferences : REJECT_ALL;

  return {
    showBanner,
    modalOpen,
    currentPrefs,
    acceptAll,
    rejectAll,
    savePreferences,
    openSettings,
    closeSettings,
  };
}
