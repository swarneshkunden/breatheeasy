"use client";

export function ImpactSection({ cigarettes }: { cigarettes: number }) {
  return (
    <section className="section">
      <div className="section-heading"><div><p className="eyebrow">Impact, made legible</p><h2>{cigarettes} cigarette equivalents</h2></div></div>
      <article className="impact-card">
        <p><strong>A useful comparison, not a medical measure.</strong> Today’s PM2.5 is compared with the widely cited approximation that 22 µg/m³ over 24 hours is roughly equivalent to one cigarette.</p>
        <details className="calculation-drawer"><summary>How we calculated this</summary><p>Visibility is an illustrative estimate derived from PM2.5 concentration and is not measured visibility. Exposure uses the approximate 22 µg/m³ per 24-hour cigarette-equivalent rule. Trip emissions use 170 g CO2/km for a petrol car versus 28 g CO2/km for metro travel. Purifier estimates depend on clean-air delivery rate, room size, and use.</p></details>
      </article>
    </section>
  );
}
