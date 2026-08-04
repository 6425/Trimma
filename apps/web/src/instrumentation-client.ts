import posthog from "posthog-js";
import { readCookieConsent } from "@/lib/cookie-consent";

const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN?.trim();
const apiHost = process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim() || "https://us.i.posthog.com";

function hasAnalyticsConsent(): boolean {
  if (typeof window === "undefined") return false;
  const consent = readCookieConsent();
  // No choice yet → do not capture until the banner decision.
  if (!consent) return false;
  return consent.analytics === true;
}

if (token) {
  const analyticsAllowed = hasAnalyticsConsent();

  posthog.init(token, {
    api_host: apiHost,
    defaults: "2026-05-30",
    capture_pageview: true,
    capture_pageleave: true,
    capture_exceptions: true,
    persistence: "localStorage+cookie",
    person_profiles: "identified_only",
    opt_out_capturing_by_default: !analyticsAllowed,
    disable_session_recording: !analyticsAllowed,
    session_recording: {
      maskAllInputs: true,
      maskTextSelector: "[data-ph-mask]",
    },
    loaded: (client) => {
      if (process.env.NODE_ENV === "development") {
        client.debug(false);
      }
    },
  });
}
