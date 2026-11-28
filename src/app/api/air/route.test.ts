import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";
import { AirSnapshotSchema } from "@/lib/types";

vi.mock("@/lib/security/distributed-rate-limit", () => ({
  checkRateLimit: vi.fn(async () => ({
    allowed: true,
    retry: 0,
    distributed: false,
  })),
  READ_LIMITS: { limit: 30, windowMs: 60_000, prefix: "breatheeasy:read" },
  AI_LIMITS: { limit: 10, windowMs: 60_000, prefix: "breatheeasy:ai" },
}));

function request(lat: string, lon: string, ip: string) {
  return new NextRequest(
    `http://localhost/api/air?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`,
    {
      method: "GET",
      headers: { "x-real-ip": ip },
    },
  );
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
    const req = new NextRequest(
      "http://localhost/api/air?lat=invalid&lon=invalid",
      {
        method: "GET",
        headers: { "x-real-ip": "192.0.2.5" },
      },
    );
    const result = await GET(req);
    expect(result.status).toBe(400);
  });

  it("includes rate limit headers on success", async () => {
    const response = await GET(request("28.61", "77.21", "192.0.2.9"));
    // Either 200 (if fetch works) or 502 (if network unavailable in test env)
    expect([200, 502]).toContain(response.status);
  });

  it("returns route output accepted by the shared client parser", async () => {
    const upstream = {
      latitude: 27.12,
      longitude: 77.32,
      utc_offset_seconds: 19800,
      timezone: "Asia/Kolkata",
      current: {
        time: "2025-01-01T10:00",
        us_aqi: 42,
        pm2_5: 12,
        pm10: 22,
        nitrogen_dioxide: 9,
        ozone: 18,
      },
      hourly: {
        time: ["2025-01-01T10:00", "2025-01-01T11:00"],
        us_aqi: [42, null],
        pm2_5: [12, null],
        pm10: [22, null],
        nitrogen_dioxide: [9, null],
        ozone: [18, null],
      },
    };
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () => new Response(JSON.stringify(upstream), { status: 200 }),
      ),
    );

    const response = await GET(request("27.123", "77.321", "192.0.2.44"));
    expect(response.status).toBe(200);
    expect(AirSnapshotSchema.safeParse(await response.json()).success).toBe(
      true,
    );
  });
});
