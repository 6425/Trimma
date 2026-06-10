"use client";

/**
 * International phone input with a country-code dropdown.
 *
 * - Defaults to Sri Lanka (+94) so existing local users are unaffected.
 * - Users can change the country code via a native <select> (best UX on mobile,
 *   where editing a free-text prefix was painful).
 * - Emits a canonical E.164 value like "+94771234567" or "+12025550123".
 * - Accepts prior values in any shape ("+94711130179", "0711130179",
 *   "711130179") and renders the country + national part correctly.
 *
 * Theme-aware: adapts to dark (agent/dashboard) and light surfaces via `theme`.
 * Default is "auto" which uses neutral styling that works on both.
 */
import { useEffect, useState } from "react";

export type PhoneCountry = { iso: string; name: string; dial: string; flag: string };

/** Curated list — Sri Lanka first (default), then alphabetical. Covers the
 *  main Trimma markets and the Sri Lankan diaspora (Gulf, South Asia, West). */
export const PHONE_COUNTRIES: PhoneCountry[] = [
  { iso: "LK", name: "Sri Lanka", dial: "94", flag: "🇱🇰" },
  { iso: "AU", name: "Australia", dial: "61", flag: "🇦🇺" },
  { iso: "BH", name: "Bahrain", dial: "973", flag: "🇧🇭" },
  { iso: "BD", name: "Bangladesh", dial: "880", flag: "🇧🇩" },
  { iso: "CA", name: "Canada", dial: "1", flag: "🇨🇦" },
  { iso: "CN", name: "China", dial: "86", flag: "🇨🇳" },
  { iso: "FR", name: "France", dial: "33", flag: "🇫🇷" },
  { iso: "DE", name: "Germany", dial: "49", flag: "🇩🇪" },
  { iso: "HK", name: "Hong Kong", dial: "852", flag: "🇭🇰" },
  { iso: "IN", name: "India", dial: "91", flag: "🇮🇳" },
  { iso: "ID", name: "Indonesia", dial: "62", flag: "🇮🇩" },
  { iso: "IT", name: "Italy", dial: "39", flag: "🇮🇹" },
  { iso: "JP", name: "Japan", dial: "81", flag: "🇯🇵" },
  { iso: "JO", name: "Jordan", dial: "962", flag: "🇯🇴" },
  { iso: "KW", name: "Kuwait", dial: "965", flag: "🇰🇼" },
  { iso: "MY", name: "Malaysia", dial: "60", flag: "🇲🇾" },
  { iso: "MV", name: "Maldives", dial: "960", flag: "🇲🇻" },
  { iso: "NP", name: "Nepal", dial: "977", flag: "🇳🇵" },
  { iso: "NL", name: "Netherlands", dial: "31", flag: "🇳🇱" },
  { iso: "NZ", name: "New Zealand", dial: "64", flag: "🇳🇿" },
  { iso: "OM", name: "Oman", dial: "968", flag: "🇴🇲" },
  { iso: "PK", name: "Pakistan", dial: "92", flag: "🇵🇰" },
  { iso: "PH", name: "Philippines", dial: "63", flag: "🇵🇭" },
  { iso: "QA", name: "Qatar", dial: "974", flag: "🇶🇦" },
  { iso: "SA", name: "Saudi Arabia", dial: "966", flag: "🇸🇦" },
  { iso: "SG", name: "Singapore", dial: "65", flag: "🇸🇬" },
  { iso: "KR", name: "South Korea", dial: "82", flag: "🇰🇷" },
  { iso: "ES", name: "Spain", dial: "34", flag: "🇪🇸" },
  { iso: "CH", name: "Switzerland", dial: "41", flag: "🇨🇭" },
  { iso: "TH", name: "Thailand", dial: "66", flag: "🇹🇭" },
  { iso: "AE", name: "United Arab Emirates", dial: "971", flag: "🇦🇪" },
  { iso: "GB", name: "United Kingdom", dial: "44", flag: "🇬🇧" },
  { iso: "US", name: "United States", dial: "1", flag: "🇺🇸" },
];

const DEFAULT_ISO = "LK";
const MAX_NATIONAL_DIGITS = 14;

function digitsOnly(value: string | null | undefined): string {
  return (value || "").replace(/\D/g, "");
}

/** Detect the country only from an explicit "+<code>" value (avoids treating a
 *  bare local number's leading digits as a foreign dial code). */
function detectCountryFromValue(value: string | null | undefined): PhoneCountry | null {
  if (!value || !value.trim().startsWith("+")) return null;
  const digits = digitsOnly(value);
  if (!digits) return null;
  let best: PhoneCountry | null = null;
  for (const country of PHONE_COUNTRIES) {
    if (digits.startsWith(country.dial)) {
      if (!best || country.dial.length > best.dial.length) best = country;
    }
  }
  return best;
}

