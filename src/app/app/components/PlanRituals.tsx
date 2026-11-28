"use client";

import { Wind, Sun, Leaf } from "lucide-react";
import { DayDial } from "@/components/DayDial";
import type { HourlyAir } from "@/lib/types";
import { ventilationAdvice } from "@/lib/rules/safety";
import { HourlyTimeline } from "@/components/HourlyTimeline";
import { AqiLegend } from "@/components/AqiLegend";
import { copy, translate } from "@/lib/i18n";
import type { Language } from "@/lib/types";
import { formatForecastTime, forecastTimestamp } from "@/lib/air-time";

interface PlanRitualsProps {
  cleanestTime: string;
  currentAqi: number | null;
  timeline: HourlyAir[];
  locationHour: number;
  utcOffsetSeconds: number | null;
  language: Language;
  streak: number;
  onSharePledge: () => void;
  onEditHousehold: () => void;
  onAddFamily: () => void;
}

export function PlanRituals({
  cleanestTime,
  currentAqi,
  timeline,
  locationHour,
  utcOffsetSeconds,
  language,
  streak,
  onSharePledge,
  onEditHousehold,
  onAddFamily,
}: PlanRitualsProps) {
  const t = copy[language];
  const now = new Date();
  const ventilation = ventilationAdvice(
    timeline,
    now,
    currentAqi,
    utcOffsetSeconds,
    language,
  );
  const measuredHours = timeline.filter((hour) => hour.aqi !== null);
  const futureHours = measuredHours.filter(
    (hour) => forecastTimestamp(hour.time, utcOffsetSeconds) > now.getTime(),
  );
  const worstHour = futureHours.reduce<HourlyAir | null>(
    (worst, hour) =>
      worst === null || (hour.aqi ?? 0) > (worst.aqi ?? 0) ? hour : worst,
    null,
  );
  const safeWindowTime = ventilation.hour
    ? formatForecastTime(ventilation.hour.time, utcOffsetSeconds, language)
    : cleanestTime;
  const worstTime = worstHour
    ? formatForecastTime(worstHour.time, utcOffsetSeconds, language)
    : "—";

  return (
    <section className="section" id="plan">
      <div className="section-heading">
        <div>
          <p className="eyebrow">{t.today}</p>
          <h2>{t.planHeading}</h2>
        </div>
        <button className="secondary" onClick={onEditHousehold}>
          {t.editHousehold}
        </button>
      </div>
      <div className="ritual-grid">
        <article className="ritual-card window-card">
          <div className="ritual-title">
            <Wind size={19} aria-hidden="true" />
            <span>{t.windowTimer}</span>
          </div>
          <span
            className={`window-status ${!ventilation.canOpen ? "closed" : "open"}`}
          >
            {!ventilation.canOpen ? t.keepWindowsClosed : t.goodTimeToOpen}
          </span>
          <h3>
            {ventilation.canOpen
              ? `${t.openAt} ${safeWindowTime}`
              : t.keepWindowsClosed}
          </h3>
          <p>{ventilation.message}</p>
        </article>
        <article className="ritual-card dial-card">
          <div className="ritual-title">
            <Sun size={19} aria-hidden="true" />
            <span>{t.dayDial}</span>
          </div>
          <div className="day-dial">
            <DayDial
              hourly={timeline}
              bestHour={cleanestTime}
              currentHour={locationHour}
              language={language}
            />
          </div>
          <p className="current-time-label">
            {t.currentLocalHour}: {String(locationHour).padStart(2, "0")}:00
          </p>
          <AqiLegend language={language} />
          <p className="dial-caption">{t.lighterCleaner}</p>
        </article>
        <article className="ritual-card pledge-mini" id="community">
          <div className="ritual-title">
            <Leaf size={19} aria-hidden="true" />
            <span>{t.neighborhoodPledge}</span>
          </div>
          <p className="pledge-count">
            <strong>{streak}</strong>
            <span>{t.pledgesShared}</span>
          </p>
          <div
            className="streak-track"
            role="meter"
            aria-label={t.pledgeProgress.replace(
              "{count}",
              String(Math.min(streak, 7)),
            )}
            aria-valuemin={0}
            aria-valuemax={7}
            aria-valuenow={Math.min(streak, 7)}
            aria-valuetext={translate(language, "pledgeProgress", {
              count: Math.min(streak, 7),
            })}
          >
            <span style={{ width: `${(Math.min(streak, 7) / 7) * 100}%` }} />
          </div>
          <ul className="pledge-checklist" aria-label={t.pledgeChecklist}>
            {[t.carpoolDay, t.noBurning, t.treeDustCare, t.schoolActivity].map(
              (item) => (
                <li key={item}>
                  <input type="checkbox" aria-label={item} />
                  {item}
                </li>
              ),
            )}
          </ul>
          <div className="pledge-actions">
            <button className="secondary pledge-button" onClick={onAddFamily}>
              {t.addMyFamily}
            </button>
            <button className="secondary pledge-button" onClick={onSharePledge}>
              {t.sharePledge}
            </button>
          </div>
        </article>
      </div>
      <div className="timeline-label-row">
        <span>{t.twentyFourHourTimeline}</span>
        <span>
          {t.currentTime}: {String(locationHour).padStart(2, "0")}:00
        </span>
      </div>
      <HourlyTimeline
        hourly={timeline}
        currentHour={locationHour}
        utcOffsetSeconds={utcOffsetSeconds}
        language={language}
      />
      <AqiLegend language={language} />
      <div className="window-notes">
        <span>
          <Sun size={16} aria-hidden="true" /> {t.bestWindow}:{" "}
          <strong>{ventilation.canOpen ? safeWindowTime : "—"}</strong>
        </span>
        <span>
          {t.toughestWindow}: <strong>{worstTime}</strong>
        </span>
      </div>
    </section>
  );
}
