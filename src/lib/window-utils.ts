import { HourlyAir } from "./types";

export function bestWindow(hourly: HourlyAir[]) {
  const available = hourly.filter((hour) => hour.aqi !== null);
  if (available.length === 0) return null;
  const windowSize = available.length >= 2 ? 2 : 1;
  let bestStart = 0;
  let bestAverage = Number.POSITIVE_INFINITY;
  for (let start = 0; start <= available.length - windowSize; start += 1) {
    const average =
      available
        .slice(start, start + windowSize)
        .reduce((sum, hour) => sum + (hour.aqi ?? 0), 0) / windowSize;
    if (average < bestAverage) {
      bestAverage = average;
      bestStart = start;
    }
  }
  return {
    startIndex: bestStart,
    endIndex: bestStart + windowSize - 1,
    hour: available[bestStart],
  };
}
