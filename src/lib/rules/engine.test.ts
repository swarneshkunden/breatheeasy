import { describe, expect, it } from "vitest";
import { categorizeAqi, createRulePlan } from "./engine";
import { demoAir } from "../air/demo";
import { tripImpact, exposureCigarettes, purifierImpact } from "../impact/calculator";
import type { HouseholdProfile } from "../types";

const profile: HouseholdProfile = { members: ["kids"], homeType: "apartment", hasAc: true, hasPurifier: false, windows: "sealed", commute: "car", cooking: "lpg", budget: "low" };

describe("BreatheEasy rules", () => {
  it("categorizes hazardous AQI", () => expect(categorizeAqi(380).label).toBe("Hazardous"));
  it("returns complete baseline advice", () => {
    const plan = createRulePlan(demoAir, profile);
    expect(plan.lowEmission.length).toBeGreaterThan(0);
    expect(plan.indoor.length).toBeGreaterThan(0);
    expect(plan.sustainable.length).toBeGreaterThan(0);
  });
  it("calculates trip impacts with edge guards", () => {
    expect(tripImpact(-5).co2AvoidedG).toBe(0);
    expect(tripImpact(5).co2AvoidedG).toBeGreaterThan(0);
  });
  it("calculates exposure approximation", () => expect(exposureCigarettes(22)).toBe(1));
  it("bounds purifier estimates", () => {
    expect(purifierImpact(0, 500)).toBeLessThanOrEqual(80);
    expect(purifierImpact(100, 0)).toBeGreaterThanOrEqual(15);
  });
});
