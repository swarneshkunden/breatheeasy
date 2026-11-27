"use client";

import { categorizeAqi } from "@/lib/rules/engine";
import type { HourlyAir } from "@/lib/types";

interface TimelineSectionProps {
  timeline: HourlyAir[];
}

export function TimelineSection({ timeline }: TimelineSectionProps) {
  return (
    <>
      <div className="timeline-label-row"><span>Today’s hourly air</span><span>Forecast AQI · lower is cleaner</span></div>
      <div className="timeline" role="group" aria-label="Hourly air quality forecast" tabIndex={0} aria-describedby="timeline-hint">
        <span id="timeline-hint" className="sr-only">Use arrow keys to move through the forecast hours.</span>
        {timeline.map((hour) => (
          <div className="timeline-hour" key={hour.time} tabIndex={0} role="button" aria-label={`${hour.time.slice(11, 16)} with AQI ${hour.aqi} ${categorizeAqi(hour.aqi).label}`}>
            <span>{hour.time.slice(11, 16) || hour.time}</span>
            <div className={`timeline-bar aqi-${categorizeAqi(hour.aqi).tone}`} style={{ height: `${Math.max(18, Math.min(100, hour.aqi / 4))}px` }} aria-hidden="true" />
            <b>{hour.aqi}</b>
          </div>
        ))}
      </div>
    </>
  );
}
