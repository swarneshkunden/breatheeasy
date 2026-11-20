import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";

function request(q: string, ip: string) {
  return new NextRequest(`http://localhost/api/geocode?q=${encodeURIComponent(q)}`, {
    method: "GET",
    headers: { "x-forwarded-for": ip },
  });
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("geocode route", () => {
  it("returns rounded results for a valid city", async () => {
    const fetchMock = vi.fn<(url: string | URL) => Promise<Response>>(async () =>
      Response.json({
        results: [{ name: "New Delhi", admin1: "Delhi", country: "India", latitude: 28.6139, longitude: 77.209 }],
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const response = await GET(request("delhi", "192.0.2.1"));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual([{ name: "New Delhi", admin1: "Delhi", country: "India", latitude: 28.61, longitude: 77.21 }]);
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain("geocoding-api.open-meteo.com/v1/search");
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain("count=5");
  });

  it("returns a friendly message for an empty result", async () => {
    const fetchMock = vi.fn(async () => Response.json({ results: [] }));
    vi.stubGlobal("fetch", fetchMock);
    const response = await GET(request("mumbai", "192.0.2.2"));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.message).toBe("No match, try a nearby larger city");
    expect(body.results).toEqual([]);
  });

  it("returns a sanitized 502 on upstream failure", async () => {
    const fetchMock = vi.fn(async () => Response.json({ error: "boom" }, { status: 502 }));
    vi.stubGlobal("fetch", fetchMock);
    const response = await GET(request("kolkata", "192.0.2.3"));
    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ error: "City search unavailable" });
  });

  it("returns a sanitized 502 on timeout", async () => {
    const fetchMock = vi.fn(async () => {
      throw new Error("AbortError");
    });
    vi.stubGlobal("fetch", fetchMock);
    const response = await GET(request("chennai", "192.0.2.4"));
    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ error: "City search unavailable" });
  });

  it("rejects short queries with a sanitized 400", async () => {
    const response = await GET(request("x", "192.0.2.5"));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Invalid city" });
  });

  it("rate limits and provides Retry-After", async () => {
    const fetchMock = vi.fn(async () => Response.json({ results: [] }));
    vi.stubGlobal("fetch", fetchMock);
    const ip = "192.0.2.6";
    for (let count = 0; count < 10; count += 1) {
      expect((await GET(request("delhi", ip))).status).toBe(200);
    }
    const limited = await GET(request("delhi", ip));
    expect(limited.status).toBe(429);
    expect(Number(limited.headers.get("Retry-After"))).toBeGreaterThan(0);
  });
});
