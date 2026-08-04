"use client";

import { useEffect } from "react";
import { readCookieConsent } from "@/lib/cookie-consent";
import { AnalyticsEvent, syncPostHogConsent, trackEvent } from "@/lib/analytics";

/**
 * Keeps PostHog capture / session replay aligned with Trimma cookie consent.
 * Mount once in the root layout.
 */
export function PostHogConsentSync() {
  useEffect(() => {
    syncPostHogConsent();

    const onConsentUpdated = (event: Event) => {
      const detail = (event as CustomEvent).detail as
        | { analytics?: boolean }
        | undefined;
      const analytics =
        typeof detail?.analytics === "boolean"
          ? detail.analytics
          : Boolean(readCookieConsent()?.analytics);

      syncPostHogConsent(analytics);
      if (analytics) {
        trackEvent(AnalyticsEvent.CookieConsentUpdated, {
          analytics: true,
          source: "banner",
        });
      }
    };

    window.addEventListener("trimma-cookie-consent-updated", onConsentUpdated);
    return () => {
      window.removeEventListener("trimma-cookie-consent-updated", onConsentUpdated);
    };
  }, []);

  return null;
}
