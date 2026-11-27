import { describe, expect, it } from "vitest";
import { categorizeAqi } from "./engine";
import { AQI_THRESHOLDS } from "../constants";

describe("AQI category boundaries", () => {
  it("Good: 0-50", () => {
    expect(categorizeAqi(0).label).toBe("Good");
    expect(categorizeAqi(50).label).toBe("Good");
    expect(categorizeAqi(51).label).not.toBe("Good");
  });
  it("Moderate: 51-100", () => {
    expect(categorizeAqi(51).label).toBe("Moderate");
    expect(categorizeAqi(100).label).toBe("Moderate");
    expect(categorizeAqi(101).label).not.toBe("Moderate");
  });
  it("Sensitive: 101-150", () => {
    expect(categorizeAqi(101).label).toBe("Unhealthy for sensitive groups");
    expect(categorizeAqi(150).label).toBe("Unhealthy for sensitive groups");
    expect(categorizeAqi(151).label).not.toBe("Unhealthy for sensitive groups");
  });
  it("Unhealthy: 151-200", () => {
    expect(categorizeAqi(151).label).toBe("Unhealthy");
    expect(categorizeAqi(200).label).toBe("Unhealthy");
    expect(categorizeAqi(201).label).not.toBe("Unhealthy");
  });
  it("Very unhealthy: 201-300", () => {
    expect(categorizeAqi(201).label).toBe("Very unhealthy");
    expect(categorizeAqi(300).label).toBe("Very unhealthy");
    expect(categorizeAqi(301).label).not.toBe("Very unhealthy");
  });
  it("Hazardous: 301+", () => {
    expect(categorizeAqi(301).label).toBe("Hazardous");
    expect(categorizeAqi(500).label).toBe("Hazardous");
  });
  it("threshold constants match boundaries", () => {
    expect(AQI_THRESHOLDS.GOOD).toBe(50);
    expect(AQI_THRESHOLDS.MODERATE).toBe(100);
    expect(AQI_THRESHOLDS.SENSITIVE).toBe(150);
    expect(AQI_THRESHOLDS.UNHEALTHY).toBe(200);
    expect(AQI_THRESHOLDS.VERY_UNHEALTHY).toBe(300);
    expect(AQI_THRESHOLDS.HAZARDOUS).toBe(400);
  });
});
