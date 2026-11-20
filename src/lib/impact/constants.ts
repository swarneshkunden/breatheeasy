// Source: IPCC AR6; these are conservative planning estimates, not lifecycle assessments.
export const EMISSION_CONSTANTS = {
  petrolCarGCo2PerKm: 170,
  busGCo2PerKm: 68,
  metroGCo2PerKm: 28,
  petrolCarGNoXPerKm: 0.55,
  metroGNoXPerKm: 0.04,
  purifierReductionPercent: 45,
  cigaretteEquivalentPm25Per24h: 22,
} as const;
