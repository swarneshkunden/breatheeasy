import { HourlyAir } from "./types";

export function bestWindow(hourly: HourlyAir[]) {
  if (hourly.length === 0) return null;
  const windowSize = hourly.length >= 2 ? 2 : 1;
  let bestStart = 0;
  let bestAverage = Number.POSITIVE_INFINITY;
  for (let start = 0; start <= hourly.length - windowSize; start += 1) {
    const average = hourly
      .slice(start, start + windowSize)
      .reduce((sum, hour) => sum + hour.aqi, 0) / windowSize;
    if (average < bestAverage) {
      bestAverage = average;
      bestStart = start;
    }
  }
  return {
    startIndex: bestStart,
    endIndex: bestStart + windowSize - 1,
    hour: hourly[bestStart],
  };
}
