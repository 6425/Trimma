export const COOKIE_CONSENT_STORAGE_KEY = "trimma-cookie-consent";

export type CookieConsentPreferences = {
  essential: true;
  analytics: boolean;
  functional: boolean;
  marketing: boolean;
  updatedAt: string;
};

export const DEFAULT_COOKIE_CONSENT: CookieConsentPreferences = {
  essential: true,
  analytics: false,
  functional: false,
  marketing: false,
  updatedAt: "",
};

export const ALL_COOKIE_CONSENT: CookieConsentPreferences = {
  essential: true,
  analytics: true,
  functional: true,
  marketing: true,
  updatedAt: "",
};

export function readCookieConsent(): CookieConsentPreferences | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<CookieConsentPreferences>;
    if (parsed.essential !== true) return null;

    return {
      essential: true,
      analytics: Boolean(parsed.analytics),
      functional: Boolean(parsed.functional),
      marketing: Boolean(parsed.marketing),
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : "",
    };
  } catch {
    return null;
  }
}

export function saveCookieConsent(preferences: Omit<CookieConsentPreferences, "updatedAt">) {
  if (typeof window === "undefined") return;

  const payload: CookieConsentPreferences = {
    ...preferences,
    essential: true,
    updatedAt: new Date().toISOString(),
  };

  localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(payload));
  window.dispatchEvent(new CustomEvent("trimma-cookie-consent-updated", { detail: payload }));
}

export function hasCookieConsentChoice(): boolean {
  return readCookieConsent() !== null;
}

export function reopenCookieConsentPreferences() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(COOKIE_CONSENT_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent("trimma-cookie-consent-updated"));
}
