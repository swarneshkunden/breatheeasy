import { describe, expect, it } from "vitest";
import { tripImpact, exposureCigarettes, purifierImpact } from "./calculator";
import { EMISSION_CONSTANTS } from "./constants";

describe("pollutant conversions and impact calculations", () => {
  describe("tripImpact", () => {
    it("returns zero for negative distance", () => {
      expect(tripImpact(-1).co2AvoidedG).toBe(0);
      expect(tripImpact(-1).noxAvoidedG).toBe(0);
    });
    it("calculates CO2 avoided for 5km car trip", () => {
      const result = tripImpact(5);
      const expectedCo2 = Math.round(5 * EMISSION_CONSTANTS.petrolCarGCo2PerKm - 5 * EMISSION_CONSTANTS.metroGCo2PerKm);
      expect(result.co2AvoidedG).toBe(expectedCo2);
    });
    it("calculates NOx avoided", () => {
      const result = tripImpact(5);
      const expectedNoX = Math.round((5 * EMISSION_CONSTANTS.petrolCarGNoXPerKm - 5 * EMISSION_CONSTANTS.metroGNoXPerKm) * 100) / 100;
      expect(result.noxAvoidedG).toBe(expectedNoX);
    });
    it("distance zero returns zero", () => {
      expect(tripImpact(0).co2AvoidedG).toBe(0);
      expect(tripImpact(0).noxAvoidedG).toBe(0);
    });
  });

  describe("exposureCigarettes", () => {
    it("22 ug/m3 equals 1 cigarette", () => {
      expect(exposureCigarettes(22)).toBe(1);
    });
    it("0 ug/m3 equals 0 cigarettes", () => {
      expect(exposureCigarettes(0)).toBe(0);
    });
    it("scales linearly", () => {
      expect(exposureCigarettes(44)).toBe(2);
    });
  });

  describe("purifierImpact", () => {
    it("bounds reduction between 15 and 80 percent", () => {
      expect(purifierImpact(0, 500)).toBeLessThanOrEqual(80);
      expect(purifierImpact(100, 0)).toBeGreaterThanOrEqual(15);
    });
    it("large room reduces effectiveness", () => {
      const small = purifierImpact(10, 240);
      const large = purifierImpact(100, 120);
      expect(large).toBeLessThan(small);
    });
  });
});
