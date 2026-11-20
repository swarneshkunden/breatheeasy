import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";

function request(lat: string, lon: string, ip: string) {
  return new NextRequest(`http://localhost/api/air?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`, {
    method: "GET",
    headers: { "x-forwarded-for": ip },
  });
}

const airPayload = {
  current: { us_aqi: 180, pm2_5: 92, pm10: 140, nitrogen_dioxide: 42, ozone: 31 },
  hourly: {
    time: ["2026-01-01T00:00", "2026-01-01T01:00"],
    us_aqi: [180, 170],
    pm2_5: [92, 85],
    pm10: [140, 130],
    nitrogen_dioxide: [42, 40],
    ozone: [31, 30],
  },
  timezone: "Asia/Kolkata",
  utc_offset_seconds: 19800,
};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("air route", () => {
  it("returns parsed live air data with timezone offset", async () => {
    const fetchMock = vi.fn<(url: string | URL) => Promise<Response>>(async () => Response.json(airPayload));
    vi.stubGlobal("fetch", fetchMock);
    const result = await GET(request("28.61", "77.21", "192.0.2.1"));
    expect(result.status).toBe(200);
    const body = await result.json();
    expect(body.latitude).toBe(28.61);
    expect(body.longitude).toBe(77.21);
    expect(body.aqi).toBe(180);
    expect(body.timezone).toBe("Asia/Kolkata");
    expect(body.utcOffsetSeconds).toBe(19800);
    expect(body.hourly).toHaveLength(2);
    expect(body.hourly[0].aqi).toBe(180);
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain("air-quality-api.open-meteo.com");
  });

  it("handles null gaps in hourly arrays without crashing", async () => {
    const payload = {
      ...airPayload,
      hourly: {
        ...airPayload.hourly,
        us_aqi: [180, null],
        pm2_5: [null, 85],
      },
    };
    const fetchMock = vi.fn(async () => Response.json(payload));
    vi.stubGlobal("fetch", fetchMock);
    const result = await GET(request("28.62", "77.22", "192.0.2.2"));
    expect(result.status).toBe(200);
    const body = await result.json();
    expect(body.hourly[0].aqi).toBe(180);
    expect(body.hourly[1].aqi).toBe(180);
    expect(body.hourly[0].pm25).toBe(92);
    expect(body.hourly[1].pm25).toBe(85);
  });

  it("returns a sanitized 502 on upstream failure", async () => {
    const fetchMock = vi.fn(async () => Response.json({ error: "boom" }, { status: 502 }));
    vi.stubGlobal("fetch", fetchMock);
    const result = await GET(request("28.63", "77.23", "192.0.2.3"));
    expect(result.status).toBe(502);
    expect(await result.json()).toEqual({ error: "Air data temporarily unavailable" });
  });

  it("returns a sanitized 502 on timeout", async () => {
    const fetchMock = vi.fn(async () => {
      throw new Error("AbortError");
    });
    vi.stubGlobal("fetch", fetchMock);
    const result = await GET(request("28.64", "77.24", "192.0.2.4"));
    expect(result.status).toBe(502);
    expect(await result.json()).toEqual({ error: "Air data temporarily unavailable" });
  });

  it("rejects out-of-range coordinates with a sanitized 400", async () => {
    const result = await GET(request("91", "77.21", "192.0.2.5"));
    expect(result.status).toBe(400);
    expect(await result.json()).toEqual({ error: "Invalid coordinates" });
  });

  it("rate limits and provides Retry-After", async () => {
    const fetchMock = vi.fn(async () => Response.json(airPayload));
    vi.stubGlobal("fetch", fetchMock);
    const ip = "192.0.2.6";
    for (let count = 0; count < 10; count += 1) {
      expect((await GET(request("28.65", "77.25", ip))).status).toBe(200);
    }
    const limited = await GET(request("28.65", "77.25", ip));
    expect(limited.status).toBe(429);
    expect(Number(limited.headers.get("Retry-After"))).toBeGreaterThan(0);
  });
});
