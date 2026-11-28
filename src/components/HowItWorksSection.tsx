export function HowItWorksSection({ t }: { t: Record<string, string> }) {
  return (
    <section className="landing-how-it-works" aria-labelledby="how-heading">
      <h2 id="how-heading" className="landing-section-title">
        {t.howItWorks}
      </h2>
      <p className="landing-section-intro">{t.threeSteps}</p>
      <ol className="landing-steps">
        <li>
          <span className="landing-step-number">1</span>
          <div>
            <h3>{t.tellUsHome}</h3>
            <p>{t.homeProfileDescription}</p>
          </div>
        </li>
        <li>
          <span className="landing-step-number">2</span>
          <div>
            <h3>{t.seeYourAir}</h3>
            <p>{t.liveForecastDescription}</p>
          </div>
        </li>
        <li>
          <span className="landing-step-number">3</span>
          <div>
            <h3>{t.getPlanNumbers}</h3>
            <p>{t.planNumbersDescription}</p>
          </div>
        </li>
      </ol>
    </section>
  );
}
