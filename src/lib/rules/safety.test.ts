import { describe, expect, it } from "vitest";
import { guidance, ventilationAdvice } from "./safety";
import type { HourlyAir, MemberType } from "../types";

const profiles: MemberType[] = [
  "kids",
  "elderly",
  "pregnant",
  "respiratory",
  "adults",
];
const now = new Date("2025-01-01T10:00:00.000Z");
const forecast: HourlyAir[] = [
  {
    time: "2025-01-01T09:00:00.000Z",
    aqi: 40,
    pm25: null,
    pm10: null,
    no2: null,
    o3: null,
  },
  {
    time: "2025-01-01T11:00:00.000Z",
    aqi: 60,
    pm25: null,
    pm10: null,
    no2: null,
    o3: null,
  },
];

describe("central air safety guidance", () => {
  it("remains defined for every AQI from 0 to 500 and every household profile", () => {
    for (let aqi = 0; aqi <= 500; aqi += 1) {
      for (const profile of profiles) {
        const advice = guidance(aqi, profile);
        expect(advice.message.length).toBeGreaterThan(0);
        expect(advice.available).toBe(true);
        if (aqi > 100) expect(advice.canVentilate).toBe(false);
      }
    }
  });

  it("never substitutes a good category for missing air readings", () => {
    expect(guidance(null, "adults")).toMatchObject({
      available: false,
      level: "unavailable",
      canVentilate: false,
    });
  });

  it("selects only future forecast hours and keeps windows closed above AQI 100", () => {
    expect(ventilationAdvice(forecast, now, 100).hour?.time).toBe(
      "2025-01-01T11:00:00.000Z",
    );
    expect(ventilationAdvice(forecast, now, 101)).toMatchObject({
      canOpen: false,
      hour: null,
    });
    expect(ventilationAdvice(forecast, now, null)).toMatchObject({
      canOpen: false,
      hour: null,
    });
  });
});
