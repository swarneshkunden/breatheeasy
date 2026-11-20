import { describe, expect, it } from "vitest";
import { distanceKm, shouldRefetch, formatLocationLabel } from "./location";

describe("distanceKm (haversine)", () => {
  it("returns zero for the same point", () => {
    expect(distanceKm(28.61, 77.21, 28.61, 77.21)).toBe(0);
  });

  it("returns a positive distance between two distinct cities", () => {
    const d = distanceKm(28.61, 77.21, 19.07, 72.87); // Delhi to Mumbai
    expect(d).toBeGreaterThan(1000);
    expect(d).toBeLessThan(1500);
  });

  it("is symmetric", () => {
    const a = distanceKm(28.61, 77.21, 19.07, 72.87);
    const b = distanceKm(19.07, 72.87, 28.61, 77.21);
    expect(a).toBeCloseTo(b, 4);
  });
});

describe("shouldRefetch", () => {
  const now = Date.now();
  const prev: Parameters<typeof shouldRefetch>[0] = { latitude: 28.61, longitude: 77.21, timestamp: now - 1000 };
  const next: Parameters<typeof shouldRefetch>[1] = { latitude: 28.61, longitude: 77.21, timestamp: now };

  it("refetches when there is no previous reading", () => {
    expect(shouldRefetch(null, next, now)).toBe(true);
  });

  it("refetches when more than 15 minutes passed", () => {
    const stale = { ...prev, timestamp: now - 16 * 60 * 1000 };
    expect(shouldRefetch(stale, next, now)).toBe(true);
  });

  it("refetches when moved more than 1 km", () => {
    const moved = { latitude: 28.62, longitude: 77.22, timestamp: now - 1000 };
    expect(shouldRefetch(prev, moved, now)).toBe(true);
  });

  it("does not refetch when within 1 km and 15 minutes", () => {
    const close = { latitude: 28.6101, longitude: 77.2101, timestamp: now - 1000 };
    expect(shouldRefetch(prev, close, now)).toBe(false);
  });
});

describe("formatLocationLabel", () => {
  it("formats Delhi coordinates with cardinal directions", () => {
    expect(formatLocationLabel(28.61, 77.21)).toBe("Your location (28.61°N, 77.21°E)");
  });

  it("formats southern and western hemispheres", () => {
    expect(formatLocationLabel(-33.87, 151.21)).toBe("Your location (33.87°S, 151.21°E)");
    expect(formatLocationLabel(40.71, -74.01)).toBe("Your location (40.71°N, 74.01°W)");
  });
});
