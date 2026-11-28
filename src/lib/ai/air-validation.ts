import "server-only";
import { z } from "zod";
import type { AirSnapshot } from "../types";

// Open-Meteo wire format field names.
const nullableAqiWireSchema = z.number().int().min(0).max(1000).nullable();
const nullablePollutantWireSchema = z.number().min(0).max(2000).nullable();

const airSnapshotWireSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  generationtime_ms: z.number().optional(),
  utc_offset_seconds: z.number().nullable(),
  timezone: z.string().nullable(),
  timezone_abbreviation: z.string().optional(),
  elevation: z.number().optional(),
  current_units: z
    .object({
      us_aqi: z.string().optional(),
    })
    .optional(),
  current: z
    .object({
      time: z.string(),
      us_aqi: nullableAqiWireSchema.optional(),
      pm2_5: nullablePollutantWireSchema.optional(),
      pm10: nullablePollutantWireSchema.optional(),
      nitrogen_dioxide: nullablePollutantWireSchema.optional(),
      ozone: nullablePollutantWireSchema.optional(),
    })
    .optional(),
  hourly_units: z
    .object({
      time: z.string().optional(),
      us_aqi: z.string().optional(),
      pm2_5: z.string().optional(),
      pm10: z.string().optional(),
      nitrogen_dioxide: z.string().optional(),
      ozone: z.string().optional(),
    })
    .optional(),
  hourly: z
    .object({
      time: z.array(z.string()),
      us_aqi: z.array(nullableAqiWireSchema).optional(),
      pm2_5: z.array(nullablePollutantWireSchema).optional(),
      pm10: z.array(nullablePollutantWireSchema).optional(),
      nitrogen_dioxide: z.array(nullablePollutantWireSchema).optional(),
      ozone: z.array(nullablePollutantWireSchema).optional(),
    })
    .optional(),
});

export type ValidatedAirSnapshot = AirSnapshot;

function pick<T>(array: (T | null)[] | undefined, index: number): T | null {
  return array?.[index] ?? null;
}

export function validateOpenMeteoAir(data: unknown): ValidatedAirSnapshot {
  const wire = airSnapshotWireSchema.safeParse(data);
  if (!wire.success) throw new Error("Invalid air snapshot response");

  const w = wire.data;
  const hourly = w.hourly;
  const current = w.current;

  const currentAqi = current?.us_aqi ?? null;
  const currentPm25 = current?.pm2_5 ?? null;
  const currentPm10 = current?.pm10 ?? null;
  const currentNo2 = current?.nitrogen_dioxide ?? null;
  const currentO3 = current?.ozone ?? null;

  const hourlyEntries = (hourly?.time ?? []).map((time, i) => ({
    time,
    aqi: pick(hourly?.us_aqi, i),
    pm25: pick(hourly?.pm2_5, i),
    pm10: pick(hourly?.pm10, i),
    no2: pick(hourly?.nitrogen_dioxide, i),
    o3: pick(hourly?.ozone, i),
  }));

  return {
    aqi: currentAqi,
    pm25: currentPm25,
    pm10: currentPm10,
    no2: currentNo2,
    o3: currentO3,
    city: "", // Set by the route handler based on reverse geocoding.
    latitude: w.latitude,
    longitude: w.longitude,
    hourly: hourlyEntries,
    source: "live",
    updatedAt: new Date().toISOString(),
    timezone: w.timezone,
    utcOffsetSeconds: w.utc_offset_seconds,
  };
}
