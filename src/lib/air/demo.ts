import type { AirSnapshot } from "../types";

const startOfHour = new Date();
startOfHour.setMinutes(0, 0, 0);

export const demoAir: AirSnapshot = {
  aqi: 380,
  pm25: 286,
  pm10: 420,
  no2: 82,
  o3: 31,
  city: "New Delhi",
  latitude: 28.61,
  longitude: 77.21,
  source: "demo",
  updatedAt: new Date().toISOString(),
  timezone: null,
  utcOffsetSeconds: null,
  hourly: Array.from({ length: 24 }, (_, index) => {
    const time = new Date(startOfHour.getTime() + index * 60 * 60 * 1000);
    const hour = time.getHours();
    return {
      time: time.toISOString(),
      aqi:
        hour < 6
          ? 330
          : hour < 10
            ? 380
            : hour < 16
              ? 210
              : hour < 20
                ? 340
                : 360,
      pm25:
        hour < 6
          ? 220
          : hour < 10
            ? 286
            : hour < 16
              ? 150
              : hour < 20
                ? 250
                : 270,
      pm10:
        hour < 6
          ? 330
          : hour < 10
            ? 420
            : hour < 16
              ? 300
              : hour < 20
                ? 370
                : 390,
      no2:
        hour < 6 ? 60 : hour < 10 ? 82 : hour < 16 ? 58 : hour < 20 ? 74 : 68,
      o3: hour < 6 ? 24 : hour < 10 ? 31 : hour < 16 ? 36 : hour < 20 ? 28 : 25,
    };
  }),
};
