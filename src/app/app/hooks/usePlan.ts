"use client";

import { useCallback, useEffect, useState } from "react";
import { demoAir } from "@/lib/air/demo";
import { categorizeAqi, createRulePlan } from "@/lib/rules/engine";
import {
  AirSnapshot,
  AdvicePlan,
  HouseholdProfile,
  Language,
} from "@/lib/types";
import { bestWindow, whatIfTotals } from "@/lib/presentation";

interface UsePlanInput {
  language: Language;
  demo: boolean;
  air: AirSnapshot;
  profile: HouseholdProfile;
}

interface UsePlanReturn {
  plan: AdvicePlan;
  setPlan: (plan: AdvicePlan) => void;
  previewAqi: number | null;
  previewCategory: ReturnType<typeof categorizeAqi>;
  scenarioImpact: {
    exposure: number;
    exposureReduction: number;
    co2AvoidedG: number;
  };
  cleanestWindow: { hour: { time: string; aqi: number | null } } | null;
  cleanestTime: string;
  toggleScenarioAction: (id: string) => void;
  scenarioActions: string[];
}

export function usePlan({
  language,
  demo,
  air,
  profile,
}: UsePlanInput): UsePlanReturn {
  const [plan, setPlanState] = useState<AdvicePlan>(() =>
    createRulePlan(demo ? demoAir : air, profile, undefined, language),
  );
  const [scenarioActions, setScenarioActions] = useState([
    "metro",
    "purifier",
    "induction",
  ]);

  useEffect(() => {
    setPlanState(
      createRulePlan(demo ? demoAir : air, profile, undefined, language),
    );
  }, [demo, air, profile, language]);

  const current = demo ? demoAir : air;
  const previewAqi = demo ? demoAir.aqi : air.aqi;
  const previewCategory = categorizeAqi(previewAqi);
  const scenarioImpact = whatIfTotals(scenarioActions);
  const cleanestWindow = bestWindow(current.hourly);
  const cleanestHour = cleanestWindow?.hour.time ?? "—";
  const cleanestTime = cleanestHour.includes("T")
    ? cleanestHour.slice(11, 16)
    : cleanestHour.slice(0, 5);

  const toggleScenarioAction = useCallback((id: string) => {
    setScenarioActions((selected) =>
      selected.includes(id)
        ? selected.filter((item) => item !== id)
        : [...selected, id],
    );
  }, []);

  return {
    plan,
    setPlan: setPlanState,
    previewAqi,
    previewCategory,
    scenarioImpact,
    cleanestWindow,
    cleanestTime,
    toggleScenarioAction,
    scenarioActions,
  };
}
