import { LivingSkyline } from "@/components/LivingSkyline";

export function HeroSection({ t }: { t: Record<string, string> }) {
  return (
    <section className="landing-hero" aria-labelledby="hero-heading">
      <div className="landing-hero-grid">
        <div className="landing-hero-content">
          <div className="landing-hero-badge">
            <span className="landing-demo-dot" aria-hidden="true"></span>
            {t.landingBadge}
          </div>
          <h1 id="hero-heading" className="landing-hero-title">
            {t.landingTitle}
          </h1>
          <p className="landing-hero-description">{t.landingDescription}</p>
          <div className="landing-hero-actions">
            <a href="/app" className="landing-button landing-button-primary">
              {t.checkMyAir}
            </a>
            <a href="/app" className="landing-button landing-button-outline">
              {t.seeDemo}
            </a>
          </div>
        </div>
        <div className="landing-hero-visual">
          <div className="landing-hero-aqi">
            <span className="landing-aqi-value">380</span>
            <span className="landing-aqi-label">{t.hazardousDemo}</span>
          </div>
          <LivingSkyline aqi={380} city="New Delhi" />
        </div>
      </div>
    </section>
  );
}
