import { describe, expect, it } from "vitest";
import { forecastTimestamp, formatForecastTime } from "./air-time";

describe("location-local forecast times", () => {
  it("interprets naive forecast timestamps in the location timezone", () => {
    const timestamp = forecastTimestamp("2025-01-01T10:00:00", 19_800);
    expect(new Date(timestamp).toISOString()).toBe("2025-01-01T04:30:00.000Z");
    expect(formatForecastTime("2025-01-01T10:00:00", 19_800)).toMatch(/10:00/);
  });

  it("preserves explicit timezone timestamps", () => {
    expect(forecastTimestamp("2025-01-01T10:00:00Z", 19_800)).toBe(
      Date.parse("2025-01-01T10:00:00Z"),
    );
  });
});
