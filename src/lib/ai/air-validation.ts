import { z } from "zod";

// Open-Meteo wire format field names.
const hourlyAirWireSchema = z.object({
  time: z.string(),
  us_aqi: z.number().int().min(0).max(1000),
  pm2_5: z.number().min(0).max(2000),
  pm10: z.number().min(0).max(2000),
  nitrogen_dioxide: z.number().min(0).max(2000),
  ozone: z.number().min(0).max(2000),
});

const airSnapshotWireSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  generationtime_ms: z.number().optional(),
  utc_offset_seconds: z.number().nullable(),
  timezone: z.string().nullable(),
  timezone_abbreviation: z.string().optional(),
  elevation: z.number().optional(),
  current_units: z.object({
    us_aqi: z.string().optional(),
  }).optional(),
  current: z.object({
    time: z.string(),
    us_aqi: z.number().int().min(0).max(1000).optional(),
    pm2_5: z.number().min(0).max(2000).optional(),
    pm10: z.number().min(0).max(2000).optional(),
    nitrogen_dioxide: z.number().min(0).max(2000).optional(),
    ozone: z.number().min(0).max(2000).optional(),
  }).optional(),
  hourly_units: z.object({
    time: z.string().optional(),
    us_aqi: z.string().optional(),
    pm2_5: z.string().optional(),
    pm10: z.string().optional(),
    nitrogen_dioxide: z.string().optional(),
    ozone: z.string().optional(),
  }).optional(),
  hourly: z.object({
    time: z.array(z.string()),
    us_aqi: z.array(z.number().int().min(0).max(1000)).optional(),
    pm2_5: z.array(z.number().min(0).max(2000)).optional(),
    pm10: z.array(z.number().min(0).max(2000)).optional(),
    nitrogen_dioxide: z.array(z.number().min(0).max(2000)).optional(),
    ozone: z.array(z.number().min(0).max(2000)).optional(),
  }).optional(),
});

export type ValidatedAirSnapshot = z.infer<typeof airSnapshotSchema>;

export const airSnapshotSchema = z.object({
  aqi: z.number().int().min(0).max(1000),
  pm25: z.number().min(0).max(2000),
  pm10: z.number().min(0).max(2000),
  no2: z.number().min(0).max(2000),
  o3: z.number().min(0).max(2000),
  city: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  hourly: z.array(z.object({
    time: z.string(),
    aqi: z.number().int().min(0).max(1000),
    pm25: z.number().min(0).max(2000),
    pm10: z.number().min(0).max(2000),
    no2: z.number().min(0).max(2000),
    o3: z.number().min(0).max(2000),
  })),
  source: z.enum(["live", "demo"]),
  updatedAt: z.string(),
  timezone: z.string().nullable(),
  utcOffsetSeconds: z.number().nullable(),
});

function pick<T>(array: T[] | undefined, index: number, fallback: T): T {
  return array?.[index] ?? fallback;
}

export function validateAirSnapshot(data: unknown): ValidatedAirSnapshot {
  const wire = airSnapshotWireSchema.safeParse(data);
  if (!wire.success) throw new Error("Invalid air snapshot response");

  const w = wire.data;
  const hourly = w.hourly;
  const current = w.current;

  // Use the first hourly entry as the current reading if current is missing.
  const currentAqi = current?.us_aqi ?? pick(hourly?.us_aqi, 0, 0);
  const currentPm25 = current?.pm2_5 ?? pick(hourly?.pm2_5, 0, 0);
  const currentPm10 = current?.pm10 ?? pick(hourly?.pm10, 0, 0);
  const currentNo2 = current?.nitrogen_dioxide ?? pick(hourly?.nitrogen_dioxide, 0, 0);
  const currentO3 = current?.ozone ?? pick(hourly?.ozone, 0, 0);

  const hourlyEntries = (hourly?.time ?? []).map((time, i) => ({
    time,
    aqi: pick(hourly?.us_aqi, i, 0),
    pm25: pick(hourly?.pm2_5, i, 0),
    pm10: pick(hourly?.pm10, i, 0),
    no2: pick(hourly?.nitrogen_dioxide, i, 0),
    o3: pick(hourly?.ozone, i, 0),
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
