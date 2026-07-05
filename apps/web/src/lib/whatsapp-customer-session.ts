/** Meta customer service window — free-form session messages within 24h of booking checkout. */
export const WHATSAPP_CUSTOMER_SESSION_MS = 24 * 60 * 60 * 1000;

export function isWithinWhatsAppCustomerSessionWindow(
  sessionStartedAt: string | Date | null | undefined,
  nowMs = Date.now()
): boolean {
  if (!sessionStartedAt) return false;
  const startedMs = new Date(sessionStartedAt).getTime();
  if (Number.isNaN(startedMs)) return false;
  return nowMs - startedMs < WHATSAPP_CUSTOMER_SESSION_MS;
}
