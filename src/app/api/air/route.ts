import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { clientIp, roundCoordinate } from "@/lib/security/validation";
import {
  checkRateLimit,
  READ_LIMITS,
} from "@/lib/security/distributed-rate-limit";
import { fetchWithTimeout } from "@/lib/security/fetchWithTimeout";
import { BoundedCache } from "@/lib/security/bounded-cache";
import { log } from "@/lib/security/logger";
import { validateOpenMeteoAir } from "@/lib/ai/air-validation";
import { AirSnapshotSchema, type AirSnapshot } from "@/lib/types";

const schema = z.object({
  lat: z.coerce.number().min(-90).max(90).transform(roundCoordinate),
  lon: z.coerce.number().min(-180).max(180).transform(roundCoordinate),
});

const AIR_HOST = "https://air-quality-api.open-meteo.com/v1/air-quality";
const CACHE_MS = 10 * 60 * 1000;
const MAX_CACHE_ENTRIES = 100;
const cache = new BoundedCache<AirSnapshot>(MAX_CACHE_ENTRIES, CACHE_MS);
const reverseGeocodeCache = new BoundedCache<string>(
  MAX_CACHE_ENTRIES,
  24 * 60 * 60 * 1000,
);
const reverseGeocodeSchema = z.object({
  city: z.string().optional(),
  locality: z.string().optional(),
  principalSubdivision: z.string().optional(),
});

function coordinateLabel(latitude: number) {
  return `Near ${Math.abs(latitude).toFixed(2)}°${latitude >= 0 ? "N" : "S"}`;
}

async function reverseGeocode(
  latitude: number,
  longitude: number,
): Promise<string> {
  const key = `${latitude},${longitude}`;
  const cached = reverseGeocodeCache.get(key);
  if (cached) return cached;

  const url = new URL(
    "https://api.bigdatacloud.net/data/reverse-geocode-client",
  );
  url.search = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    localityLanguage: "en",
  }).toString();

  try {
    const city = await fetchWithTimeout(url, 2500, async (signal) => {
      const response = await fetch(url, { signal, cache: "no-store" });
      if (!response.ok) throw new Error("Reverse geocode provider error");
      const parsed = reverseGeocodeSchema.parse(await response.json());
      return (
        parsed.city?.trim() ||
        parsed.locality?.trim() ||
        parsed.principalSubdivision?.trim() ||
        coordinateLabel(latitude)
      );
    });
    reverseGeocodeCache.set(key, city);
    return city;
  } catch {
    log("warn", "Reverse geocoding unavailable", { reason: "provider_error" });
    return coordinateLabel(latitude);
  }
}

export async function GET(request: NextRequest) {
  const ip = clientIp(request);
  const limit = await checkRateLimit(ip, READ_LIMITS);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(limit.retry) } },
    );
  }

  const parsed = schema.safeParse({
    lat: request.nextUrl.searchParams.get("lat"),
    lon: request.nextUrl.searchParams.get("lon"),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
  }

  const lat = parsed.data.lat;
  const lon = parsed.data.lon;
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
      return validateOpenMeteoAir(await response.json());
    });
    const city = await reverseGeocode(lat, lon);
    const body = AirSnapshotSchema.parse({
      aqi: validated.aqi,
      pm25: validated.pm25,
      pm10: validated.pm10,
      no2: validated.no2,
      o3: validated.o3,
      latitude: validated.latitude,
      longitude: validated.longitude,
      city,
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
    });
    cache.set(key, body);
    return NextResponse.json(body);
  } catch {
    return NextResponse.json(
      { error: "Air data temporarily unavailable" },
      { status: 502 },
    );
  }
}
