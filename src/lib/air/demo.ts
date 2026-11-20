import { AirSnapshot } from "../types";

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
  hourly: Array.from({ length: 24 }, (_, hour) => ({
    time: `${String(hour).padStart(2, "0")}:00`,
    aqi: hour < 6 ? 330 : hour < 10 ? 380 : hour < 16 ? 210 : hour < 20 ? 340 : 360,
    pm25: hour < 6 ? 220 : hour < 10 ? 286 : hour < 16 ? 150 : hour < 20 ? 250 : 270,
  })),
};
