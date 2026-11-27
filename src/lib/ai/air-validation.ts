import { z } from "zod";

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
  })),
  source: z.enum(["live", "demo"]),
  updatedAt: z.string(),
  timezone: z.string().nullable(),
  utcOffsetSeconds: z.number().nullable(),
});

export type ValidatedAirSnapshot = z.infer<typeof airSnapshotSchema>;

export function validateAirSnapshot(data: unknown): ValidatedAirSnapshot {
  const result = airSnapshotSchema.safeParse(data);
  if (!result.success) throw new Error("Invalid air snapshot response");
  return result.data;
}
