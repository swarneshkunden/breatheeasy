"use client";

import { Leaf, Wind, CloudSun } from "lucide-react";
import type { AdviceTip } from "@/lib/types";

interface AdviceSectionsProps {
  plan: { lowEmission: AdviceTip[]; indoor: AdviceTip[]; sustainable: AdviceTip[] };
}

export function AdviceSections({ plan }: AdviceSectionsProps) {
  const sections = [
    { title: "Low-emission routines", icon: Leaf, tips: plan.lowEmission },
    { title: "Indoor air, made calmer", icon: Wind, tips: plan.indoor },
    { title: "Gentler alternatives", icon: CloudSun, tips: plan.sustainable },
  ];

  return (
    <div className="plan-sections">
      {sections.map(({ title, icon: Icon, tips }) => (
        <section className="advice-section" key={title}>
          <div className="advice-heading"><Icon size={18} strokeWidth={1.7} aria-hidden="true" /><h3>{title}</h3></div>
          {tips.map((tip) => (
            <article className="advice-card" key={tip.title}>
              <h4>{tip.title}</h4>
              <p>{tip.detail}</p>
              <span className="impact-pill">{tip.impact}</span>
              <details className="tip-calculation">
                <summary>How we calculated this</summary>
                <p>Planning estimate using the centralized emission factors and purifier assumptions. It is not a clinical or lifecycle measurement.</p>
              </details>
            </article>
          ))}
        </section>
      ))}
    </div>
  );
}
