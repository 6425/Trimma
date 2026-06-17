type CheckoutBucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, CheckoutBucket>();

const CHECKOUT_RATE_LIMIT_MAX = 12;
const CHECKOUT_RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;

export type CheckoutRateLimitResult = {
  allowed: boolean;
  retryAfterSec?: number;
};

export function checkCheckoutRateLimit(ip: string): CheckoutRateLimitResult {
  const key = (ip || "unknown").trim().toLowerCase();
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + CHECKOUT_RATE_LIMIT_WINDOW_MS });
    return { allowed: true };
  }

  if (bucket.count >= CHECKOUT_RATE_LIMIT_MAX) {
    return {
      allowed: false,
      retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  bucket.count += 1;
  return { allowed: true };
}
