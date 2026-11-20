import { LivingSkyline } from "@/components/LivingSkyline";

export const metadata = {
  title: "BreatheEasy — Urban Air Quality Assistant",
  description: "Smog-smart routines, indoor air hacks, and community action for cleaner family days.",
};

export default function LandingPage() {
  return (
    <div className="landing-shell">
      <header className="landing-header">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">*</span>
          <span>BreatheEasy</span>
        </div>
        <a href="/app" className="button button-primary">
          Check my air
        </a>
      </header>

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

      <section className="how-it-works" aria-labelledby="how-heading">
        <h2 id="how-heading" className="section-title">How it works</h2>
        <p className="section-intro">Three steps to a safer, lower-emission day.</p>
        <ol className="steps">
          <li>
            <span className="step-number">1</span>
            <div>
              <h3>Tell us about your home</h3>
              <p>Household members, home type, commute, and cooking fuel — stored only on your device.</p>
            </div>
          </li>
          <li>
            <span className="step-number">2</span>
            <div>
              <h3>See your air</h3>
              <p>Live AQI, pollutant readings, and a 24-hour forecast in your location&apos;s local time.</p>
            </div>
          </li>
          <li>
            <span className="step-number">3</span>
            <div>
              <h3>Get a plan with real numbers</h3>
              <p>Low-emission routines, indoor air hacks, and sustainable alternatives, each with a direct impact estimate.</p>
            </div>
          </li>
        </ol>
      </section>

      <section className="what-you-get" aria-labelledby="what-heading">
        <h2 id="what-heading" className="section-title">What you get</h2>
        <div className="cards">
          <article className="card">
            <h3>Low-emission routines</h3>
            <p>Swap one car trip for metro or bus and see the CO₂ and NOx avoided, per trip.</p>
          </article>
          <article className="card">
            <h3>Indoor air hacks</h3>
            <p>Purifier placement, ventilation timing, and low-cost filtration you can run at home.</p>
          </article>
          <article className="card">
            <h3>Sustainable alternatives</h3>
            <p>Cleaner cooking and school-run choices that cut household combustion emissions.</p>
          </article>
          <article className="card">
            <h3>Impact, explained in numbers</h3>
            <p>Every tip shows a direct impact figure, with a &quot;How we calculated this&quot; breakdown.</p>
          </article>
        </div>
      </section>

      <div className="privacy-strip" role="contentinfo">
        <p>
          <strong>Privacy.</strong> Location is rounded to two decimals before any server use, and your household profile
          lives only in this browser. No trackers. General guidance only — not medical advice.
        </p>
      </div>

      <footer className="landing-footer">
        <p>BreatheEasy • Urban Air Quality Assistant</p>
        <p className="foot-note">General guidance only. This is not medical advice. If symptoms are severe or worsen, seek qualified medical care.</p>
      </footer>
    </div>
  );
}
