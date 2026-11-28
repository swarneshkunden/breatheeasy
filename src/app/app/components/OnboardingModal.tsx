"use client";

import type { HouseholdProfile } from "@/lib/types";
import type { RefObject, KeyboardEvent } from "react";

interface OnboardingModalProps {
  onboarding: boolean;
  modalRef: RefObject<HTMLDialogElement | null>;
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

const MEMBER_TYPES: HouseholdProfile["members"][number][] = [
  "kids",
  "elderly",
  "pregnant",
  "respiratory",
  "adults",
];
const COMMUTE_MODES: HouseholdProfile["commute"][] = [
  "walk",
  "bike",
  "two-wheeler",
  "car",
  "bus",
  "metro",
];
const COOKING_FUELS: HouseholdProfile["cooking"][] = [
  "lpg",
  "induction",
  "wood",
];
const BUDGETS: HouseholdProfile["budget"][] = ["low", "medium", "high"];

export function OnboardingModal({
  onboarding,
  modalRef,
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

  const isMemberActive = (member: HouseholdProfile["members"][number]) =>
    profile.members.includes(member);
  const handleKeyDown = (event: KeyboardEvent<HTMLDialogElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== "Tab" || !modalRef.current) return;
    const focusable = modalRef.current.querySelectorAll<HTMLElement>(
      'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
    );
    const first = focusable.item(0);
    const last = focusable.item(focusable.length - 1);
    if (!first || !last) return;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <div className="modal-backdrop" role="presentation">
      <dialog
        open
        ref={modalRef}
        className="modal"
        aria-modal="true"
        aria-labelledby="profile-title"
        onKeyDown={handleKeyDown}
      >
        <div className="modal-head">
          <div>
            <p className="eyebrow">Household profile</p>
            <h2 id="profile-title">Step {step + 1} of 4</h2>
          </div>
          <button aria-label="Close" onClick={onClose}>
            ×
          </button>
        </div>
        {step === 0 && (
          <fieldset>
            <legend>Who lives here?</legend>
            {MEMBER_TYPES.map((member) => (
              <button
                type="button"
                className={`choice ${isMemberActive(member) ? "active" : ""}`}
                key={member}
                aria-pressed={isMemberActive(member)}
                onClick={() => onMemberToggle(member)}
              >
                {
                  {
                    kids: "Children",
                    elderly: "Older adults",
                    pregnant: "Pregnant",
                    respiratory: "Respiratory conditions",
                    adults: "Adults",
                  }[member]
                }
              </button>
            ))}
          </fieldset>
        )}
        {step === 1 && (
          <fieldset>
            <legend>Home setup</legend>
            <button
              type="button"
              className={`choice ${profile.homeType === "apartment" ? "active" : ""}`}
              aria-pressed={profile.homeType === "apartment"}
              onClick={() => onHomeTypeChange("apartment")}
            >
              Apartment
            </button>
            <button
              type="button"
              className={`choice ${profile.homeType === "house" ? "active" : ""}`}
              aria-pressed={profile.homeType === "house"}
              onClick={() => onHomeTypeChange("house")}
            >
              House
            </button>
            <label>
              <input
                type="checkbox"
                checked={profile.hasPurifier}
                onChange={(event) => onPurifierToggle(event.target.checked)}
              />
              Air purifier
            </label>
          </fieldset>
        )}
        {step === 2 && (
          <fieldset>
            <legend>Commute</legend>
            {COMMUTE_MODES.map((mode) => (
              <button
                type="button"
                className={`choice ${profile.commute === mode ? "active" : ""}`}
                key={mode}
                aria-pressed={profile.commute === mode}
                onClick={() => onCommuteChange(mode)}
              >
                {
                  {
                    walk: "Walk",
                    bike: "Bicycle",
                    "two-wheeler": "Two-wheeler",
                    car: "Car",
                    bus: "Bus",
                    metro: "Metro",
                  }[mode]
                }
              </button>
            ))}
          </fieldset>
        )}
        {step === 3 && (
          <fieldset>
            <legend>Cooking and budget</legend>
            {COOKING_FUELS.map((fuel) => (
              <button
                type="button"
                className={`choice ${profile.cooking === fuel ? "active" : ""}`}
                key={fuel}
                aria-pressed={profile.cooking === fuel}
                onClick={() => onCookingChange(fuel)}
              >
                {
                  { lpg: "LPG", induction: "Induction", wood: "Wood burning" }[
                    fuel
                  ]
                }
              </button>
            ))}
            <div className="budget-row">
              {BUDGETS.map((budget) => (
                <button
                  type="button"
                  className={`choice ${profile.budget === budget ? "active" : ""}`}
                  key={budget}
                  aria-pressed={profile.budget === budget}
                  onClick={() => onBudgetChange(budget)}
                >
                  {{ low: "Low", medium: "Medium", high: "High" }[budget]}
                </button>
              ))}
            </div>
          </fieldset>
        )}
        <div className="modal-actions">
          <button className="secondary" disabled={step === 0} onClick={onBack}>
            Back
          </button>
          {step < 3 ? (
            <button className="primary" onClick={onNext}>
              Next
            </button>
          ) : (
            <button className="primary" onClick={onSave}>
              Save profile
            </button>
          )}
        </div>
      </dialog>
    </div>
  );
}
