import { z } from "zod";

export type Language = "en" | "hi";
export type MemberType =
  | "kids"
  | "elderly"
  | "pregnant"
  | "respiratory"
  | "adults";
export type CommuteMode =
  | "walk"
  | "bike"
  | "two-wheeler"
  | "car"
  | "bus"
  | "metro";
export type CookingFuel = "lpg" | "induction" | "wood";
export type Budget = "low" | "medium" | "high";

export interface HouseholdProfile {
  members: MemberType[];
  homeType: "apartment" | "house";
  hasAc: boolean;
  hasPurifier: boolean;
  windows: "sealed" | "normal";
  commute: CommuteMode;
  cooking: CookingFuel;
  budget: Budget;
}

const nullableAqiSchema = z.number().int().min(0).max(1000).nullable();
const nullablePollutantSchema = z.number().min(0).max(2000).nullable();

export const HourlyAirSchema = z.object({
  time: z.string(),
  aqi: nullableAqiSchema,
  pm25: nullablePollutantSchema,
  pm10: nullablePollutantSchema,
  no2: nullablePollutantSchema,
  o3: nullablePollutantSchema,
});

export const AirSnapshotSchema = z.object({
  aqi: nullableAqiSchema,
  pm25: nullablePollutantSchema,
  pm10: nullablePollutantSchema,
  no2: nullablePollutantSchema,
  o3: nullablePollutantSchema,
  city: z.string(),
  latitude: z.number().min(-90).max(90).multipleOf(0.01),
  longitude: z.number().min(-180).max(180).multipleOf(0.01),
  hourly: z.array(HourlyAirSchema),
  source: z.enum(["live", "demo", "unavailable"]),
  updatedAt: z.string(),
  timezone: z.string().nullable(),
  utcOffsetSeconds: z.number().nullable(),
});

export type AirSnapshot = z.infer<typeof AirSnapshotSchema>;
export type HourlyAir = z.infer<typeof HourlyAirSchema>;

export interface CityResult {
  name: string;
  admin1: string | null;
  country: string | null;
  latitude: number;
  longitude: number;
}

export interface AdviceTip {
  title: string;
  detail: string;
  impact: string;
  score: number;
}

export interface AdvicePlan {
  lowEmission: AdviceTip[];
  indoor: AdviceTip[];
  sustainable: AdviceTip[];
  answer: string;
  tips: string[];
  followUps: string[];
  smartMode: "live" | "offline";
  smartModeReason?:
    | "missing_api_key"
    | "provider_auth"
    | "model_unavailable"
    | "quota_or_rate_limit"
    | "timeout"
    | "invalid_response"
    | "provider_error"
    | "network_error";
  smartModeStatus?: number;
}
