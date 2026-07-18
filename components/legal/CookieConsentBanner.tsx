"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ALL_COOKIE_CONSENT,
  DEFAULT_COOKIE_CONSENT,
  hasCookieConsentChoice,
  readCookieConsent,
  saveCookieConsent,
  type CookieConsentPreferences,
} from "@/lib/cookie-consent";

const preferenceOptions = [
  {
    key: "analytics" as const,
    label: "Performance & analytics",
    description: "Help us measure and improve platform performance.",
  },
  {
    key: "functional" as const,
    label: "Functional",
    description: "Remember preferences such as language, location, and saved salons.",
  },
  {
    key: "marketing" as const,
    label: "Marketing",
    description: "Show relevant offers and measure campaign effectiveness.",
  },
];

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState<Omit<CookieConsentPreferences, "updatedAt">>({
    ...DEFAULT_COOKIE_CONSENT,
  });

  useEffect(() => {
    setVisible(!hasCookieConsentChoice());
  }, []);

  useEffect(() => {
    const syncFromStorage = () => {
      const stored = readCookieConsent();
      if (stored) {
        setPreferences({
          essential: true,
          analytics: stored.analytics,
          functional: stored.functional,
          marketing: stored.marketing,
        });
        setVisible(false);
        return;
      }

      setVisible(true);
    };

    syncFromStorage();
    window.addEventListener("trimma-cookie-consent-updated", syncFromStorage);
    return () => window.removeEventListener("trimma-cookie-consent-updated", syncFromStorage);
  }, []);

  if (!visible) return null;

  const persist = (next: Omit<CookieConsentPreferences, "updatedAt">) => {
    saveCookieConsent(next);
    setVisible(false);
    setShowPreferences(false);
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-[100] p-4 sm:p-6 pointer-events-none">
      <div
        role="dialog"
        aria-labelledby="cookie-consent-title"
        aria-describedby="cookie-consent-description"
        className="pointer-events-auto mx-auto max-w-4xl rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950 sm:p-6"
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#ffde5a]/15 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-yellow-700">
              <span className="h-1.5 w-1.5 rounded-full bg-[#ffde5a]" />
              Cookie preferences
            </p>
            <h2 id="cookie-consent-title" className="text-lg font-extrabold text-zinc-900 dark:text-white">
              We use cookies to improve your Trimma experience
            </h2>
            <p id="cookie-consent-description" className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
              Essential cookies are required for sign-in, security, and booking. You can choose
              whether to allow performance, functional, and marketing cookies. Read our{" "}
              <Link href="/cookies" className="font-semibold text-zinc-900 underline decoration-[#ffde5a] decoration-2 underline-offset-4 dark:text-white">
                Cookie Policy
              </Link>
              .
            </p>
          </div>

          {!showPreferences ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap lg:justify-end">
              <button
                type="button"
                onClick={() => setShowPreferences(true)}
                className="h-11 rounded-xl border border-zinc-200 px-4 text-sm font-semibold text-zinc-900 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-white dark:hover:bg-zinc-900"
              >
                Manage preferences
              </button>
              <button
                type="button"
                onClick={() => persist({ ...DEFAULT_COOKIE_CONSENT })}
                className="h-11 rounded-xl border border-zinc-200 px-4 text-sm font-semibold text-zinc-900 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-white dark:hover:bg-zinc-900"
              >
                Essential only
              </button>
              <button
                type="button"
                onClick={() => persist({ ...ALL_COOKIE_CONSENT })}
                className="h-11 rounded-xl bg-zinc-900 px-4 text-sm font-bold text-white transition-colors hover:bg-zinc-800"
              >
                Accept all
              </button>
            </div>
          ) : null}
        </div>

        {showPreferences ? (
          <div className="mt-5 border-t border-zinc-100 pt-5 dark:border-zinc-800">
            <div className="space-y-3">
              <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
                <p className="text-sm font-semibold text-zinc-900 dark:text-white">Essential cookies</p>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                  Required for sign-in, sessions, security, and core booking flows. Always active.
                </p>
              </div>

              {preferenceOptions.map((option) => (
                <label
                  key={option.key}
                  className="flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-100 p-4 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900/40"
                >
                  <input
                    type="checkbox"
                    checked={preferences[option.key]}
                    onChange={(event) =>
                      setPreferences((current) => ({
                        ...current,
                        [option.key]: event.target.checked,
                      }))
                    }
                    className="mt-1 h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-[#ffde5a]"
                  />
                  <span>
                    <span className="block text-sm font-semibold text-zinc-900 dark:text-white">
                      {option.label}
                    </span>
                    <span className="mt-1 block text-sm text-zinc-600 dark:text-zinc-300">
                      {option.description}
                    </span>
                  </span>
                </label>
              ))}
            </div>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setShowPreferences(false)}
                className="h-11 rounded-xl border border-zinc-200 px-4 text-sm font-semibold text-zinc-900 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-white dark:hover:bg-zinc-900"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => persist(preferences)}
                className="h-11 rounded-xl bg-[#ffde5a] px-4 text-sm font-bold text-zinc-900 transition-colors hover:bg-[#E6E43A]"
              >
                Save preferences
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
