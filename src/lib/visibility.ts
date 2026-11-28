const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export function visibilityKm(aqi: number) {
  return Math.max(0.3, 14 * Math.exp(-clamp(aqi, 0, 400) / 130));
}
