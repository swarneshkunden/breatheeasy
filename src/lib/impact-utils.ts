import { EMISSION_CONSTANTS } from "./impact/constants";
import { tripImpact } from "./impact/calculator";

export function whatIfTotals(selected: readonly string[]) {
  const purifier = selected.includes("purifier");
  const metro = selected.includes("metro");
  const exposure = purifier ? 100 - EMISSION_CONSTANTS.purifierReductionPercent : 100;
  return {
    exposure,
    exposureReduction: purifier ? EMISSION_CONSTANTS.purifierReductionPercent : 0,
    co2AvoidedG: metro ? tripImpact(5).co2AvoidedG : 0,
  };
}
