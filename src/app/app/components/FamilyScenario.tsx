"use client";

import { TrainFront, AirVent, Zap, type LucideIcon } from "lucide-react";
import type { HouseholdProfile } from "@/lib/types";
import { guidance } from "@/lib/rules/safety";
import { copy, translate } from "@/lib/i18n";
import type { Language } from "@/lib/types";

interface FamilyScenarioProps {
  scenarioActions: string[];
  scenarioImpact: {
    exposure: number;
    exposureReduction: number;
    co2AvoidedG: number;
  };
  current: { aqi: number | null };
  profile: HouseholdProfile;
  language: Language;
  onToggleAction: (id: string) => void;
  onEditHousehold: () => void;
  onAddFamily: () => void;
}

const memberLabels: Record<
  HouseholdProfile["members"][number],
  { name: keyof typeof copy.en; age: keyof typeof copy.en; initial: string }
> = {
  kids: { name: "memberChild", age: "memberSchoolAge", initial: "C" },
  elderly: { name: "memberOlderAdult", age: "memberExtraCare", initial: "E" },
  pregnant: { name: "memberPregnant", age: "memberExtraCare", initial: "P" },
  respiratory: {
    name: "memberRespiratory",
    age: "memberSensitive",
    initial: "R",
  },
  adults: { name: "memberHealthyAdult", age: "memberEveryday", initial: "A" },
};

const actions: Array<{
  id: string;
  icon: LucideIcon;
  label: keyof typeof copy.en;
}> = [
  { id: "metro", icon: TrainFront, label: "actionMetro" },
  { id: "purifier", icon: AirVent, label: "actionPurifier" },
  { id: "induction", icon: Zap, label: "actionInduction" },
];

export function FamilyScenario({
  scenarioActions,
  scenarioImpact,
  current,
  profile,
  language,
  onToggleAction,
  onEditHousehold,
  onAddFamily,
}: FamilyScenarioProps) {
  const t = copy[language];
  return (
    <section className="family-scenario" aria-labelledby="scenario-heading">
      <div className="scenario-panel">
        <p className="scenario-kicker">{t.familyShift}</p>
        <h2 id="scenario-heading">{t.familyQuestion}</h2>
        <div className="scenario-actions" aria-label={t.householdActions}>
          {actions.map((action) => (
            <button
              className={`scenario-action ${scenarioActions.includes(action.id) ? "selected" : ""}`}
              key={action.id}
              aria-pressed={scenarioActions.includes(action.id)}
              onClick={() => onToggleAction(action.id)}
            >
              <action.icon size={16} aria-hidden="true" />
              {t[action.label]}
            </button>
          ))}
        </div>
        <div className="scenario-metrics">
          <article className="scenario-metric">
            <span>{t.indoorExposure}</span>
            <div className="metric-number">
              {scenarioImpact.exposure}
              <small>
                {scenarioImpact.exposureReduction > 0
                  ? translate(language, "exposureDown", {
                      percent: scenarioImpact.exposureReduction,
                    })
                  : t.startingPoint}
              </small>
            </div>
            <div
              className="exposure-track"
              role="meter"
              aria-label={t.illustrativeExposure}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={scenarioImpact.exposure}
              aria-valuetext={`${scenarioImpact.exposure}, ${scenarioImpact.exposureReduction > 0 ? translate(language, "exposureDown", { percent: scenarioImpact.exposureReduction }) : t.startingPoint}`}
            >
              <span
                style={{
                  width: `${scenarioImpact.exposure}%`,
                  background:
                    scenarioImpact.exposure <= 55
                      ? "var(--aqi-good)"
                      : scenarioImpact.exposure <= 75
                        ? "var(--aqi-moderate)"
                        : "var(--aqi-unhealthy)",
                }}
              />
            </div>
            <small className="metric-disclaimer">
              {t.exposureIllustrative}
            </small>
          </article>
          <article className="scenario-metric">
            <span>{t.co2Avoided}</span>
            <div className="metric-number">
              {scenarioImpact.co2AvoidedG} <small>g</small>
            </div>
            <p>{t.calculationAssumption}</p>
          </article>
        </div>
      </div>
      <div className="family-cards">
        {profile.members.length === 0 ? (
          <article className="family-card family-empty">
            <div>
              <h3>{t.addFamily}</h3>
              <span>{t.familyAdvicePrompt}</span>
            </div>
            <p>{t.chooseHousehold}</p>
            <button className="secondary" onClick={onAddFamily}>
              {t.addMyFamily}
            </button>
          </article>
        ) : (
          profile.members.map((member) => {
            const label = memberLabels[member];
            const verdict = guidance(current.aqi, member, language).message;
            return (
              <article className="family-card" key={member}>
                <span className="family-avatar" aria-hidden="true">
                  {label.initial}
                </span>
                <div>
                  <h3>{t[label.name]}</h3>
                  <span>{t[label.age]}</span>
                </div>
                <p>{verdict}</p>
              </article>
            );
          })
        )}
      </div>
      <button className="secondary" onClick={onEditHousehold}>
        {t.editHousehold}
      </button>
    </section>
  );
}
