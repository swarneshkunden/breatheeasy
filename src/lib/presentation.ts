import { HourlyAir } from "./types";
import { EMISSION_CONSTANTS } from "./impact/constants";
import { tripImpact } from "./impact/calculator";

export type SkylineMix = {
  sky: string;
  far: string;
  mid: string;
  near: string;
  sunOpacity: number;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function hexToRgb(hex: string) {
  const value = hex.replace("#", "");
  return [0, 2, 4].map((offset) => Number.parseInt(value.slice(offset, offset + 2), 16));
}

function rgbToHex(rgb: number[]) {
  return `#${rgb.map((channel) => Math.round(clamp(channel, 0, 255)).toString(16).padStart(2, "0")).join("")}`;
}

export function mixHex(from: string, to: string, amount: number) {
  const ratio = clamp(amount, 0, 1);
  const a = hexToRgb(from);
  const b = hexToRgb(to);
  return rgbToHex(a.map((channel, index) => channel + (b[index] - channel) * ratio));
}

export function skyColor(aqi: number) {
  const stops = [
    [0, "#C9DDD8"],
    [100, "#E2DAC0"],
    [200, "#D0B98F"],
    [300, "#A68F77"],
    [400, "#76655A"],
  ] as const;
  const value = clamp(aqi, 0, 400);
  for (let index = 0; index < stops.length - 1; index += 1) {
    const [startAqi, startColor] = stops[index];
    const [endAqi, endColor] = stops[index + 1];
    if (value >= startAqi && value <= endAqi) {
      return mixHex(startColor, endColor, (value - startAqi) / (endAqi - startAqi));
    }
  }
  return stops.at(-1)?.[1] ?? "#76655A";
}

export function skyLayerMix(aqi: number): SkylineMix {
  const sky = skyColor(aqi);
  const haze = clamp(aqi / 300, 0, 1);
  return {
    sky,
    far: mixHex("#8FA89A", sky, haze * 0.92),
    mid: mixHex("#6B8873", sky, haze * 0.66),
    near: mixHex("#42594A", sky, haze * 0.28),
    sunOpacity: clamp(1 - aqi / 260, 0, 1),
  };
}

export function visibilityKm(aqi: number) {
  return Math.max(0.3, 14 * Math.exp(-clamp(aqi, 0, 400) / 130));
}

export function dialSegmentGeometry(radius = 88, gapDegrees = 1) {
  const innerRadius = 62;
  const segmentDegrees = 360 / 24;
  return Array.from({ length: 24 }, (_, index) => {
    const start = index * segmentDegrees + gapDegrees / 2 - 90;
    const end = (index + 1) * segmentDegrees - gapDegrees / 2 - 90;
    return { index, start, end, outerRadius: radius, innerRadius };
  });
}

export function annularSegmentPath(index: number, centerX = 115, centerY = 115) {
  const segment = dialSegmentGeometry(88, 1)[index];
  if (!segment) return "";
  const polar = (radius: number, degrees: number) => ({
    x: centerX + radius * Math.cos((degrees * Math.PI) / 180),
    y: centerY + radius * Math.sin((degrees * Math.PI) / 180),
  });
  const outerStart = polar(segment.outerRadius, segment.start);
  const outerEnd = polar(segment.outerRadius, segment.end);
  const innerEnd = polar(segment.innerRadius, segment.end);
  const innerStart = polar(segment.innerRadius, segment.start);
  const largeArc = segment.end - segment.start <= 180 ? 0 : 1;
  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${segment.outerRadius} ${segment.outerRadius} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${segment.innerRadius} ${segment.innerRadius} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`,
    "Z",
  ].join(" ");
}

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

export function whatIfTotals(selected: readonly string[]) {
  const purifier = selected.includes("purifier");
  const metro = selected.includes("metro");
  const exposure = purifier ? 100 - EMISSION_CONSTANTS.purifierReductionPercent : 100;
  return {
    exposure,
    exposureReduction: purifier ? EMISSION_CONSTANTS.purifierReductionPercent : 0,
    co2AvoidedG: metro ? tripImpact(5).co2AvoidedG : 0,
  };
}
