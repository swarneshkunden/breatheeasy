import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { clientIp, roundCoordinate } from "@/lib/security/validation";
import {
  checkRateLimit,
  READ_LIMITS,
} from "@/lib/security/distributed-rate-limit";
import { fetchWithTimeout } from "@/lib/security/fetchWithTimeout";
import { BoundedCache } from "@/lib/security/bounded-cache";
import { validateCityResults } from "@/lib/ai/city-validation";

const schema = z.object({
  q: z.string().trim().min(2).max(80),
  lang: z.enum(["en", "hi"]),
});

const GEOCODE_HOST = "https://geocoding-api.open-meteo.com/v1/search";
const CACHE_MS = 60 * 60 * 1000;
const MAX_CACHE_ENTRIES = 100;
const cache = new BoundedCache<GeocodeResponse>(MAX_CACHE_ENTRIES, CACHE_MS);

interface GeocodeResponse {
  message?: string;
  results?: Array<{
    name: string;
    admin1: string | null;
    country: string | null;
    latitude: number;
    longitude: number;
  }>;
}

function stripControlChars(value: string) {
  return value.replace(/[\u0000-\u001f\u007f-\u009f]/g, "");
}

function appLanguage(request: NextRequest) {
  const accept = request.headers.get("accept-language") ?? "en";
  const primary = accept.split(",")[0]?.split("-")[0]?.trim() || "en";
  return /^[a-z]{2}$/i.test(primary) ? primary.toLowerCase() : "en";
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

  const rawQ = request.nextUrl.searchParams.get("q") ?? "";
  const q = stripControlChars(rawQ.trim());
  const parsed = schema.safeParse({
    q,
    lang: request.nextUrl.searchParams.get("lang") ?? appLanguage(request),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid city" }, { status: 400 });
  }

  const lang = parsed.data.lang;
  const key = `${lang}:${q}`;
  const cached = cache.get(key);
  if (cached) {
    return NextResponse.json(cached);
  }

  const url = new URL(GEOCODE_HOST);
  url.search = new URLSearchParams({
    name: q,
    count: "5",
    language: lang,
    format: "json",
  }).toString();

  try {
    const validated = await fetchWithTimeout(url, 5000, async (signal) => {
      const response = await fetch(url, { signal, cache: "no-store" });
      if (!response.ok) throw new Error("Upstream error");
      return validateCityResults(await response.json());
    });
    const results = validated.map((item) => ({
      name: item.name,
      admin1: item.admin1,
      country: item.country,
      latitude: roundCoordinate(item.latitude),
      longitude: roundCoordinate(item.longitude),
    }));
    const body: GeocodeResponse =
      results.length === 0
        ? { message: "No match, try a nearby larger city", results: [] }
        : { results };
    cache.set(key, body);
    return NextResponse.json(body);
  } catch {
    return NextResponse.json(
      { error: "City search unavailable" },
      { status: 502 },
    );
  }
}
