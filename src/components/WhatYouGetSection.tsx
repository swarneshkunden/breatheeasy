export function WhatYouGetSection() {
  return (
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
  );
}