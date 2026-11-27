"use client";

import { useCallback, useState } from "react";
import { HouseholdProfile } from "@/lib/types";
import { whatIfTotals } from "@/lib/presentation";

interface UseScenarioReturn {
  toolkit: string[];
  toggleTool: (title: string) => void;
  scenarioActions: string[];
  toggleScenarioAction: (id: string) => void;
  scenarioImpact: { exposure: number; exposureReduction: number; co2AvoidedG: number };
}

export function useScenario(): UseScenarioReturn {
  const [toolkit, setToolkit] = useState<string[]>([]);
  const [scenarioActions, setScenarioActions] = useState(["metro", "purifier", "induction"]);

  const scenarioImpact = whatIfTotals(scenarioActions);

  const toggleTool = useCallback((title: string) => {
    setToolkit((items) => items.includes(title) ? items.filter((item) => item !== title) : [...items, title]);
  }, []);

  const toggleScenarioAction = useCallback((id: string) => {
    setScenarioActions((selected) => selected.includes(id)
      ? selected.filter((item) => item !== id)
      : [...selected, id]);
  }, []);

  return {
    toolkit,
    toggleTool,
    scenarioActions,
    toggleScenarioAction,
    scenarioImpact,
  };
}
