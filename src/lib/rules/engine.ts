import { AdvicePlan, AirSnapshot, HouseholdProfile, AdviceTip } from "../types";
import { exposureCigarettes, purifierImpact, tripImpact } from "../impact/calculator";

export function categorizeAqi(aqi: number) {
  if (aqi <= 50) return { label: "Good", tone: "good", color: "#20c997" };
  if (aqi <= 100) return { label: "Moderate", tone: "moderate", color: "#f6c85f" };
  if (aqi <= 150) return { label: "Unhealthy for sensitive groups", tone: "sensitive", color: "#ff9f43" };
  if (aqi <= 200) return { label: "Unhealthy", tone: "unhealthy", color: "#ff6b6b" };
  if (aqi <= 300) return { label: "Very unhealthy", tone: "very-unhealthy", color: "#a855f7" };
  return { label: "Hazardous", tone: "hazardous", color: "#8f1d1d" };
}

export function createRulePlan(air: AirSnapshot, profile: HouseholdProfile): AdvicePlan {
  const vulnerable = profile.members.some((member) => ["kids", "elderly", "pregnant", "respiratory"].includes(member));
  const trip = tripImpact(profile.commute === "car" || profile.commute === "two-wheeler" ? 5 : 3);
  const purifier = purifierImpact(profile.homeType === "apartment" ? 18 : 28, profile.hasPurifier ? 240 : 120);
  const cigarettes = exposureCigarettes(air.pm25);

  const lowEmission: AdviceTip[] = [
    {
      title: profile.commute === "metro" ? "Keep using the metro" : "Replace one short trip",
      detail: profile.commute === "car" || profile.commute === "two-wheeler"
        ? "Take metro or a shared bus for the 5 km work or school trip."
        : "Group errands and walk or cycle short distances at the cleanest hour.",
      impact: `Avoids about ${trip.co2AvoidedG} g CO2 and ${trip.noxAvoidedG} g NOx per trip.`,
      score: 95,
    },
    {
      title: air.aqi > 150 ? "Move school drop-off earlier" : "Exercise in the cleaner window",
      detail: vulnerable
        ? "Keep vulnerable family members indoors during the worst hour and shorten unavoidable outdoor exposure."
        : "Choose the lowest-AQI hour shown in the forecast.",
      impact: "Reduces avoidable peak exposure while preserving daily routine.",
      score: 90,
    },
  ];

  const indoor: AdviceTip[] = [
    {
      title: "Purifier or DIY filtration",
      detail: profile.hasPurifier
        ? "Run the purifier in the bedroom 30 minutes before sleep."
        : "Use a sealed-window room and consider a DIY Corsi-Rosenthal fan-filter for low-cost filtration.",
      impact: `Estimated indoor PM2.5 reduction: about ${purifier}%, subject to room size and CADR.`,
      score: 92,
    },
    {
      title: "Ventilate only at the cleaner hour",
      detail: "Open windows briefly when the forecasted AQI reaches its lowest point; use a wet mop rather than dry sweeping.",
      impact: `Today's PM2.5 is roughly equivalent to ${cigarettes} cigarettes over 24 hours as an approximation.`,
      score: 82,
    },
  ];

  const sustainable: AdviceTip[] = [
    {
      title: profile.cooking === "wood" ? "Shift a meal to cleaner fuel" : "Use induction efficiently",
      detail: profile.cooking === "wood"
        ? "Where practical, use LPG or induction and ventilate cooking smoke outdoors."
        : "Cover pans, cook at a suitable heat, and use the exhaust fan.",
      impact: "Cuts household combustion emissions and reduces indoor PM exposure.",
      score: 88,
    },
  ];

  return { lowEmission, indoor, sustainable, smartMode: "offline" };
}
