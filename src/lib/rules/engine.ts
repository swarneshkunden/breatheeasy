import { AdvicePlan, AirSnapshot, HouseholdProfile, AdviceTip } from "../types";
import {
  exposureCigarettes,
  purifierImpact,
  tripImpact,
} from "../impact/calculator";
import { AQI_THRESHOLDS, ADVICE_SCORES } from "../constants";
import { guidance, ventilationAdvice } from "./safety";
import { copy, translate } from "../i18n";
import type { Language } from "../types";

export function categorizeAqi(aqi: number | null) {
  if (aqi === null)
    return {
      label: "Air data unavailable",
      tone: "unavailable",
      color: "#66705f",
    };
  if (aqi <= AQI_THRESHOLDS.GOOD)
    return { label: "Good", tone: "good", color: "#6F8F72" };
  if (aqi <= AQI_THRESHOLDS.MODERATE)
    return { label: "Moderate", tone: "moderate", color: "#C2A25A" };
  if (aqi <= AQI_THRESHOLDS.SENSITIVE)
    return {
      label: "Unhealthy for sensitive groups",
      tone: "sensitive",
      color: "#C98A4B",
    };
  if (aqi <= AQI_THRESHOLDS.UNHEALTHY)
    return { label: "Unhealthy", tone: "unhealthy", color: "#B5654A" };
  if (aqi <= AQI_THRESHOLDS.VERY_UNHEALTHY)
    return {
      label: "Very unhealthy",
      tone: "very-unhealthy",
      color: "#8A4B5C",
    };
  return { label: "Hazardous", tone: "hazardous", color: "#5A3E3A" };
}

export function createRulePlan(
  air: AirSnapshot,
  profile: HouseholdProfile,
  question?: string,
  language: Language = "en",
): AdvicePlan {
  const t = copy[language];
  const vulnerable = profile.members.some((member) =>
    ["kids", "elderly", "pregnant", "respiratory"].includes(member),
  );
  const trip = tripImpact(
    profile.commute === "car" || profile.commute === "two-wheeler" ? 5 : 3,
  );
  const purifier = purifierImpact(
    profile.homeType === "apartment" ? 18 : 28,
    profile.hasPurifier ? 240 : 120,
  );
  const cigarettes = exposureCigarettes(air.pm25);
  const airGuidance = guidance(
    air.aqi,
    profile.members[0] ?? "general",
    language,
  );
  const ventilation = ventilationAdvice(
    air.hourly,
    new Date(),
    air.aqi,
    air.utcOffsetSeconds,
    language,
  );

  const lowEmission: AdviceTip[] = [
    {
      title: profile.commute === "metro" ? t.planMetroTitle : t.planTripTitle,
      detail:
        profile.commute === "car" || profile.commute === "two-wheeler"
          ? t.planTripCarDetail
          : t.planTripOtherDetail,
      impact: translate(language, "planTripAvoided", {
        co2: trip.co2AvoidedG,
        nox: trip.noxAvoidedG,
      }),
      score: ADVICE_SCORES.KEEP_USING_METRO,
    },
    {
      title:
        air.aqi !== null && air.aqi > AQI_THRESHOLDS.SENSITIVE
          ? t.planSchoolTitle
          : t.planExerciseTitle,
      detail: vulnerable ? t.planSensitiveDetail : t.planCleanerDetail,
      impact: t.planExposureImpact,
      score: ADVICE_SCORES.EXERCISE_CLEANER_WINDOW,
    },
  ];

  const indoor: AdviceTip[] = [
    {
      title: t.planSafetyTitle,
      detail: airGuidance.message,
      impact: airGuidance.available
        ? t.planCurrentSafetyImpact
        : t.noLiveReading,
      score: 100,
    },
    {
      title: t.purifierTitle,
      detail: profile.hasPurifier ? t.purifierOwnedDetail : t.purifierDiyDetail,
      impact: translate(language, "purifierImpact", { percent: purifier }),
      score: ADVICE_SCORES.PURIFIER_BEDROOM,
    },
    {
      title: t.ventilateCleanerTitle,
      detail: t.ventilateAdvice,
      impact:
        cigarettes === null
          ? t.pm25Unavailable
          : translate(language, "pm25CigaretteImpact", { count: cigarettes }),
      score: ADVICE_SCORES.VENTILATE_CLEANER_HOUR,
    },
    {
      title: t.ventilationTitle,
      detail: ventilation.message,
      impact: translate(language, "ventilationImpact", {
        limit: AQI_THRESHOLDS.MODERATE,
      }),
      score: ADVICE_SCORES.VENTILATE_CLEANER_HOUR,
    },
  ];

  const sustainable: AdviceTip[] = [
    {
      title:
        profile.cooking === "wood"
          ? t.shiftCleanerFuelTitle
          : t.inductionEfficientTitle,
      detail:
        profile.cooking === "wood" ? t.cleanerFuelDetail : t.inductionDetail,
      impact: t.householdEmissionsImpact,
      score: ADVICE_SCORES.USE_INDUCTION,
    },
  ];

  return {
    lowEmission,
    indoor,
    sustainable,
    answer: answerRuleQuestion(question ?? t.plan, air, profile, language),
    tips: [t.tipPurifier, t.tipVentilation, t.tipMask],
    followUps: [t.followUpIndoor, t.followUpOutside],
    smartMode: "offline",
  };
}

export function answerRuleQuestion(
  question: string,
  air: AirSnapshot,
  profile: HouseholdProfile,
  language: Language = "en",
): string {
  const t = copy[language];
  const text = question.toLowerCase();
  if (/purifier|diy|fan.?filter|corsi|प्यूरीफायर|फ़िल्टर|फिल्टर/.test(text)) {
    return profile.hasPurifier
      ? translate(language, "purifierOwnedAnswer", {
          limit: AQI_THRESHOLDS.MODERATE,
        })
      : t.purifierDiyAnswer;
  }
  if (/ventilat|window|air out|खिड़की|हवा आने|हवा जाने/.test(text)) {
    return ventilationAdvice(
      air.hourly,
      new Date(),
      air.aqi,
      air.utcOffsetSeconds,
      language,
    ).message;
  }
  if (/mask|respirator|n95|ffp2|मास्क|श्वासयंत्र/.test(text)) {
    return (
      guidance(air.aqi, profile.members[0] ?? "general", language).message +
      t.maskAdditionalAdvice
    );
  }
  if (
    /commut|travel|metro|bus|car|bike|walk|यात्रा|मेट्रो|बस|कार|साइकिल/.test(
      text,
    )
  ) {
    return profile.commute === "metro" || profile.commute === "bus"
      ? t.commutePublicAnswer
      : t.commuteOtherAnswer;
  }
  return guidance(air.aqi, profile.members[0] ?? "general", language).message;
}
