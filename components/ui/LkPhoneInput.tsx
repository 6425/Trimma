"use client";

/**
 * Sri Lankan mobile input with a fixed "+94 7" prefix so the user only types
 * the remaining 8 digits. Emits a canonical value of "+947XXXXXXXX".
 *
 * Accepts any prior value shape ("+94711130179", "0711130179", "711130179")
 * and shows only the trailing digits after the leading 7.
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
  className?: string;
  inputClassName?: string;
};

export function LkPhoneInput({
  value,
  onChange,
  id,
  required,
  disabled,
  placeholder = "XX XXX XXXX",
  className = "",
  inputClassName = "",
}: LkPhoneInputProps) {
  const rest = extractLkRest(value);

  return (
    <div
      className={`flex items-stretch rounded-md border border-gray-300 bg-white overflow-hidden focus-within:border-zinc-900 focus-within:ring-1 focus-within:ring-zinc-900 ${className}`}
    >
      <span className="flex items-center px-3 text-sm font-semibold opacity-70 bg-black/5 select-none whitespace-nowrap">
        +94&nbsp;7
      </span>
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
        className={`flex-1 px-3 py-2.5 text-sm outline-none bg-transparent placeholder-gray-400 ${inputClassName}`}
      />
    </div>
  );
}
