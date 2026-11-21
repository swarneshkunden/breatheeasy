import { LivingSkyline } from "@/components/LivingSkyline";

export function HeroSection() {
  return (
    <section className="hero" aria-labelledby="hero-heading">
      <div className="hero-grid">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="demo-dot" aria-hidden="true"></span>
            Demo data • Delhi-style severe smog (AQI 380)
          </div>
          <h1 id="hero-heading" className="hero-title">Breathe easier, one family at a time</h1>
          <p className="hero-description">
            Location-aware air readings, low-emission routines, indoor air hacks, and a daily plan backed by real numbers.
          </p>
          <div className="hero-actions">
            <a href="/app" className="button button-primary">Check my air</a>
            <a href="/app" className="button button-outline">See the demo</a>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-aqi">
            <span className="aqi-value">380</span>
            <span className="aqi-label">Hazardous • demo</span>
          </div>
          <LivingSkyline aqi={380} city="New Delhi" />
        </div>
      </div>
    </section>
  );
}