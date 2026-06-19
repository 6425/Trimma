"use client";

import { useEffect, useState } from "react";
import { Cookie } from "lucide-react";
import { hasCookieConsentChoice, reopenCookieConsentPreferences } from "@/lib/cookie-consent";

/** Persistent access to cookie preferences on every route after first consent. */
export function CookieSettingsControl() {
  const [showControl, setShowControl] = useState(false);

  useEffect(() => {
    const sync = () => setShowControl(hasCookieConsentChoice());
    sync();
    window.addEventListener("trimma-cookie-consent-updated", sync);
    return () => window.removeEventListener("trimma-cookie-consent-updated", sync);
  }, []);

  if (!showControl) return null;

  return (
    <button
      type="button"
      onClick={reopenCookieConsentPreferences}
      className="fixed bottom-4 left-4 z-[99] inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 shadow-lg transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900"
      aria-label="Open cookie settings"
    >
      <Cookie className="h-3.5 w-3.5" />
      Cookies
    </button>
  );
}
