import posthog from "posthog-js";
import { readCookieConsent } from "@/lib/cookie-consent";

/** Canonical custom event names used across Trimma web. */
export const AnalyticsEvent = {
  BookingCheckoutStarted: "booking_checkout_started",
  BookingCompleted: "booking_completed",
  BookingCheckoutFailed: "booking_checkout_failed",
  SubscriptionCheckoutStarted: "subscription_checkout_started",
  SubscriptionCompleted: "subscription_completed",
  SearchPageViewed: "search_page_viewed",
  SalonSearch: "salon_search",
  CategoryViewed: "category_viewed",
  CategoryFilterChanged: "category_filter_changed",
  SalonViewed: "salon_viewed",
  UserSignedUp: "user_signed_up",
  UserLoggedIn: "user_logged_in",
  UserLoggedOut: "user_logged_out",
  CookieConsentUpdated: "cookie_consent_updated",
} as const;

export type AnalyticsEventName = (typeof AnalyticsEvent)[keyof typeof AnalyticsEvent];

export type AnalyticsProperties = Record<string, string | number | boolean | null | undefined>;

function isBrowserPostHogReady(): boolean {
  return typeof window !== "undefined" && Boolean(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN);
}

export function isAnalyticsAllowed(): boolean {
  const consent = readCookieConsent();
  return Boolean(consent?.analytics);
}

/** Apply cookie-banner analytics preference to PostHog capture + session replay. */
export function syncPostHogConsent(analyticsAllowed?: boolean): void {
  if (!isBrowserPostHogReady()) return;

  const allowed = analyticsAllowed ?? isAnalyticsAllowed();

  if (allowed) {
    posthog.opt_in_capturing();
    posthog.startSessionRecording();
  } else {
    posthog.stopSessionRecording();
    posthog.opt_out_capturing();
  }
}

export function trackEvent(event: AnalyticsEventName | string, properties?: AnalyticsProperties): void {
  if (!isBrowserPostHogReady() || !isAnalyticsAllowed()) return;
  posthog.capture(event, properties);
}

export function identifyUser(
  userId: string,
  traits?: {
    email?: string | null;
    name?: string | null;
    role?: string | null;
  }
): void {
  if (!isBrowserPostHogReady()) return;

  posthog.identify(userId, {
    email: traits?.email || undefined,
    name: traits?.name || undefined,
    role: traits?.role || undefined,
  });
}

export function resetAnalyticsUser(): void {
  if (!isBrowserPostHogReady()) return;
  posthog.reset();
}

export function captureClientException(
  error: unknown,
  properties?: AnalyticsProperties
): void {
  if (!isBrowserPostHogReady()) return;
  posthog.captureException(error, properties);
}
