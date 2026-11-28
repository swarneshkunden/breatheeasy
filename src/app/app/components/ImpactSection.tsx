"use client";

import { copy, translate } from "@/lib/i18n";
import type { Language } from "@/lib/types";

export function ImpactSection({
  cigarettes,
  language,
}: {
  cigarettes: number | null;
  language: Language;
}) {
  const t = copy[language];
  return (
    <section className="section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">{t.impactMadeLegible}</p>
          <h2>
            {cigarettes === null
              ? t.airUnavailable
              : translate(language, "cigaretteEquivalents", {
                  count: cigarettes,
                })}
          </h2>
        </div>
      </div>
      <article className="impact-card">
        <p>
          <strong>{t.comparisonNotMedical}</strong> {t.cigaretteComparison}
        </p>
        <details className="calculation-drawer">
          <summary>{t.howCalculated}</summary>
          <p>{t.impactCalculation}</p>
        </details>
      </article>
    </section>
  );
}
