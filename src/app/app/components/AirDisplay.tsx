"use client";

import { categorizeAqi } from "@/lib/rules/engine";
import type { AirSnapshot, CityResult } from "@/lib/types";
import type { LucideIcon } from "lucide-react";
import { CitySearch } from "@/components/CitySearch";

interface AirDisplayProps {
  demo: boolean;
  current: AirSnapshot;
  previewAqi: number;
  previewCategory: ReturnType<typeof categorizeAqi>;
  CategoryIcon: LucideIcon;
  t: Record<string, string>;
  loading: boolean;
  onPlanDay: () => void;
  onLocate: () => void;
  onToggleFollow: () => void;
  following: boolean;
  locationError: string | null;
  onCitySelect: (city: CityResult) => void;
}

export function AirDisplay({
  demo,
  current,
  previewAqi,
  previewCategory,
  CategoryIcon,
  t,
  loading,
  onPlanDay,
  onLocate,
  onToggleFollow,
  following,
  locationError,
  onCitySelect,
}: AirDisplayProps) {
  return (
    <section className="hero" aria-labelledby="air-heading" data-aqi={previewCategory.tone}>
      <div className="hero-heading">
        <div className="location-title">
          <p className="eyebrow">{t.snapshot}<span className="live-mark" aria-hidden="true" /></p>
          <h1 id="air-heading">{demo ? "New Delhi" : current.city}</h1>
          <p className="location-caption">A softer way to read the air around you</p>
        </div>
        <div className="location-tools">
          <button className="secondary location-button" onClick={onLocate} aria-hidden={true} />
          <button
            className={`secondary location-button ${following ? "location-active" : ""}`}
            aria-pressed={following}
            onClick={onToggleFollow}
          >
            {following ? "Following location" : "Follow my location"}
          </button>
          {following && <span className="following-indicator">Following your location, updates when you move</span>}
          {locationError && <span className="location-error" role="alert">{locationError}</span>}
          <CitySearch onSelect={onCitySelect} />
        </div>
      </div>

      <div className="hero-grid">
        <div className="hero-copy">
          <div className={`category category-${previewCategory.tone}`}><CategoryIcon size={16} strokeWidth={1.8} aria-hidden="true" /><span>{previewCategory.label}</span></div>
          <strong className="aqi-number animate-in" key={previewAqi}>{previewAqi}</strong>
          <span className="aqi-unit">US AQI <span>·</span> {current.updatedAt ? "Updated just now" : "Current reading"}</span>
          <h2>{previewAqi > 200 ? "Keep the family indoors" : previewAqi > 100 ? "Choose your outside moments" : "A little more room to breathe"}</h2>
          <p>{previewAqi > 200
            ? "Wear a well-fitted N95 or FFP2 outdoors if needed. Run filtration indoors and postpone strenuous activity."
            : "Use the cleaner hours for time outside, and keep checking conditions as they change."}</p>
          <button className="primary" onClick={onPlanDay} aria-expanded={false} aria-controls="assistant-panel">{loading ? "Building your plan…" : t.plan}<span aria-hidden="true">→</span></button>
        </div>
      </div>

      <div className="pollutant-grid" aria-label="Pollutant readings">
        {[
          ["PM2.5", current.pm25, "µg/m³", "Fine particles"],
          ["PM10", current.pm10, "µg/m³", "Coarse particles"],
          ["NO₂", current.no2, "µg/m³", "Traffic gas"],
          ["O₃", current.o3, "µg/m³", "Ground-level ozone"],
        ].map(([label, value, unit, note]) => (
          <div className="pollutant" key={label}>
            <span>{label}</span><strong>{value}</strong><small>{unit}</small>
            <span className="pollutant-note">{note}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
