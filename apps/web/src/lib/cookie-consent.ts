export const COOKIE_CONSENT_STORAGE_KEY = "trimma-cookie-consent";
export const COOKIE_CONSENT_VERSION = 4;
export const DEVICE_LOCATION_STORAGE_KEY = "trimma-device-location";

export type CookieConsentPreferences = {
  essential: true;
  analytics: boolean;
  functional: boolean;
  marketing: boolean;
  location: boolean;
  version: number;
  updatedAt: string;
};

export const DEFAULT_COOKIE_CONSENT: CookieConsentPreferences = {
  essential: true,
  analytics: false,
  functional: false,
  marketing: false,
  location: false,
  version: COOKIE_CONSENT_VERSION,
  updatedAt: "",
};

export const ALL_COOKIE_CONSENT: CookieConsentPreferences = {
  essential: true,
  analytics: true,
  functional: true,
  marketing: true,
  location: true,
  version: COOKIE_CONSENT_VERSION,
  updatedAt: "",
};

export type DeviceLocationCoords = {
  lat: number;
  lng: number;
  at: number;
};

export function readCookieConsent(): CookieConsentPreferences | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<CookieConsentPreferences>;
    if (parsed.essential !== true) return null;
    if (Number(parsed.version) !== COOKIE_CONSENT_VERSION) return null;

    return {
      essential: true,
      analytics: Boolean(parsed.analytics),
      functional: Boolean(parsed.functional),
      marketing: Boolean(parsed.marketing),
      location: Boolean(parsed.location),
      version: COOKIE_CONSENT_VERSION,
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : "",
    };
  } catch {
    return null;
  }
}

export const COOKIE_CONSENT_HTML_ATTR = "data-trimma-cookie-consent";

function syncCookieConsentHtmlFlag(hasChoice: boolean) {
  if (typeof document === "undefined") return;
  if (hasChoice) {
    document.documentElement.setAttribute(COOKIE_CONSENT_HTML_ATTR, "1");
    document.documentElement.style.overflow = "";
  } else {
    document.documentElement.removeAttribute(COOKIE_CONSENT_HTML_ATTR);
  }
}

export function saveCookieConsent(
  preferences: Omit<CookieConsentPreferences, "updatedAt" | "version"> & { version?: number }
) {
  if (typeof window === "undefined") return;

  const payload: CookieConsentPreferences = {
    ...preferences,
    essential: true,
    location: Boolean(preferences.location),
    version: COOKIE_CONSENT_VERSION,
    updatedAt: new Date().toISOString(),
  };

  localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(payload));
  syncCookieConsentHtmlFlag(true);
  window.dispatchEvent(new CustomEvent("trimma-cookie-consent-updated", { detail: payload }));
}

export function hasCookieConsentChoice(): boolean {
  return readCookieConsent() !== null;
}

export function subscribeCookieConsent(onStoreChange: () => void) {
  const onChange = () => onStoreChange();
  window.addEventListener("trimma-cookie-consent-updated", onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener("trimma-cookie-consent-updated", onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function reopenCookieConsentPreferences() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(COOKIE_CONSENT_STORAGE_KEY);
  syncCookieConsentHtmlFlag(false);
  window.dispatchEvent(new CustomEvent("trimma-cookie-consent-updated"));
}

export function hasLocationConsent(): boolean {
  return Boolean(readCookieConsent()?.location);
}

export function readStoredDeviceLocation(): DeviceLocationCoords | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(DEVICE_LOCATION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<DeviceLocationCoords>;
    if (!Number.isFinite(parsed.lat) || !Number.isFinite(parsed.lng)) return null;
    return { lat: Number(parsed.lat), lng: Number(parsed.lng), at: Number(parsed.at) || Date.now() };
  } catch {
    return null;
  }
}

export function storeDeviceLocation(lat: number, lng: number) {
  if (typeof window === "undefined") return;
  const payload: DeviceLocationCoords = { lat, lng, at: Date.now() };
  sessionStorage.setItem(DEVICE_LOCATION_STORAGE_KEY, JSON.stringify(payload));
  window.dispatchEvent(new CustomEvent("trimma-device-location-updated", { detail: payload }));
}

export function requestDeviceLocation(options?: {
  onGranted?: (coords: DeviceLocationCoords) => void;
  onDenied?: (message: string) => void;
}): void {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    options?.onDenied?.("Location is not available on this device.");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const coords = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        at: Date.now(),
      };
      storeDeviceLocation(coords.lat, coords.lng);
      options?.onGranted?.(coords);
    },
    (error) => {
      const message =
        error.code === error.PERMISSION_DENIED
          ? "Location access was blocked. Enable location for this site in your browser settings, then try again."
          : "We could not read your location. Check that GPS or location services are turned on, then try again.";
      options?.onDenied?.(message);
    },
    { enableHighAccuracy: true, timeout: 20000, maximumAge: 60_000 }
  );
}
