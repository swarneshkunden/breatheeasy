"use client";

import * as React from "react";
import { categorizeAqi } from "@/lib/rules/engine";
import { copy } from "@/lib/i18n";
import type { HourlyAir, Language } from "@/lib/types";
import { formatForecastTime, forecastTimestamp } from "@/lib/air-time";

interface HourlyTimelineProps {
  hourly: HourlyAir[];
  currentHour: number;
  utcOffsetSeconds: number | null;
  language: Language;
}

export function HourlyTimeline({
  hourly,
  currentHour,
  utcOffsetSeconds,
  language,
}: HourlyTimelineProps) {
  const t = copy[language];
  const offset = utcOffsetSeconds ?? 0;
  const categoryLabels: Record<string, string> = {
    good: t.categoryGood,
    moderate: t.categoryModerate,
    sensitive: t.categorySensitive,
    unhealthy: t.categoryUnhealthy,
    "very-unhealthy": t.categoryVeryUnhealthy,
    hazardous: t.categoryHazardous,
  };
  const measured = hourly.filter(
    (item): item is HourlyAir & { aqi: number } => item.aqi !== null,
  );
  const maximum = Math.max(100, ...measured.map((item) => item.aqi));

  if (measured.length === 0) {
    return (
      <p className="timeline-unavailable" role="status">
        {t.hourlyAirUnavailable}
      </p>
    );
  }

  return (
    <div className="timeline" role="list" aria-label={t.hourlyAirForecast}>
      {measured.map((hour) => {
        const category = categorizeAqi(hour.aqi);
        const timestamp = forecastTimestamp(hour.time, offset);
        const past = Number.isFinite(timestamp) && timestamp < Date.now();
        const isCurrent = Number.isFinite(timestamp)
          ? new Date(timestamp + offset * 1000).getUTCHours() === currentHour &&
            !past
          : false;
        const height = Math.max(12, (hour.aqi / maximum) * 100);
        const categoryLabel = categoryLabels[category.tone] ?? category.label;
        return (
          <div
            className={`timeline-hour${past ? " past" : ""}${isCurrent ? " current" : ""}`}
            key={hour.time}
            role="listitem"
            aria-label={`${formatForecastTime(hour.time, offset, language)}: AQI ${hour.aqi}, ${categoryLabel}${isCurrent ? `, ${t.currentHour}` : ""}`}
          >
            <span className="timeline-value">{hour.aqi}</span>
            <span
              className={`timeline-bar aqi-${category.tone}`}
              style={{ height: `${height}%` }}
              aria-hidden="true"
            />
            {isCurrent && <span className="timeline-now">{t.now}</span>}
            <span>{formatForecastTime(hour.time, offset, language)}</span>
          </div>
        );
      })}
    </div>
  );
}
