"use client";

import * as React from "react";
import { categorizeAqi } from "@/lib/rules/engine";
import type { AirSnapshot, CityResult } from "@/lib/types";
import type { LucideIcon } from "lucide-react";
import { LoaderCircle, MapPin, Search, Target } from "lucide-react";
import { CitySearch } from "@/components/CitySearch";
import { guidance } from "@/lib/rules/safety";
import { useRef } from "react";
import { useEffect, useState } from "react";
import type { Language } from "@/lib/types";
import { LivingSkyline } from "@/components/LivingSkyline";

interface AirDisplayProps {
  demo: boolean;
  current: AirSnapshot;
  previewAqi: number | null;
  previewCategory: ReturnType<typeof categorizeAqi>;
  CategoryIcon: LucideIcon;
  t: Record<string, string>;
  language: Language;
  loading: boolean;
  locating: boolean;
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
  language,
  loading,
  locating,
  onPlanDay,
  onLocate,
  onToggleFollow,
  following,
  locationError,
  onCitySelect,
}: AirDisplayProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [scenarioAqi, setScenarioAqi] = useState(current.aqi ?? 100);
  const airGuidance = guidance(current.aqi, "general", language);
  const categoryLabels: Record<string, string> = {
    good: t.categoryGood,
    moderate: t.categoryModerate,
    sensitive: t.categorySensitive,
    unhealthy: t.categoryUnhealthy,
    "very-unhealthy": t.categoryVeryUnhealthy,
    hazardous: t.categoryHazardous,
    unavailable: t.airUnavailable,
  };
  const categoryLabel =
    categoryLabels[previewCategory.tone] ?? previewCategory.label;
  useEffect(() => {
    if (current.aqi !== null) setScenarioAqi(current.aqi);
  }, [current.aqi]);
  return (
    <section
      className="hero"
      aria-labelledby="air-heading"
      data-aqi={previewCategory.tone}
    >
      <div className="hero-heading">
        <div className="location-title">
          <p className="eyebrow">
            {t.snapshot}
            <span className="live-mark" aria-hidden="true" />
          </p>
          <h1 id="air-heading">
            {demo ? t.newDelhi : current.city || t.yourLocalAir}
          </h1>
          <p className="location-caption">{t.airCaption}</p>
          {current.source === "unavailable" && (
            <p className="location-error" role="status">
              {t.chooseLocation}
            </p>
          )}
        </div>
        <div className="location-tools">
          <div className="location-actions">
            <button
              type="button"
              className="location-button use-location-button"
              onClick={onLocate}
              title={t.useMyLocation}
              aria-busy={locating}
              disabled={locating}
            >
              {locating ? (
                <LoaderCircle
                  className="location-spinner"
                  size={18}
                  aria-hidden="true"
                />
              ) : (
                <Target size={18} aria-hidden="true" />
              )}
              <span>{locating ? t.locating : t.useMyLocation}</span>
            </button>
            <label className="follow-switch">
              <input
                type="checkbox"
                role="switch"
                checked={following}
                onChange={onToggleFollow}
              />
              <span>{t.keepUpdating}</span>
            </label>
          </div>
          {following && (
            <span className="following-indicator" role="status">
              {t.followingLocation}
            </span>
          )}
          {locationError && (
            <div className="location-error" role="alert">
              <MapPin size={16} aria-hidden="true" />
              <span>{locationError}</span>
              <button
                type="button"
                onClick={() => searchInputRef.current?.focus()}
              >
                <Search size={14} aria-hidden="true" /> {t.searchCity}
              </button>
            </div>
          )}
          <CitySearch
            onSelect={onCitySelect}
            language={language}
            inputRef={searchInputRef}
          />
          {demo && (
            <p className="demo-notice" role="status">
              {t.demoPrompt}
            </p>
          )}
        </div>
      </div>

      <div className="hero-grid">
        <div className="hero-copy">
          <div className={`category category-${previewCategory.tone}`}>
            <CategoryIcon size={16} strokeWidth={1.8} aria-hidden="true" />
            <span aria-label={`${t.airQualityLabel}: ${categoryLabel}`}>
              {categoryLabel}
            </span>
          </div>
          <strong
            className="aqi-number"
            key={previewAqi ?? "unavailable"}
            aria-live="polite"
          >
            {previewAqi ?? "—"}
          </strong>
          <span className="aqi-unit">
            {previewAqi === null ? t.airUnavailable : t.liveReading}
          </span>
          <h2>{previewAqi === null ? t.airUnavailable : t.practicalPlan}</h2>
          <p>{airGuidance.message}</p>
          <button
            className="primary"
            onClick={onPlanDay}
            aria-controls="assistant-panel"
          >
            {loading ? t.buildingPlan : t.plan}
            <span aria-hidden="true">→</span>
          </button>
        </div>
        <div className="hero-visual">
          <LivingSkyline aqi={scenarioAqi} city={current.city || "your city"} />
        </div>
      </div>

      <div className="sky-preview">
        <div>
          <p className="eyebrow">{t.feelDifference}</p>
          <p className="preview-description">{t.scenarioDescription}</p>
        </div>
        <input
          className="aqi-slider"
          type="range"
          min="0"
          max="500"
          step="1"
          value={scenarioAqi}
          aria-label={`${t.feelDifference}: ${t.scenarioDescription}`}
          onChange={(event) => setScenarioAqi(Number(event.target.value))}
        />
        <p className="preview-reading">
          {t.scenarioReading} <strong>{scenarioAqi}</strong>
        </p>
        <div className="range-labels">
          <span>{t.cleaner}</span>
          <span>{t.morePolluted}</span>
        </div>
      </div>

      <div className="pollutant-grid" aria-label={t.pollutantReadings}>
        {[
          {
            label: "PM2.5",
            value: current.pm25,
            unit: "µg/m³",
            note: t.pm25Note,
          },
          {
            label: "PM10",
            value: current.pm10,
            unit: "µg/m³",
            note: t.pm10Note,
          },
          { label: "NO₂", value: current.no2, unit: "µg/m³", note: t.no2Note },
          { label: "O₃", value: current.o3, unit: "µg/m³", note: t.o3Note },
        ].map(({ label, value, unit, note }) => (
          <div className="pollutant" key={label}>
            <span>{label}</span>
            <strong>{value ?? "—"}</strong>
            <small>{value === null ? t.pollutantUnavailable : unit}</small>
            <span className="pollutant-note">{note}</span>
          </div>
        ))}
      </div>

      <div className="data-attribution" aria-label={t.dataSource}>
        <p>{t.airFromOpenMeteo}</p>
      </div>
    </section>
  );
}
