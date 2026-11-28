const toRad = (value: number) => (value * Math.PI) / 180;

export function distanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export interface LocationReading {
  latitude: number;
  longitude: number;
  timestamp: number;
}

const REFRESH_DISTANCE_KM = 1;
const REFRESH_INTERVAL_MS = 15 * 60 * 1000;

export function shouldRefetch(
  prev: LocationReading | null,
  next: LocationReading,
  now: number,
): boolean {
  if (!prev) return true;
  if (now - prev.timestamp > REFRESH_INTERVAL_MS) return true;
  return (
    distanceKm(prev.latitude, prev.longitude, next.latitude, next.longitude) >
    REFRESH_DISTANCE_KM
  );
}

export function formatLocationLabel(
  latitude: number,
  longitude: number,
): string {
  const latDir = latitude >= 0 ? "N" : "S";
  const lonDir = longitude >= 0 ? "E" : "W";
  return `Your location (${Math.abs(latitude).toFixed(2)}\u00B0${latDir}, ${Math.abs(longitude).toFixed(2)}\u00B0${lonDir})`;
}
