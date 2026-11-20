import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { roundCoordinate } from "@/lib/security/validation";

const schema = z.object({ latitude: z.number().min(-90).max(90), longitude: z.number().min(-180).max(180) });

export async function POST(request: NextRequest) {
  if (request.headers.get("content-type")?.includes("application/json") !== true) {
    return NextResponse.json({ error: "Invalid content type" }, { status: 415 });
  }
  const raw = await request.text();
  if (raw.length > 16000) {
    return NextResponse.json({ error: "Request too large" }, { status: 413 });
  }
  try {
    const json: unknown = JSON.parse(raw);
    const data = schema.parse(json);
    const lat = roundCoordinate(data.latitude);
    const lon = roundCoordinate(data.longitude);
    const url = new URL("https://air-quality-api.open-meteo.com/v1/air-quality");
    url.search = new URLSearchParams({
      latitude: String(lat),
      longitude: String(lon),
      current: "us_aqi,pm2_5,pm10,nitrogen_dioxide,ozone",
      hourly: "us_aqi,pm2_5",
      forecast_days: "2",
      timezone: "auto",
    }).toString();
    const response = await fetch(url, { next: { revalidate: 600 } });
    if (!response.ok) throw new Error("Air provider unavailable");
    const payload = await response.json() as {
      current: { us_aqi: number; pm2_5: number; pm10: number; nitrogen_dioxide: number; ozone: number };
      hourly: { time: string[]; us_aqi: number[]; pm2_5: number[] };
    };
    return NextResponse.json({
      aqi: payload.current.us_aqi,
      pm25: payload.current.pm2_5,
      pm10: payload.current.pm10,
      no2: payload.current.nitrogen_dioxide,
      o3: payload.current.ozone,
      latitude: lat,
      longitude: lon,
      city: "Your location",
      source: "live",
      updatedAt: new Date().toISOString(),
      hourly: payload.hourly.time.slice(0, 48).map((time, index) => ({
        time,
        aqi: payload.hourly.us_aqi[index] ?? payload.current.us_aqi,
        pm25: payload.hourly.pm2_5[index] ?? payload.current.pm2_5,
      })),
    });
  } catch {
    return NextResponse.json({ error: "Air data is temporarily unavailable" }, { status: 502 });
  }
}
