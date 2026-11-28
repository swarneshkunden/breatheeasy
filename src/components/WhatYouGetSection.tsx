export function WhatYouGetSection({ t }: { t: Record<string, string> }) {
  return (
    <section className="landing-what-you-get" aria-labelledby="what-heading">
      <h2 id="what-heading" className="landing-section-title">
        {t.whatYouGet}
      </h2>
      <div className="landing-cards">
        <article className="landing-card">
          <h3>{t.lowEmissionRoutines}</h3>
          <p>{t.routinesDescription}</p>
        </article>
        <article className="landing-card">
          <h3>{t.indoorAirHacks}</h3>
          <p>{t.indoorHacksDescription}</p>
        </article>
        <article className="landing-card">
          <h3>{t.sustainableAlternatives}</h3>
          <p>{t.alternativesDescription}</p>
        </article>
        <article className="landing-card">
          <h3>{t.impactInNumbers}</h3>
          <p>{t.impactDescription}</p>
        </article>
      </div>
    </section>
  );
}
