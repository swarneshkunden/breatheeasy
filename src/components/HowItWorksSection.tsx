export function HowItWorksSection() {
  return (
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
  );
}