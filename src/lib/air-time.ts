import type { Language } from "./types";

export function forecastTimestamp(
  value: string,
  utcOffsetSeconds: number | null = 0,
): number {
  const offset = utcOffsetSeconds ?? 0;
  const hasZone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value);
  const timestamp = Date.parse(hasZone ? value : `${value}Z`);
  return Number.isNaN(timestamp) || hasZone
    ? timestamp
    : timestamp - offset * 1000;
}

export function formatForecastTime(
  value: string,
  utcOffsetSeconds: number | null = 0,
  language: Language = "en",
): string {
  const offset = utcOffsetSeconds ?? 0;
  const timestamp = forecastTimestamp(value, offset);
  if (Number.isNaN(timestamp)) return value;
  return new Date(timestamp + offset * 1000).toLocaleTimeString(
    language === "hi" ? "hi-IN" : "en-US",
    { hour: "2-digit", minute: "2-digit", timeZone: "UTC" },
  );
}
