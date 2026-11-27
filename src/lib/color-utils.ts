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
