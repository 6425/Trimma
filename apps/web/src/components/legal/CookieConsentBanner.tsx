"use client";

import { useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import {
  ALL_COOKIE_CONSENT,
  DEFAULT_COOKIE_CONSENT,
  hasCookieConsentChoice,
  requestDeviceLocation,
  saveCookieConsent,
  subscribeCookieConsent,
} from "@/lib/cookie-consent";

export function CookieConsentBanner() {
  const hasChoice = useSyncExternalStore(
    subscribeCookieConsent,
    hasCookieConsentChoice,
    () => false
  );
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [functional, setFunctional] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [location, setLocation] = useState(true);

  if (hasChoice) return null;

  const persist = (prefs: {
    analytics: boolean;
    functional: boolean;
    marketing: boolean;
    location: boolean;
  }) => {
    saveCookieConsent({
      essential: true,
      analytics: prefs.analytics,
      functional: prefs.functional,
      marketing: prefs.marketing,
      location: prefs.location,
    });
    if (prefs.location) requestDeviceLocation();
  };

  return (
    <div
      id="trimma-cookie-banner"
      data-trimma-cookie-banner="v4"
      className="fixed inset-0 z-[2147483647] flex items-end justify-center bg-black/50 p-4 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-description"
    >
      <div className="w-full max-w-4xl rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xl sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#ffde5a]/15 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-yellow-700">
              <span className="h-1.5 w-1.5 rounded-full bg-[#ffde5a]" />
              Cookie preferences
            </p>
            <h2 id="cookie-consent-title" className="text-lg font-extrabold text-zinc-900">
              Cookies, privacy, and optional location
            </h2>
            <p id="cookie-consent-description" className="mt-2 text-sm leading-6 text-zinc-600">
              We use cookies to operate Trimma and keep your session secure. To show accurate search
              and map information — including distance and the fastest way to reach a business — we
              can use your device location if you enable GPS. Location is optional and is not used
              for advertising. Essential cookies stay on.{" "}
              <a href="/cookies" className="font-semibold text-zinc-900 underline decoration-[#ffde5a] decoration-2 underline-offset-4">
                Cookie Policy
              </a>
              {" "}and{" "}
              <a href="/privacy-policy" className="font-semibold text-zinc-900 underline decoration-[#ffde5a] decoration-2 underline-offset-4">
                Privacy Policy
              </a>
              .
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap lg:justify-end">
            <Button
              type="button"
              variant="outline"
              className="h-11 min-h-11 rounded-xl px-4"
              onClick={() => setPrefsOpen(true)}
            >
              Manage preferences
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-11 min-h-11 rounded-xl px-4"
              onClick={() => persist(DEFAULT_COOKIE_CONSENT)}
            >
              Essential only
            </Button>
            <Button
              type="button"
              variant="dark"
              className="h-11 min-h-11 rounded-xl px-4 font-bold"
              onClick={() => persist(ALL_COOKIE_CONSENT)}
            >
              Accept all
            </Button>
          </div>
        </div>

        {prefsOpen ? (
          <div id="trimma-cookie-prefs" className="mt-5 border-t border-zinc-100 pt-5">
            <div className="max-h-[50vh] space-y-3 overflow-y-auto">
              <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4">
                <p className="text-sm font-semibold text-zinc-900">Essential cookies</p>
                <p className="mt-1 text-sm text-zinc-600">
                  Required for sign-in, sessions, security, and core booking flows. Always active.
                </p>
              </div>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-100 p-4">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4"
                  checked={analytics}
                  onChange={(event) => setAnalytics(event.target.checked)}
                />
                <span>
                  <span className="block text-sm font-semibold text-zinc-900">Performance & analytics</span>
                  <span className="mt-1 block text-sm text-zinc-600">Help us measure and improve how Trimma works.</span>
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-100 p-4">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4"
                  checked={functional}
                  onChange={(event) => setFunctional(event.target.checked)}
                />
                <span>
                  <span className="block text-sm font-semibold text-zinc-900">Functional</span>
                  <span className="mt-1 block text-sm text-zinc-600">Remember preferences such as language and saved salons.</span>
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-100 p-4">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4"
                  checked={location}
                  onChange={(event) => setLocation(event.target.checked)}
                />
                <span>
                  <span className="block text-sm font-semibold text-zinc-900">Device location</span>
                  <span className="mt-1 block text-sm text-zinc-600">
                    Optional GPS for accurate distance, travel time, and routes. Your browser will still ask to confirm.
                  </span>
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-100 p-4">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4"
                  checked={marketing}
                  onChange={(event) => setMarketing(event.target.checked)}
                />
                <span>
                  <span className="block text-sm font-semibold text-zinc-900">Marketing</span>
                  <span className="mt-1 block text-sm text-zinc-600">Show relevant offers and measure campaign effectiveness.</span>
                </span>
              </label>
            </div>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                className="h-11 min-h-11 rounded-xl px-4"
                onClick={() => setPrefsOpen(false)}
              >
                Back
              </Button>
              <Button
                type="button"
                variant="default"
                className="h-11 min-h-11 rounded-xl px-4 font-bold"
                onClick={() => persist({ analytics, functional, marketing, location })}
              >
                Save preferences
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
