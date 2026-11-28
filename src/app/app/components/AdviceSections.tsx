"use client";

import { Leaf, Wind, CloudSun } from "lucide-react";
import { copy } from "@/lib/i18n";
import type { AdviceTip, Language } from "@/lib/types";

interface AdviceSectionsProps {
  plan: {
    lowEmission: AdviceTip[];
    indoor: AdviceTip[];
    sustainable: AdviceTip[];
  };
  language: Language;
}

export function AdviceSections({ plan, language }: AdviceSectionsProps) {
  const t = copy[language];
  const sections = [
    { title: t.lowEmissionHeading, icon: Leaf, tips: plan.lowEmission },
    { title: t.indoorAirHeading, icon: Wind, tips: plan.indoor },
    { title: t.gentlerAlternatives, icon: CloudSun, tips: plan.sustainable },
  ];

  return (
    <div className="plan-sections">
      {sections.map(({ title, icon: Icon, tips }) => (
        <section className="advice-section" key={title}>
          <div className="advice-heading">
            <Icon size={18} strokeWidth={1.7} aria-hidden="true" />
            <h3>{title}</h3>
          </div>
          {tips.map((tip) => (
            <article className="advice-card" key={tip.title}>
              <h4>{tip.title}</h4>
              <p>{tip.detail}</p>
              <span className="impact-pill">{tip.impact}</span>
              <details className="tip-calculation">
                <summary>{t.howCalculated}</summary>
                <p>{t.calculationExplanation}</p>
              </details>
            </article>
          ))}
        </section>
      ))}
    </div>
  );
}
