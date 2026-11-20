import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { roundCoordinate } from "@/lib/security/validation";
import { checkRateLimit } from "@/lib/security/rateLimit";

const schema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
});

const AIR_HOST = "https://air-quality-api.open-meteo.com/v1/air-quality";
const CACHE_MS = 10 * 60 * 1000;
const cache = new Map<string, { data: unknown; expiry: number }>();

function clientIp(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

function pick<T>(array: T[] | undefined, index: number, fallback: T) {
  return array?.[index] ?? fallback;
}

export async function GET(request: NextRequest) {
  const ip = clientIp(request);
  const limit = checkRateLimit(ip);
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
  const now = Date.now();
  const cached = cache.get(key);
  if (cached && cached.expiry > now) {
    return NextResponse.json(cached.data);
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

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(url, { signal: controller.signal, cache: "no-store" });
    clearTimeout(timeout);
    if (!response.ok) {
      return NextResponse.json({ error: "Air data temporarily unavailable" }, { status: 502 });
    }
    const payload = await response.json() as {
      current?: { us_aqi?: number; pm2_5?: number; pm10?: number; nitrogen_dioxide?: number; ozone?: number };
      hourly?: {
        time: string[];
        us_aqi: number[];
        pm2_5: number[];
        pm10: number[];
        nitrogen_dioxide: number[];
        ozone: number[];
      };
      timezone?: string;
      utc_offset_seconds?: number;
    };

    const current = payload.current ?? {};
    const times = payload.hourly?.time ?? [];
    const hourly = times.slice(0, 48).map((time, index) => ({
      time,
      aqi: pick(payload.hourly?.us_aqi, index, current.us_aqi ?? 0),
      pm25: pick(payload.hourly?.pm2_5, index, current.pm2_5 ?? 0),
      pm10: pick(payload.hourly?.pm10, index, current.pm10 ?? 0),
      no2: pick(payload.hourly?.nitrogen_dioxide, index, current.nitrogen_dioxide ?? 0),
      o3: pick(payload.hourly?.ozone, index, current.ozone ?? 0),
    }));

    const body = {
      aqi: current.us_aqi ?? 0,
      pm25: current.pm2_5 ?? 0,
      pm10: current.pm10 ?? 0,
      no2: current.nitrogen_dioxide ?? 0,
      o3: current.ozone ?? 0,
      latitude: lat,
      longitude: lon,
      city: "Your location",
      source: "live" as const,
      updatedAt: new Date().toISOString(),
      hourly,
      timezone: payload.timezone ?? null,
      utcOffsetSeconds: payload.utc_offset_seconds ?? null,
    };
    cache.set(key, { data: body, expiry: now + CACHE_MS });
    return NextResponse.json(body);
  } catch {
    clearTimeout(timeout);
    return NextResponse.json({ error: "Air data temporarily unavailable" }, { status: 502 });
  }
}
