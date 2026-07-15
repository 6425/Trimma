"use client";

import { reopenCookieConsentPreferences } from "@/lib/cookie-consent";

export function CookieSettingsLink({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={reopenCookieConsentPreferences}
      className={className || "hover:text-[#FFFD40] transition-colors text-left"}
    >
      Cookie settings
    </button>
  );
}
