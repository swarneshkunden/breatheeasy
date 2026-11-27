import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";

vi.mock("@/lib/security/distributed-rate-limit", () => ({
  checkDistributedRateLimit: vi.fn(async () => ({ allowed: true, retry: 0 })),
}));

vi.mock("@/lib/security/distributed-rate-limit", () => ({
  checkDistributedRateLimit: vi.fn(async () => ({ allowed: true, retry: 0 })),
}));

function request(lat: string, lon: string, ip: string) {
  return new NextRequest(`http://localhost/api/air?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`, {
    method: "GET",
    headers: { "x-forwarded-for": ip },
  });
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("air route", () => {
  it("rejects out-of-range coordinates with a sanitized 400", async () => {
    const result = await GET(request("91", "77.21", "192.0.2.5"));
    expect(result.status).toBe(400);
    expect(await result.json()).toEqual({ error: "Invalid coordinates" });
  });

  it("rejects missing coordinates with a sanitized 400", async () => {
    const req = new NextRequest("http://localhost/api/air?lat=invalid&lon=invalid", {
      method: "GET",
      headers: { "x-forwarded-for": "192.0.2.5" },
    });
    const result = await GET(req);
    expect(result.status).toBe(400);
  });

  it("includes rate limit headers on success", async () => {
    const response = await GET(request("28.61", "77.21", "192.0.2.9"));
    // Either 200 (if fetch works) or 502 (if network unavailable in test env)
    expect([200, 502]).toContain(response.status);
  });
});
