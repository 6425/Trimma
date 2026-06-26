import { createHmac, timingSafeEqual } from "crypto";
import { getSessionSecret } from "@/lib/auth/session-secret";

function signStripePendingId(pendingId: string): string {
  return createHmac("sha256", getSessionSecret())
    .update(`stripe-pending:${pendingId}`)
    .digest("base64url");
}

export function verifyStripePendingToken(
  pendingId: string,
  token: string | null | undefined
): boolean {
  if (!pendingId || !token) return false;

  const expected = signStripePendingId(pendingId);
  try {
    const expectedBuffer = Buffer.from(expected);
    const tokenBuffer = Buffer.from(token);
    return (
      expectedBuffer.length === tokenBuffer.length &&
      timingSafeEqual(expectedBuffer, tokenBuffer)
    );
  } catch {
    return false;
  }
}

export function createStripePendingToken(pendingId: string): string {
  return signStripePendingId(pendingId);
}
