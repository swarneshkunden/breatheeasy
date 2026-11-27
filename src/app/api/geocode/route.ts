import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { roundCoordinate } from "@/lib/security/validation";
import { checkDistributedRateLimit } from "@/lib/security/distributed-rate-limit";
import { fetchWithTimeout } from "@/lib/security/fetchWithTimeout";
import { validateCityResults } from "@/lib/ai/city-validation";

const schema = z.object({
  q: z.string().trim().min(2).max(80),
});

const GEOCODE_HOST = "https://geocoding-api.open-meteo.com/v1/search";
const CACHE_MS = 60 * 60 * 1000;
const cache = new Map<string, { data: unknown; expiry: number }>();

function stripControlChars(value: string) {
  return value.replace(/[\u0000-\u001f\u007f-\u009f]/g, "");
}

function appLanguage(request: NextRequest) {
  const accept = request.headers.get("accept-language") ?? "en";
  const primary = accept.split(",")[0]?.split("-")[0]?.trim() || "en";
  return /^[a-z]{2}$/i.test(primary) ? primary.toLowerCase() : "en";
}

function clientIp(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

export async function GET(request: NextRequest) {
  const ip = clientIp(request);
  const limit = await checkDistributedRateLimit(ip);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": String(limit.retry) } });
  }

  const rawQ = request.nextUrl.searchParams.get("q") ?? "";
  const q = stripControlChars(rawQ.trim());
  const parsed = schema.safeParse({ q });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid city" }, { status: 400 });
  }

  const now = Date.now();
  const cached = cache.get(q);
  if (cached && cached.expiry > now) {
    return NextResponse.json(cached.data);
  }

  const url = new URL(GEOCODE_HOST);
  url.search = new URLSearchParams({ name: q, count: "5", language: appLanguage(request), format: "json" }).toString();

  try {
    const response = await fetchWithTimeout(url, 5000);
    if (!response.ok) {
      return NextResponse.json({ error: "City search unavailable" }, { status: 502 });
    }
    const validated = validateCityResults(await response.json());
    const results = validated.map((item) => ({
      name: item.name,
      admin1: item.admin1,
      country: item.country,
      latitude: roundCoordinate(item.latitude),
      longitude: roundCoordinate(item.longitude),
    }));
    const body =
      results.length === 0
        ? { message: "No match, try a nearby larger city", results: [] }
        : results;
    cache.set(q, { data: body, expiry: now + CACHE_MS });
    return NextResponse.json(body);
  } catch {
    return NextResponse.json({ error: "City search unavailable" }, { status: 502 });
  }
}