function nationalFromValue(value: string | null | undefined, dial: string): string {
  let digits = digitsOnly(value);
  const explicit = !!value && value.trim().startsWith("+");
  if (explicit && digits.startsWith(dial)) digits = digits.slice(dial.length);
  // Drop a leading trunk zero (common when users paste a local format).
  digits = digits.replace(/^0+/, "");
  return digits.slice(0, MAX_NATIONAL_DIGITS);
}

/** Build a canonical E.164 number, or "" when there is no national part. */
export function buildPhone(dial: string, national: string): string {
  const clean = digitsOnly(national).replace(/^0+/, "").slice(0, MAX_NATIONAL_DIGITS);
  return clean ? `+${dial}${clean}` : "";
}

// ── Backward-compatible Sri Lanka helpers (kept for any external imports) ────
export function extractLkRest(value: string | null | undefined): string {
  let digits = digitsOnly(value);
  if (digits.startsWith("94")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = digits.slice(1);
  if (digits.startsWith("7")) digits = digits.slice(1);
  return digits.slice(0, 8);
}

export function buildLkPhone(rest: string): string {
  const cleanRest = digitsOnly(rest).slice(0, 8);
  return cleanRest ? `+947${cleanRest}` : "";
}

type LkPhoneInputProps = {
  value: string;
  onChange: (fullValue: string) => void;
  id?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  /** "light" | "dark" | "auto" (default). "auto" inherits from className. */
  theme?: "light" | "dark" | "auto";
  className?: string;
  inputClassName?: string;
};

export function LkPhoneInput({
  value,
  onChange,
  id,
  required,
  disabled,
  placeholder = "77 123 4567",
  theme = "auto",
  className = "",
  inputClassName = "",
}: LkPhoneInputProps) {
  const [iso, setIso] = useState<string>(() => detectCountryFromValue(value)?.iso ?? DEFAULT_ISO);

  // Re-sync the country when an explicit "+<code>" value arrives later
  // (e.g. an async profile load setting the field after mount).
  useEffect(() => {
    const detected = detectCountryFromValue(value);
    if (detected && detected.iso !== iso) {
      void Promise.resolve().then(() => setIso(detected.iso));
    }
  }, [value, iso]);

  const country = PHONE_COUNTRIES.find((c) => c.iso === iso) ?? PHONE_COUNTRIES[0];
  const national = nationalFromValue(value, country.dial);

  const handleCountryChange = (newIso: string) => {
    setIso(newIso);
    const next = PHONE_COUNTRIES.find((c) => c.iso === newIso) ?? PHONE_COUNTRIES[0];
    onChange(buildPhone(next.dial, national));
  };

  const handleNumberChange = (raw: string) => {
    onChange(buildPhone(country.dial, raw));
  };

  // ── Theme tokens ───────────────────────────────────────────────────────────
  const wrapperBase = "flex items-stretch overflow-hidden focus-within:ring-2 transition-all";

  const wrapperTheme =
    theme === "dark"
      ? "rounded-xl border border-white/10 bg-[#0B0B0B] focus-within:border-[#F5B700]/60 focus-within:ring-[#F5B700]/20"
      : theme === "light"
      ? "rounded-xl border border-zinc-200 bg-white focus-within:border-zinc-900 focus-within:ring-zinc-900/10"
      : "rounded-md border border-gray-300 bg-white focus-within:border-zinc-900 focus-within:ring-zinc-900/10";

  const selectTheme =
    theme === "dark"
      ? "bg-white/5 text-zinc-200 border-r border-white/10"
      : theme === "light"
      ? "bg-zinc-50 text-zinc-700 border-r border-zinc-200"
      : "bg-black/5 text-zinc-700 border-r border-gray-200";

  const inputTheme =
    theme === "dark"
      ? "text-white placeholder:text-zinc-600"
      : theme === "light"
      ? "text-zinc-900 placeholder:text-zinc-400"
      : "text-zinc-900 placeholder:text-gray-400";

  return (
    <div className={`${wrapperBase} ${wrapperTheme} ${className}`}>
      {/* Country code dropdown — defaults to Sri Lanka (+94) */}
      <select
        aria-label="Country code"
        disabled={disabled}
        value={iso}
        onChange={(e) => handleCountryChange(e.target.value)}
        className={`w-[104px] shrink-0 px-2 text-sm font-bold outline-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${selectTheme}`}
      >
        {PHONE_COUNTRIES.map((c) => (
          <option key={c.iso} value={c.iso}>
            {c.flag} +{c.dial} · {c.name}
          </option>
        ))}
      </select>

      {/* National number — user types the local part only */}
      <input
        id={id}
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        value={national}
        onChange={(e) => handleNumberChange(e.target.value)}
        className={`flex-1 min-w-0 px-3 py-2.5 text-sm outline-none bg-transparent disabled:opacity-40 disabled:cursor-not-allowed ${inputTheme} ${inputClassName}`}
      />
    </div>
  );
}
