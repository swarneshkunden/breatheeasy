import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { clientIp, roundCoordinate } from "@/lib/security/validation";
import { checkRateLimit, READ_LIMITS } from "@/lib/security/distributed-rate-limit";
import { fetchWithTimeout } from "@/lib/security/fetchWithTimeout";
import { BoundedCache } from "@/lib/security/bounded-cache";
import { validateAirSnapshot } from "@/lib/ai/air-validation";

const schema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
});

const AIR_HOST = "https://air-quality-api.open-meteo.com/v1/air-quality";
const CACHE_MS = 10 * 60 * 1000;
const MAX_CACHE_ENTRIES = 100;
const cache = new BoundedCache<AirSnapshotResponse>(MAX_CACHE_ENTRIES, CACHE_MS);

interface AirSnapshotResponse {
  aqi: number;
  pm25: number;
  pm10: number;
  no2: number;
  o3: number;
  latitude: number;
  longitude: number;
  city: string;
  source: "live" | "demo";
  updatedAt: string;
  hourly: Array<{
    time: string;
    aqi: number;
    pm25: number;
    pm10: number;
    no2: number;
    o3: number;
  }>;
  timezone: string | null;
  utcOffsetSeconds: number | null;
}

export async function GET(request: NextRequest) {
  const ip = clientIp(request);
  const limit = await checkRateLimit(ip, READ_LIMITS);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": String(limit.retry) } });
  }

  const parsed = schema.safeParse({
    lat: request.nextUrl.searchParams.get("lat"),
    lon: request.nextUrl.searchParams.get("lon"),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
  }

  const lat = roundCoordinate(parsed.data.lat);
  const lon = roundCoordinate(parsed.data.lon);
  const key = `${lat},${lon}`;
  const cached = cache.get(key);
  if (cached) {
    return NextResponse.json(cached);
  }

  const url = new URL(AIR_HOST);
  url.search = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current: "us_aqi,pm2_5,pm10,nitrogen_dioxide,ozone",
    hourly: "us_aqi,pm2_5,pm10,nitrogen_dioxide,ozone",
    forecast_days: "2",
    timezone: "auto",
  }).toString();

  try {
    const validated = await fetchWithTimeout(url, 5000, async (signal) => {
      const response = await fetch(url, { signal, cache: "no-store" });
      if (!response.ok) throw new Error("Upstream error");
      return validateAirSnapshot(await response.json());
    });
    const body: AirSnapshotResponse = {
      aqi: validated.aqi,
      pm25: validated.pm25,
      pm10: validated.pm10,
      no2: validated.no2,
      o3: validated.o3,
      latitude: validated.latitude,
      longitude: validated.longitude,
      city: validated.city,
      source: validated.source,
      updatedAt: validated.updatedAt,
      hourly: validated.hourly.map((h) => ({
        time: h.time,
        aqi: h.aqi,
        pm25: h.pm25,
        pm10: h.pm10,
        no2: h.no2,
        o3: h.o3,
      })),
      timezone: validated.timezone,
      utcOffsetSeconds: validated.utcOffsetSeconds,
    };
    cache.set(key, body);
    return NextResponse.json(body);
  } catch {
    return NextResponse.json({ error: "Air data temporarily unavailable" }, { status: 502 });
  }
}
