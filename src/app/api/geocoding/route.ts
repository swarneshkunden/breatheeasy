import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({ q: z.string().trim().min(2).max(80) });

export async function GET(request: NextRequest) {
  const parsed = schema.safeParse({ q: request.nextUrl.searchParams.get("q") });
  if (!parsed.success) return NextResponse.json({ error: "Invalid city" }, { status: 400 });
  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.search = new URLSearchParams({ name: parsed.data.q, count: "6", language: "en", format: "json" }).toString();
  const response = await fetch(url, { next: { revalidate: 600 } });
  if (!response.ok) return NextResponse.json({ error: "City search unavailable" }, { status: 502 });
  const data = await response.json() as { results?: Array<{ name: string; admin1?: string; country?: string; latitude: number; longitude: number }> };
  return NextResponse.json((data.results ?? []).map((item) => ({
    name: item.name,
    region: item.admin1,
    country: item.country,
    latitude: item.latitude,
    longitude: item.longitude,
  })));
}
