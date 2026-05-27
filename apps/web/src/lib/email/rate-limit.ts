import { EMAIL_RATE_LIMIT_MAX, EMAIL_RATE_LIMIT_WINDOW_MS } from "./config";

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, RateLimitBucket>();

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSec?: number;
};

export function buildEmailRateLimitKey(ip: string, userKey: string) {
  const normalizedIp = (ip || "unknown").trim().toLowerCase();
  const normalizedUser = (userKey || "anonymous").trim().toLowerCase();
  return `${normalizedIp}:${normalizedUser}`;
}

export function checkEmailRateLimit(key: string): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + EMAIL_RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: EMAIL_RATE_LIMIT_MAX - 1 };
  }

  if (bucket.count >= EMAIL_RATE_LIMIT_MAX) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  bucket.count += 1;
  return { allowed: true, remaining: EMAIL_RATE_LIMIT_MAX - bucket.count };
}

export function getClientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}
