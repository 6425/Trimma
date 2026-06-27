import { consumeRateLimit } from "@/lib/distributed-rate-limit";

const CHECKOUT_RATE_LIMIT_MAX = 12;
const CHECKOUT_RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;

export type CheckoutRateLimitResult = {
  allowed: boolean;
  retryAfterSec?: number;
};

export async function checkCheckoutRateLimit(ip: string): Promise<CheckoutRateLimitResult> {
  const result = await consumeRateLimit({
    namespace: "checkout",
    key: ip,
    limit: CHECKOUT_RATE_LIMIT_MAX,
    windowMs: CHECKOUT_RATE_LIMIT_WINDOW_MS,
  });

  return {
    allowed: result.allowed,
    retryAfterSec: result.retryAfterSec,
  };
}

const PASSWORD_RESET_RATE_LIMIT_MAX = 5;
const PASSWORD_RESET_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

export async function checkPasswordResetRateLimit(ip: string): Promise<CheckoutRateLimitResult> {
  const result = await consumeRateLimit({
    namespace: "auth:password-reset",
    key: ip,
    limit: PASSWORD_RESET_RATE_LIMIT_MAX,
    windowMs: PASSWORD_RESET_RATE_LIMIT_WINDOW_MS,
  });

  return {
    allowed: result.allowed,
    retryAfterSec: result.retryAfterSec,
  };
}
