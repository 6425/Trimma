export const RESEND_FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL?.trim() || "no-reply@trimma.io";

export const RESEND_FROM_NAME = process.env.RESEND_FROM_NAME?.trim() || "Trimma";

export const RESEND_FROM = `${RESEND_FROM_NAME} <${RESEND_FROM_EMAIL}>`;

export const APP_BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
  process.env.APP_URL?.replace(/\/$/, "") ||
  "http://localhost:3000";

/** Max sends per IP + user within the sliding window. */
export const EMAIL_RATE_LIMIT_MAX = Number(process.env.EMAIL_RATE_LIMIT_MAX || 10);

/** Rate limit window in milliseconds (default 15 minutes). */
export const EMAIL_RATE_LIMIT_WINDOW_MS = Number(
  process.env.EMAIL_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000
);

export type EmailTemplateName = "owner_invite" | "booking_confirmation";
