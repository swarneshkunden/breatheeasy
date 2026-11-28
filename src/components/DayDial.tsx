"use memo";

import { memo } from "react";
import { categorizeAqi } from "@/lib/rules/engine";
import { HourlyAir } from "@/lib/types";
import { annularSegmentPath } from "@/lib/presentation";
import { copy } from "@/lib/i18n";
import type { Language } from "@/lib/types";

const dialColors: Record<string, string> = {
  good: "#6F8F72",
  moderate: "#C2A25A",
  sensitive: "#C98A4B",
  unhealthy: "#B5654A",
  "very-unhealthy": "#8A4B5C",
  hazardous: "#5A3E3A",
  unavailable: "#8a8d83",
};

interface DayDialProps {
  hourly: HourlyAir[];
  bestHour: string;
  currentHour?: number;
  language?: Language;
}

function DayDialView({
  hourly,
  bestHour,
  currentHour,
  language = "en",
}: DayDialProps) {
  const t = copy[language];
  const hours = hourly.filter((hour) => hour.aqi !== null).slice(0, 24);
  const now = currentHour ?? 0;
  const markerAngle = now * 15 - 90;

  return (
    <div className="dial-card-content">
      <svg
        viewBox="0 0 230 230"
        role="img"
        aria-label={`${t.dialDescription}. ${t.bestHour}: ${bestHour}.`}
      >
        {hours.map((hour, index) => (
          <path
            key={hour.time}
            d={annularSegmentPath(index, 115, 115)}
            fill={dialColors[categorizeAqi(hour.aqi).tone]}
            aria-hidden="true"
          />
        ))}
        <line
          x1={115}
          y1={115}
          x2={115 + 96 * Math.cos((markerAngle * Math.PI) / 180)}
          y2={115 + 96 * Math.sin((markerAngle * Math.PI) / 180)}
          className="dial-current-marker"
          aria-hidden="true"
        />
        <text x="115" y="17" textAnchor="middle" className="dial-hour-label">
          12 am
        </text>
        <text x="213" y="119" textAnchor="middle" className="dial-hour-label">
          6 am
        </text>
        <text x="115" y="226" textAnchor="middle" className="dial-hour-label">
          12 pm
        </text>
        <text x="17" y="119" textAnchor="middle" className="dial-hour-label">
          6 pm
        </text>
      </svg>
      <div className="dial-center">
        <span>{t.bestHour}</span>
        <strong>{bestHour}</strong>
      </div>
      <table className="sr-only">
        <caption>Hour-by-hour AQI values</caption>
        <thead>
          <tr>
            <th>Hour</th>
            <th>US AQI</th>
          </tr>
        </thead>
        <tbody>
          {hours.map((hour) => (
            <tr key={hour.time}>
              <td>{hour.time}</td>
              <td>{hour.aqi}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export const DayDial = memo(DayDialView);
