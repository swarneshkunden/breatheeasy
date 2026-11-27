import { checkRateLimit as checkInMemoryRateLimit } from "@/lib/security/rateLimit";

export interface RateLimitResult {
  allowed: boolean;
  retry: number;
}

export async function checkDistributedRateLimit(ip: string): Promise<RateLimitResult> {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    try {
      const [{ Ratelimit }, { Redis }] = await Promise.all([
        import("@upstash/ratelimit"),
        import("@upstash/redis"),
      ]);
      const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
      const limiter = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10, "60 s"),
        prefix: "breatheeasy:api",
      });
      const result = await limiter.limit(ip);
      return { allowed: result.success, retry: Math.max(1, Math.ceil((result.reset - Date.now()) / 1000)) };
    } catch {
      // Fall through to in-memory if Upstash is unavailable
    }
  }
  return checkInMemoryRateLimit(ip);
}
