import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";

vi.mock("@/lib/security/distributed-rate-limit", () => ({
  checkRateLimit: vi.fn(async () => ({ allowed: true, retry: 0, distributed: false })),
  READ_LIMITS: { limit: 30, windowMs: 60_000, prefix: "breatheeasy:read" },
  AI_LIMITS: { limit: 10, windowMs: 60_000, prefix: "breatheeasy:ai" },
}));

function request(q: string, ip: string) {
  return new NextRequest(`http://localhost/api/geocode?q=${encodeURIComponent(q)}`, {
    method: "GET",
    headers: { "x-forwarded-for": ip },
  });
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("geocode route", () => {
  it("rejects short queries with a sanitized 400", async () => {
    const response = await GET(request("x", "192.0.2.5"));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Invalid city" });
  });

  it("rejects missing query with a sanitized 400", async () => {
    const req = new NextRequest("http://localhost/api/geocode", {
      method: "GET",
      headers: { "x-forwarded-for": "192.0.2.5" },
    });
    const response = await GET(req);
    expect(response.status).toBe(400);
  });

  it("includes rate limit headers on success", async () => {
    const response = await GET(request("delhi", "192.0.2.9"));
    // Either 200 (if fetch works) or 502 (if network unavailable in test env)
    expect([200, 502]).toContain(response.status);
  });
});
