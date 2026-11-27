import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { checkRateLimit } from "@/lib/security/rateLimit";
import { checkRateLimit as checkDistributedRateLimit } from "@/lib/security/distributed-rate-limit";

beforeEach(() => {
  vi.restoreAllMocks();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("in-memory rate limiting", () => {
  it("allows requests within limit", () => {
    for (let i = 0; i < 10; i++) {
      expect(checkRateLimit("test-ip", 10, 60_000).allowed).toBe(true);
    }
  });

  it("blocks requests over limit", () => {
    for (let i = 0; i < 10; i++) checkRateLimit("test-ip", 10, 60_000);
    const result = checkRateLimit("test-ip", 10, 60_000);
    expect(result.allowed).toBe(false);
    expect(result.retry).toBeGreaterThan(0);
  });

  it("resets after window expires", () => {
    for (let i = 0; i < 10; i++) checkRateLimit("reset-test-ip", 10, 1);
    vi.advanceTimersByTime(10);
    expect(checkRateLimit("reset-test-ip", 10, 1).allowed).toBe(true);
  });

  it("different IPs have separate limits", () => {
    for (let i = 0; i < 10; i++) checkRateLimit("ip-1", 10, 60_000);
    expect(checkRateLimit("ip-2", 10, 60_000).allowed).toBe(true);
  });
});

describe("distributed rate limiting with Redis unavailable", () => {
  it("falls back to in-memory when Upstash config missing", async () => {
    process.env.UPSTASH_REDIS_REST_URL = undefined;
    process.env.UPSTASH_REDIS_REST_TOKEN = undefined;
    // Should not throw, falls back to in-memory
    const result = await checkDistributedRateLimit("test-ip");
    expect(typeof result.allowed).toBe("boolean");
  });
});
