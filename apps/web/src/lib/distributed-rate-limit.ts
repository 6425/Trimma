import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export type DistributedRateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSec?: number;
};

type MemoryBucket = {
  count: number;
  resetAt: number;
};

const memoryBuckets = new Map<string, MemoryBucket>();
const upstashLimiters = new Map<string, Ratelimit>();

function getUpstashLimiter(namespace: string, limit: number, windowSec: number): Ratelimit | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return null;

  const cacheKey = `${namespace}:${limit}:${windowSec}`;
  const cached = upstashLimiters.get(cacheKey);
  if (cached) return cached;

  const limiter = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(limit, `${windowSec} s`),
    prefix: `trimma:${namespace}`,
    analytics: true,
  });
  upstashLimiters.set(cacheKey, limiter);
  return limiter;
}

function consumeMemoryRateLimit(
  namespace: string,
  key: string,
  limit: number,
  windowMs: number
): DistributedRateLimitResult {
  const bucketKey = `${namespace}:${key}`;
  const now = Date.now();
  const bucket = memoryBuckets.get(bucketKey);

  if (!bucket || now >= bucket.resetAt) {
    memoryBuckets.set(bucketKey, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: Math.max(0, limit - 1) };
  }

  if (bucket.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  bucket.count += 1;
  return { allowed: true, remaining: Math.max(0, limit - bucket.count) };
}

export async function consumeRateLimit(options: {
  namespace: string;
  key: string;
  limit: number;
  windowMs: number;
}): Promise<DistributedRateLimitResult> {
  const normalizedKey = (options.key || "unknown").trim().toLowerCase();
  const windowSec = Math.max(1, Math.ceil(options.windowMs / 1000));
  const limiter = getUpstashLimiter(options.namespace, options.limit, windowSec);

  if (limiter) {
    try {
      const { success, remaining, reset } = await limiter.limit(normalizedKey);
      return {
        allowed: success,
        remaining,
        retryAfterSec: success
          ? undefined
          : Math.max(1, Math.ceil((reset - Date.now()) / 1000)),
      };
    } catch (error) {
      console.warn(
        "[consumeRateLimit] Upstash unavailable, using in-memory fallback:",
        error instanceof Error ? error.message : error
      );
    }
  }

  return consumeMemoryRateLimit(
    options.namespace,
    normalizedKey,
    options.limit,
    options.windowMs
  );
}

export function isDistributedRateLimitConfigured(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL?.trim() &&
      process.env.UPSTASH_REDIS_REST_TOKEN?.trim()
  );
}
