"use client";

/**
 * Sri Lankan mobile input with a fixed "+94 7" prefix so the user only types
 * the remaining 8 digits. Emits a canonical value of "+947XXXXXXXX".
 *
 * Accepts any prior value shape ("+94711130179", "0711130179", "711130179")
 * and shows only the trailing digits after the leading 7.
 *
 * Theme-aware: adapts to both dark (agent/dashboard dark surfaces) and
 * light backgrounds automatically via the `theme` prop.
 * Default is "auto" which uses neutral styling that works on both.
 */
export function extractLkRest(value: string | null | undefined): string {
  let digits = (value || "").replace(/\D/g, "");
  if (digits.startsWith("94")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = digits.slice(1);
  if (digits.startsWith("7")) digits = digits.slice(1);
  return digits.slice(0, 8);
}

export function buildLkPhone(rest: string): string {
  const cleanRest = (rest || "").replace(/\D/g, "").slice(0, 8);
  return cleanRest ? `+947${cleanRest}` : "";
}

type LkPhoneInputProps = {
  value: string;
  onChange: (fullValue: string) => void;
  id?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  /** "light" | "dark" | "auto" (default). "auto" uses border+bg from className. */
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
  placeholder = "76 123 4567",
  theme = "auto",
  className = "",
  inputClassName = "",
}: LkPhoneInputProps) {
  const rest = extractLkRest(value);

  // ── Theme tokens ───────────────────────────────────────────────────────────
  const wrapperBase = "flex items-stretch overflow-hidden focus-within:ring-2 transition-all";

  const wrapperTheme =
    theme === "dark"
      ? "rounded-xl border border-white/10 bg-[#0B0B0B] focus-within:border-[#F5B700]/60 focus-within:ring-[#F5B700]/20"
      : theme === "light"
      ? "rounded-xl border border-zinc-200 bg-white focus-within:border-zinc-900 focus-within:ring-zinc-900/10"
      : // "auto" — neutral, inherits from parent via className
        "rounded-md border border-gray-300 bg-white focus-within:border-zinc-900 focus-within:ring-zinc-900/10";

  const prefixTheme =
    theme === "dark"
      ? "bg-white/5 text-zinc-400 border-r border-white/10"
      : theme === "light"
      ? "bg-zinc-50 text-zinc-500 border-r border-zinc-200"
      : "bg-black/5 text-zinc-600 border-r border-gray-200";

  const inputTheme =
    theme === "dark"
      ? "text-white placeholder:text-zinc-600"
      : theme === "light"
      ? "text-zinc-900 placeholder:text-zinc-400"
      : "text-zinc-900 placeholder:text-gray-400";

  return (
    <div className={`${wrapperBase} ${wrapperTheme} ${className}`}>
      {/* Country + network prefix badge */}
      <span
        className={`flex items-center px-3 text-sm font-bold select-none whitespace-nowrap shrink-0 ${prefixTheme}`}
      >
        +94&nbsp;7
      </span>

      {/* Number input — user types only the last 8 digits */}
      <input
        id={id}
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        value={rest}
        onChange={(e) => onChange(buildLkPhone(e.target.value))}
        className={`flex-1 min-w-0 px-3 py-2.5 text-sm outline-none bg-transparent disabled:opacity-40 disabled:cursor-not-allowed ${inputTheme} ${inputClassName}`}
      />
    </div>
  );
}
