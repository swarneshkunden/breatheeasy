import { describe, expect, it } from "vitest";
import { bestWindow, dialSegmentGeometry, mixHex, skyColor, skyLayerMix, visibilityKm } from "./presentation";

describe("presentation calculations", () => {
  it("clamps sky color endpoints", () => {
    expect(skyColor(-20)).toBe("#c9ddd8");
    expect(skyColor(400)).toBe("#76655a");
    expect(skyColor(500)).toBe("#76655a");
  });

  it("interpolates and mixes center palette stops", () => {
    expect(skyColor(200)).toBe("#d0b98f");
    expect(mixHex("#000000", "#ffffff", 0.5)).toBe("#808080");
  });

  it("fades distant skyline layers first and removes the sun", () => {
    expect(skyLayerMix(300).sunOpacity).toBe(0);
    expect(skyLayerMix(300).far).not.toBe(skyLayerMix(0).far);
  });

  it("uses a bounded PM2.5-independent AQI visibility approximation", () => {
    expect(visibilityKm(0)).toBeCloseTo(14, 5);
    expect(visibilityKm(400)).toBeGreaterThanOrEqual(0.3);
  });

  it("creates 24 dial segments with a 1 degree gap", () => {
    const segments = dialSegmentGeometry();
    expect(segments).toHaveLength(24);
    expect(segments[0].start).toBe(-89.5);
    expect(segments[0].end).toBe(-75.5);
  });

  it("finds the lowest-AQI contiguous hour window", () => {
    const hourly = [
      { time: "12:00", aqi: 120, pm25: 50 },
      { time: "13:00", aqi: 80, pm25: 30 },
      { time: "14:00", aqi: 60, pm25: 20 },
    ];
    expect(bestWindow(hourly)?.hour.time).toBe("14:00");
    expect(bestWindow([])).toBeNull();
  });
});
