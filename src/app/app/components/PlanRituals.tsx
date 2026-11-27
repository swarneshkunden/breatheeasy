"use client";

import { Wind, Sun, Leaf } from "lucide-react";
import { DayDial } from "@/components/DayDial";
import type { HourlyAir } from "@/lib/types";

interface PlanRitualsProps {
  cleanestWindow: { hour: { time: string; aqi: number } } | null;
  cleanestTime: string;
  timeline: HourlyAir[];
  locationHour: number;
  streak: number;
  onSharePledge: () => void;
}

export function PlanRituals({
  cleanestWindow,
  cleanestTime,
  timeline,
  locationHour,
  streak,
  onSharePledge,
}: PlanRitualsProps) {
  const worstHour = timeline.reduce((worst, hour) => hour.aqi > worst.aqi ? hour : worst, timeline[0]);
  const isWindowOpen = cleanestWindow ? cleanestWindow.hour.aqi <= 150 : true;

  return (
    <section className="section" id="plan">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Today</p>
          <h2>Small rituals, better hours</h2>
        </div>
        <button className="secondary">Edit household</button>
      </div>
      <div className="ritual-grid">
        <article className="ritual-card window-card">
          <div className="ritual-title"><Wind size={19} aria-hidden="true" /><span>Window timer</span></div>
          <span className={`window-status ${!isWindowOpen ? "closed" : "open"}`}>{!isWindowOpen ? "Keep windows closed" : "Good time to open"}</span>
          <h3>{!isWindowOpen ? "Even the best hour is unhealthy" : `Open at ${cleanestTime}`}</h3>
          <p>{!isWindowOpen
            ? "Use filtration indoors and keep windows closed. Ventilation is not recommended at these forecast levels."
            : "Ventilate about 10 minutes, then close up again. This window has the lowest forecast AQI."}</p>
        </article>
        <article className="ritual-card dial-card">
          <div className="ritual-title"><Sun size={19} aria-hidden="true" /><span>Day dial</span></div>
          <div className="day-dial">
            <DayDial hourly={timeline} bestHour={cleanestTime} currentHour={locationHour} />
          </div>
          <p className="dial-caption">Lighter is cleaner. Darker is worse.</p>
        </article>
        <article className="ritual-card pledge-mini" id="community">
          <div className="ritual-title"><Leaf size={19} aria-hidden="true" /><span>Neighborhood pledge</span></div>
          <p className="pledge-count"><strong>{streak}</strong><span>day clean-air streak</span></p>
          <div className="streak-track" role="meter" aria-label="Clean-air streak progress" aria-valuemin={0} aria-valuemax={7} aria-valuenow={Math.min(streak, 7)} aria-valuetext={`${Math.min(streak, 7)} of 7 clean-air days`}><span style={{ width: `${Math.min(streak, 7) / 7 * 100}%` }} /></div>
          <ul className="pledge-checklist" aria-label="Clean air pledge checklist">
            {["Carpool day", "No burning", "Tree & dust care", "School activity check"].map((item) => (
              <li key={item}><input type="checkbox" aria-label={item} />{item}</li>
            ))}
          </ul>
          <button className="secondary pledge-button" onClick={onSharePledge}>Add my family</button>
        </article>
      </div>
      <div className="window-notes"><span><Sun size={16} aria-hidden="true" /> Best window: <strong>{cleanestTime}</strong></span><span>Toughest window: <strong>{worstHour?.time.slice(11, 16) || "08:00"}</strong></span></div>
    </section>
  );
}
