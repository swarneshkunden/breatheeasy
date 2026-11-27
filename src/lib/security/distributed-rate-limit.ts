import { checkRateLimit as checkInMemoryRateLimit } from "@/lib/security/rateLimit";

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

const READ_LIMITS: RateLimitConfig = { limit: 30, windowMs: 60_000, prefix: "breatheeasy:read" };
const AI_LIMITS: RateLimitConfig = { limit: 10, windowMs: 60_000, prefix: "breatheeasy:ai" };

let redisClient: any = null;
let redisReady = false;
let redisInitError: Error | null = null;
let fallbackCount = 0;

function initRedis(): void {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    redisInitError = new Error("Upstash Redis not configured");
    redisReady = false;
    return;
  }
  redisInitError = null;
  redisReady = true;
}

initRedis();

async function getRedis(): Promise<any | null> {
  if (!redisReady || redisInitError) return null;
  if (redisClient) return redisClient;
  try {
    const { Redis } = await import("@upstash/redis");
    redisClient = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
    return redisClient;
  } catch (error) {
    redisInitError = error instanceof Error ? error : new Error(String(error));
    redisReady = false;
    return null;
  }
}

export async function checkRateLimit(
  ip: string,
  config: RateLimitConfig = READ_LIMITS,
): Promise<RateLimitResult> {
  // If Redis is not configured or not ready, use bounded in-memory fallback.
  if (!redisReady || redisInitError || !process.env.UPSTASH_REDIS_REST_URL) {
    fallbackCount += 1;
    const result = checkInMemoryRateLimit(ip, config.limit, config.windowMs);
    return { ...result, distributed: false };
  }

  const redis = await getRedis();
  if (!redis) {
    fallbackCount += 1;
    const result = checkInMemoryRateLimit(ip, config.limit, config.windowMs);
    return { ...result, distributed: false };
  }

  try {
    const { Ratelimit } = await import("@upstash/ratelimit");
    const limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(config.limit, `${Math.floor(config.windowMs / 1000)} s`),
      prefix: config.prefix,
    });
    const result = await limiter.limit(ip);
    return {
      allowed: result.success,
      retry: Math.max(1, Math.ceil((result.reset - Date.now()) / 1000)),
      distributed: true,
    };
  } catch {
    // Redis runtime error: fall back to in-memory for this request only.
    fallbackCount += 1;
    const result = checkInMemoryRateLimit(ip, config.limit, config.windowMs);
    return { ...result, distributed: false };
  }
}

export { READ_LIMITS, AI_LIMITS };
export { fallbackCount };
