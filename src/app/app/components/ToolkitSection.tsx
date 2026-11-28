"use client";

import type { AirSnapshot } from "@/lib/types";
import { guidance, ventilationAdvice } from "@/lib/rules/safety";
import { copy } from "@/lib/i18n";
import type { Language } from "@/lib/types";

interface ToolkitItem {
  id: string;
  title: keyof typeof copy.en;
  cost: keyof typeof copy.en;
  effect: keyof typeof copy.en;
}

interface ToolkitSectionProps {
  toolkit: string[];
  air: AirSnapshot;
  language: Language;
  onToggleTool: (title: string) => void;
}

const TOOLKIT_ITEMS: ToolkitItem[] = [
  {
    id: "seal",
    title: "toolkitSeal",
    cost: "costLow",
    effect: "toolkitSealEffect",
  },
  {
    id: "ventilation",
    title: "ventilationGuidance",
    cost: "costFree",
    effect: "useCurrentForecast",
  },
  {
    id: "exhaust",
    title: "toolkitExhaust",
    cost: "costFree",
    effect: "toolkitExhaustEffect",
  },
  {
    id: "mop",
    title: "toolkitMop",
    cost: "costLow",
    effect: "toolkitMopEffect",
  },
  {
    id: "mask",
    title: "toolkitMask",
    cost: "costMedium",
    effect: "toolkitMaskEffect",
  },
  {
    id: "burning",
    title: "toolkitBurning",
    cost: "costFree",
    effect: "toolkitBurningEffect",
  },
];

export function ToolkitSection({
  toolkit,
  air,
  language,
  onToggleTool,
}: ToolkitSectionProps) {
  const t = copy[language];
  const airGuidance = guidance(air.aqi, "general", language);
  const ventilation = ventilationAdvice(
    air.hourly,
    new Date(),
    air.aqi,
    air.utcOffsetSeconds,
    language,
  );
  return (
    <section className="section" id="toolkit">
      <div className="section-heading">
        <div>
          <p className="eyebrow">{t.toolkit}</p>
          <h2>{t.toolkitHeading}</h2>
        </div>
      </div>
      <div className="toolkit-grid">
        {TOOLKIT_ITEMS.map(({ id, title, cost, effect }) => (
          <label
            className={`tool ${toolkit.includes(id) ? "checked" : ""}`}
            key={id}
          >
            <input
              type="checkbox"
              checked={toolkit.includes(id)}
              onChange={() => onToggleTool(id)}
            />
            <div>
              <strong>{t[title]}</strong>
              <small>
                {t[cost]} · {t[effect]}
              </small>
              {id === "ventilation" && (
                <span className="tool-guidance">{ventilation.message}</span>
              )}
            </div>
          </label>
        ))}
      </div>
      <p className="toolkit-safety" role="status">
        {airGuidance.message}
      </p>
      <details className="glass-card">
        <summary>{t.houseplantMyths}</summary>
        <p>{t.houseplantFact}</p>
      </details>
    </section>
  );
}
