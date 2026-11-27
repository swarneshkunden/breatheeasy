export const GEO_ERRORS: Record<number, string> = {
  1: "Location access is blocked. Enable it in your browser settings, or search for a city instead.",
  2: "Location information is unavailable for this device.",
  3: "The location request timed out. Please try again or search for a city.",
};

export const POSITION_OPTIONS = {
  enableHighAccuracy: false,
  timeout: 10_000,
  maximumAge: 5 * 60 * 1000,
};

export function roundCoordinate(value: number): number {
  return Math.round(value * 100) / 100;
}
