import { createContext, useContext } from "react";

interface CookieConsentContextValue {
  openSettings: () => void;
}

export const CookieConsentContext = createContext<CookieConsentContextValue>({
  openSettings: () => {},
});

/** Use anywhere in the tree to open the cookie settings modal. */
export function useCookieConsentActions() {
  return useContext(CookieConsentContext);
}
