export interface ConsentPreferences {
  analytics: boolean;
  advertising: boolean;
  functional: boolean;
}

export interface StoredConsent {
  version: number;
  timestamp: number; // ms since epoch
  preferences: ConsentPreferences;
}

export type ConsentState =
  | { status: "pending" }          // first visit — banner should show
  | { status: "decided"; preferences: ConsentPreferences }; // user has chosen

export const CONSENT_KEY = "ytoudown_consent";
export const CONSENT_VERSION = 1;
export const CONSENT_TTL_MS = 365 * 24 * 60 * 60 * 1000; // 12 months

export const ACCEPT_ALL: ConsentPreferences = {
  analytics: true,
  advertising: true,
  functional: true,
};

export const REJECT_ALL: ConsentPreferences = {
  analytics: false,
  advertising: false,
  functional: false,
};
