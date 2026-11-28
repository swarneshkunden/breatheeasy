import { AQI_THRESHOLDS } from "../constants";
import { copy } from "../i18n";
import { forecastTimestamp } from "../air-time";
import type { HourlyAir, Language, MemberType } from "../types";

export type GuidanceGroup = MemberType | "general";

export interface AirGuidance {
  available: boolean;
  level:
    | "good"
    | "moderate"
    | "sensitive"
    | "unhealthy"
    | "very-unhealthy"
    | "hazardous"
    | "unavailable";
  message: string;
  canVentilate: boolean;
}

export function guidance(
  aqi: number | null,
  group: GuidanceGroup,
  language: Language = "en",
): AirGuidance {
  const t = copy[language];
  const isSensitive = group !== "adults" && group !== "general";
  if (aqi === null) {
    return {
      available: false,
      level: "unavailable",
      message: t.unavailableGuidance,
      canVentilate: false,
    };
  }

  if (aqi <= AQI_THRESHOLDS.GOOD) {
    return {
      available: true,
      level: "good",
      message: t.goodGeneralGuidance,
      canVentilate: true,
    };
  }
  if (aqi <= AQI_THRESHOLDS.MODERATE) {
    return {
      available: true,
      level: "moderate",
      message: isSensitive
        ? t.moderateSensitiveGuidance
        : t.moderateGeneralGuidance,
      canVentilate: true,
    };
  }
  if (aqi <= AQI_THRESHOLDS.SENSITIVE) {
    return {
      available: true,
      level: "sensitive",
      message: isSensitive
        ? t.sensitiveGroupGuidance
        : t.sensitiveGeneralGuidance,
      canVentilate: false,
    };
  }
  if (aqi <= AQI_THRESHOLDS.UNHEALTHY) {
    return {
      available: true,
      level: "unhealthy",
      message: isSensitive
        ? t.unhealthySensitiveGuidance
        : t.unhealthyGeneralGuidance,
      canVentilate: false,
    };
  }
  if (aqi <= AQI_THRESHOLDS.VERY_UNHEALTHY) {
    return {
      available: true,
      level: "very-unhealthy",
      message: t.veryUnhealthyGuidance,
      canVentilate: false,
    };
  }
  return {
    available: true,
    level: "hazardous",
    message: t.hazardousGuidance,
    canVentilate: false,
  };
}

export interface VentilationAdvice {
  canOpen: boolean;
  hour: HourlyAir | null;
  message: string;
}

export function ventilationAdvice(
  hourly: HourlyAir[],
  now: Date,
  aqi: number | null,
  utcOffsetSeconds: number | null = 0,
  language: Language = "en",
): VentilationAdvice {
  const t = copy[language];
  const limit = AQI_THRESHOLDS.MODERATE;
  if (aqi === null || aqi > AQI_THRESHOLDS.MODERATE) {
    return {
      canOpen: false,
      hour: null,
      message: t.ventilationClosedCurrent.replace("{limit}", String(limit)),
    };
  }

  const nextSafeHour = hourly
    .filter(
      (hour) =>
        hour.aqi !== null &&
        forecastTimestamp(hour.time, utcOffsetSeconds) > now.getTime() &&
        hour.aqi <= AQI_THRESHOLDS.MODERATE,
    )
    .sort(
      (left, right) =>
        forecastTimestamp(left.time, utcOffsetSeconds) -
        forecastTimestamp(right.time, utcOffsetSeconds),
    )[0];

  if (!nextSafeHour) {
    return {
      canOpen: false,
      hour: null,
      message: t.ventilationNoSafeHour.replace("{limit}", String(limit)),
    };
  }

  return {
    canOpen: true,
    hour: nextSafeHour,
    message: t.ventilationOpenHour.replace("{limit}", String(limit)),
  };
}
