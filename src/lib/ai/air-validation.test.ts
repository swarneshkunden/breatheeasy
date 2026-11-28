import { describe, expect, it } from "vitest";
import { validateOpenMeteoAir } from "./air-validation";

describe("validateOpenMeteoAir", () => {
  it("preserves null hourly readings instead of inventing zero values", () => {
    const result = validateOpenMeteoAir({
      latitude: 28.61,
      longitude: 77.21,
      utc_offset_seconds: 19800,
      timezone: "Asia/Kolkata",
      current: {
        time: "2025-01-01T10:00",
        us_aqi: null,
        pm2_5: null,
        pm10: null,
        nitrogen_dioxide: null,
        ozone: null,
      },
      hourly: {
        time: ["2025-01-01T10:00", "2025-01-01T11:00"],
        us_aqi: [42, null],
        pm2_5: [12, null],
        pm10: [22, null],
        nitrogen_dioxide: [9, null],
        ozone: [18, null],
      },
    });

    expect(result.aqi).toBeNull();
    expect(result.pm25).toBeNull();
    expect(result.hourly[1]).toEqual({
      time: "2025-01-01T11:00",
      aqi: null,
      pm25: null,
      pm10: null,
      no2: null,
      o3: null,
    });
  });
});
