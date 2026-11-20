export type Language = "en" | "hi";
export type MemberType = "kids" | "elderly" | "pregnant" | "respiratory" | "adults";
export type CommuteMode = "walk" | "bike" | "two-wheeler" | "car" | "bus" | "metro";
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

export interface AirSnapshot {
  aqi: number;
  pm25: number;
  pm10: number;
  no2: number;
  o3: number;
  city: string;
  latitude: number;
  longitude: number;
  hourly: HourlyAir[];
  source: "live" | "demo";
  updatedAt: string;
}

export interface HourlyAir {
  time: string;
  aqi: number;
  pm25: number;
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
  smartMode: "live" | "offline";
}
