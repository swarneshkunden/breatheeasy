import { NextRequest } from "next/server";
import { z } from "zod";

export const profileSchema = z.object({
  members: z.array(z.enum(["kids", "elderly", "pregnant", "respiratory", "adults"])).max(5),
  homeType: z.enum(["apartment", "house"]),
  hasAc: z.boolean(),
  hasPurifier: z.boolean(),
  windows: z.enum(["sealed", "normal"]),
  commute: z.enum(["walk", "bike", "two-wheeler", "car", "bus", "metro"]),
  cooking: z.enum(["lpg", "induction", "wood"]),
  budget: z.enum(["low", "medium", "high"]),
});

export const aiRequestSchema = z.object({
  message: z.string().trim().min(1).max(1200),
  language: z.enum(["en", "hi"]),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  currentAqi: z.number().int().min(0).max(1000),
  pm25: z.number().min(0).max(2000),
  profile: profileSchema,
});

export function roundCoordinate(value: number) {
  return Math.round(value * 100) / 100;
}

export function clientIp(request: NextRequest): string {
  // Prefer standardized client-ip headers over x-forwarded-for which can be spoofed.
  return (
    request.headers.get("x-real-ip")?.trim() ||
    request.headers.get("x-client-ip")?.trim() ||
    request.headers.get("cf-connecting-ip")?.trim() ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "local"
  );
}
