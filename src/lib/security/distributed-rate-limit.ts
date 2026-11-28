import { checkRateLimit as checkInMemoryRateLimit } from "@/lib/security/rateLimit";
import { log } from "@/lib/security/logger";
import type { Redis } from "@upstash/redis";
import type { Ratelimit } from "@upstash/ratelimit";

export interface RateLimitConfig {
  limit: number;
  windowMs: number;
  prefix: string;
}

export interface RateLimitResult {
  allowed: boolean;
  retry: number;
  distributed: boolean;
}

const READ_LIMITS: RateLimitConfig = {
  limit: 30,
  windowMs: 60_000,
  prefix: "breatheeasy:read",
};
const AI_LIMITS: RateLimitConfig = {
  limit: 10,
  windowMs: 60_000,
  prefix: "breatheeasy:ai",
};

let redisClient: Redis | null = null;
let redisInitError: Error | null = null;
const limiters = new Map<string, Ratelimit>();
let fallbackCount = 0;

async function getRedis(): Promise<Redis | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token || redisInitError) return null;
  if (redisClient) return redisClient;
  try {
    const { Redis } = await import("@upstash/redis");
    redisClient = new Redis({ url, token });
    return redisClient;
  } catch (error) {
    redisInitError = error instanceof Error ? error : new Error(String(error));
    log("warn", "Redis rate limiting initialization failed", {
      reason: "redis_init_failed",
    });
    return null;
  }
}

async function getLimiter(
  redis: Redis,
  config: RateLimitConfig,
): Promise<Ratelimit> {
  const key = `${config.prefix}:${config.limit}:${config.windowMs}`;
  const existing = limiters.get(key);
  if (existing) return existing;
  const { Ratelimit } = await import("@upstash/ratelimit");
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(
      config.limit,
      `${Math.floor(config.windowMs / 1000)} s`,
    ),
    prefix: config.prefix,
  });
  limiters.set(key, limiter);
  return limiter;
}

export async function checkRateLimit(
  ip: string,
  config: RateLimitConfig = READ_LIMITS,
): Promise<RateLimitResult> {
  const redis = await getRedis();
  if (!redis) {
    fallbackCount += 1;
    const result = checkInMemoryRateLimit(ip, config.limit, config.windowMs);
    return { ...result, distributed: false };
  }

  try {
    const limiter = await getLimiter(redis, config);
    const result = await limiter.limit(ip);
    return {
      allowed: result.success,
      retry: Math.max(1, Math.ceil((result.reset - Date.now()) / 1000)),
      distributed: true,
    };
  } catch (error) {
    redisInitError = error instanceof Error ? error : new Error(String(error));
    log("warn", "Redis rate limiting request failed", {
      reason: "redis_request_failed",
    });
    fallbackCount += 1;
    const result = checkInMemoryRateLimit(ip, config.limit, config.windowMs);
    return { ...result, distributed: false };
  }
}

export { READ_LIMITS, AI_LIMITS };
export { fallbackCount };
