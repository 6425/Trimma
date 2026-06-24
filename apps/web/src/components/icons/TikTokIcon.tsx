import type { SVGProps } from "react";

/** TikTok logo mark — lucide does not ship a TikTok icon. */
export function TikTokIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
      {...props}
    >
      <path d="M16.6 5.82s.51.5 0 0A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.03 2.47 5.5 5.5 5.5s5.5-2.47 5.5-5.5V9.01a7.27 7.27 0 0 0 4.3 1.38V7.3a4.1 4.1 0 0 1-1-.48z" />
    </svg>
  );
}
