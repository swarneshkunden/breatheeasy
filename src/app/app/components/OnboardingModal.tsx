"use client";

import type { HouseholdProfile } from "@/lib/types";

interface OnboardingModalProps {
  onboarding: boolean;
  step: number;
  profile: HouseholdProfile;
  onClose: () => void;
  onBack: () => void;
  onNext: () => void;
  onSave: () => void;
  onMemberToggle: (member: HouseholdProfile["members"][number]) => void;
  onHomeTypeChange: (homeType: HouseholdProfile["homeType"]) => void;
  onPurifierToggle: (checked: boolean) => void;
  onCommuteChange: (commute: HouseholdProfile["commute"]) => void;
  onCookingChange: (cooking: HouseholdProfile["cooking"]) => void;
  onBudgetChange: (budget: HouseholdProfile["budget"]) => void;
}

const MEMBER_TYPES: HouseholdProfile["members"][number][] = ["kids", "elderly", "pregnant", "respiratory", "adults"];
const COMMUTE_MODES: HouseholdProfile["commute"][] = ["walk", "bike", "two-wheeler", "car", "bus", "metro"];
const COOKING_FUELS: HouseholdProfile["cooking"][] = ["lpg", "induction", "wood"];
const BUDGETS: HouseholdProfile["budget"][] = ["low", "medium", "high"];

export function OnboardingModal({
  onboarding,
  step,
  profile,
  onClose,
  onBack,
  onNext,
  onSave,
  onMemberToggle,
  onHomeTypeChange,
  onPurifierToggle,
  onCommuteChange,
  onCookingChange,
  onBudgetChange,
}: OnboardingModalProps) {
  if (!onboarding) return null;

  const isMemberActive = (member: HouseholdProfile["members"][number]) => profile.members.includes(member);

  return (
    <div className="modal-backdrop" role="presentation">
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="profile-title">
        <div className="modal-head">
          <div>
            <p className="eyebrow">Household profile</p>
            <h2 id="profile-title">Step {step + 1} of 4</h2>
          </div>
          <button aria-label="Close" onClick={onClose}>×</button>
        </div>
        {step === 0 && (
          <fieldset>
            <legend>Who lives here?</legend>
            {MEMBER_TYPES.map((member) => (
              <button
                className={`choice ${isMemberActive(member) ? "active" : ""}`}
                key={member}
                onClick={() => onMemberToggle(member)}
              >
                {member}
              </button>
            ))}
          </fieldset>
        )}
        {step === 1 && (
          <fieldset>
            <legend>Home setup</legend>
            <button className="choice" onClick={() => onHomeTypeChange("apartment")}>Apartment</button>
            <button className="choice" onClick={() => onHomeTypeChange("house")}>House</button>
            <label>
              <input type="checkbox" checked={profile.hasPurifier} onChange={(event) => onPurifierToggle(event.target.checked)} />
              Air purifier
            </label>
          </fieldset>
        )}
        {step === 2 && (
          <fieldset>
            <legend>Commute</legend>
            {COMMUTE_MODES.map((mode) => (
              <button
                className={`choice ${profile.commute === mode ? "active" : ""}`}
                key={mode}
                onClick={() => onCommuteChange(mode)}
              >
                {mode}
              </button>
            ))}
          </fieldset>
        )}
        {step === 3 && (
          <fieldset>
            <legend>Cooking and budget</legend>
            {COOKING_FUELS.map((fuel) => (
              <button
                className={`choice ${profile.cooking === fuel ? "active" : ""}`}
                key={fuel}
                onClick={() => onCookingChange(fuel)}
              >
                {fuel}
              </button>
            ))}
            <div className="budget-row">
              {BUDGETS.map((budget) => (
                <button
                  className={`choice ${profile.budget === budget ? "active" : ""}`}
                  key={budget}
                  onClick={() => onBudgetChange(budget)}
                >
                  {budget}
                </button>
              ))}
            </div>
          </fieldset>
        )}
        <div className="modal-actions">
          <button className="secondary" disabled={step === 0} onClick={onBack}>Back</button>
          {step < 3 ? (
            <button className="primary" onClick={onNext}>Next</button>
          ) : (
            <button className="primary" onClick={onSave}>Save profile</button>
          )}
        </div>
      </div>
    </div>
  );
}
