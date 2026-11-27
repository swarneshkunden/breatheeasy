"use client";

import { TrainFront, AirVent, Zap } from "lucide-react";
import type { HouseholdProfile } from "@/lib/types";

interface FamilyScenarioProps {
  scenarioActions: string[];
  scenarioImpact: { exposure: number; exposureReduction: number; co2AvoidedG: number };
  current: { aqi: number };
  profile: HouseholdProfile;
  onToggleAction: (id: string) => void;
  onEditHousehold: () => void;
  onAddFamily: () => void;
}

const memberLabels: Record<HouseholdProfile["members"][number], { name: string; age: string; initial: string }> = {
  kids: { name: "Child", age: "School-age", initial: "C" },
  elderly: { name: "Older adult", age: "Extra care", initial: "E" },
  pregnant: { name: "Pregnant member", age: "Extra care", initial: "P" },
  respiratory: { name: "Asthma / respiratory", age: "Sensitive", initial: "R" },
  adults: { name: "Healthy adult", age: "Everyday habits", initial: "A" },
};

const actions = [
  { id: "metro", icon: TrainFront, label: "Metro, not car" },
  { id: "purifier", icon: AirVent, label: "Purifier in bedroom" },
  { id: "induction", icon: Zap, label: "Induction cooking" },
];

function getVerdict(member: HouseholdProfile["members"][number], aqi: number): string {
  if (member === "kids" || member === "respiratory" || member === "pregnant") {
    return aqi > 150
      ? "Stay indoors, play in a filtered room, and avoid the school ground."
      : "Choose the cleaner forecast window for gentle outdoor time.";
  }
  if (member === "elderly") {
    return aqi > 150
      ? "Keep walks short and indoors at peak pollution. Use a fitted mask if going out."
      : "A short walk during the cleaner hour is the gentler choice.";
  }
  return aqi > 150
    ? "Take the metro and avoid evening exercise outdoors."
    : "Keep the lower-emission commute and ventilate only in cleaner hours.";
}

export function FamilyScenario({
  scenarioActions,
  scenarioImpact,
  current,
  profile,
  onToggleAction,
  onEditHousehold,
  onAddFamily,
}: FamilyScenarioProps) {
  return (
    <section className="Section family-scenario" aria-labelledby="scenario-heading">
      <div className="scenario-panel">
        <p className="scenario-kicker">A small shift, felt at home</p>
        <h2 id="scenario-heading">What if your family did this today?</h2>
        <div className="scenario-actions" aria-label="Choose household actions">
          {actions.map((action) => (
            <button
              className={`scenario-action ${scenarioActions.includes(action.id) ? "selected" : ""}`}
              key={action.id}
              aria-pressed={scenarioActions.includes(action.id)}
              onClick={() => onToggleAction(action.id)}
            >
              <action.icon size={16} aria-hidden="true" />{action.label}
            </button>
          ))}
        </div>
        <div className="scenario-metrics">
          <article className="scenario-metric">
            <span>Family indoor exposure</span>
            <div className="metric-number">{scenarioImpact.exposure}<small>{scenarioImpact.exposureReduction > 0 ? `down ${scenarioImpact.exposureReduction}%` : "starting point"}</small></div>
            <div
              className="exposure-track"
              role="meter"
              aria-label="Illustrative relative family indoor exposure"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={scenarioImpact.exposure}
              aria-valuetext={`${scenarioImpact.exposure}, ${scenarioImpact.exposureReduction > 0 ? `down ${scenarioImpact.exposureReduction} percent` : "starting point"}`}
            >
              <span style={{ width: `${scenarioImpact.exposure}%`, background: scenarioImpact.exposure <= 55 ? "var(--aqi-good)" : scenarioImpact.exposure <= 75 ? "var(--aqi-moderate)" : "var(--aqi-unhealthy)" }} />
            </div>
            <small className="metric-disclaimer">Illustrative relative estimate, not a sensor reading</small>
          </article>
          <article className="scenario-metric">
            <span>CO₂ avoided today</span>
            <div className="metric-number">{scenarioImpact.co2AvoidedG} <small>g</small></div>
            <p>Approximate 5 km petrol-car-to-metro trip. Assumptions in “How we calculated this”.</p>
          </article>
        </div>
      </div>
      <div className="family-cards">
        {profile.members.length === 0 ? (
          <article className="family-card family-empty">
            <div><h3>Add family members</h3><span>Personal advice appears here</span></div>
            <p>Choose who is at home so BreatheEasy can tailor the plan.</p>
            <button className="secondary" onClick={onAddFamily}>Add family</button>
          </article>
        ) : profile.members.map((member) => {
          const label = memberLabels[member];
          const verdict = getVerdict(member, current.aqi);
          return (
            <article className="family-card" key={member}>
              <span className="family-avatar" aria-hidden="true">{label.initial}</span>
              <div><h3>{label.name}</h3><span>{label.age}</span></div>
              <p>{verdict}</p>
            </article>
          );
        })}
      </div>
      <button className="secondary" onClick={onEditHousehold}>Edit household</button>
    </section>
  );
}
