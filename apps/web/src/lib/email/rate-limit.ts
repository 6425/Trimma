import { consumeRateLimit } from "@/lib/distributed-rate-limit";
import { EMAIL_RATE_LIMIT_MAX, EMAIL_RATE_LIMIT_WINDOW_MS } from "./config";

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

export async function checkEmailRateLimit(key: string): Promise<RateLimitResult> {
  return consumeRateLimit({
    namespace: "email",
    key,
    limit: EMAIL_RATE_LIMIT_MAX,
    windowMs: EMAIL_RATE_LIMIT_WINDOW_MS,
  });
}

export function getClientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}
