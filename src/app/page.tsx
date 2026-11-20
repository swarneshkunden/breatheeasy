"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Cloud,
  CloudFog,
  CloudSun,
  Leaf,
  AirVent,
  ShieldAlert,
  Sun,
  TrainFront,
  Wind,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { demoAir } from "@/lib/air/demo";
import { categorizeAqi, createRulePlan } from "@/lib/rules/engine";
import { copy } from "@/lib/i18n";
import { AirSnapshot, AdvicePlan, HouseholdProfile, Language } from "@/lib/types";
import { exposureCigarettes, tripImpact } from "@/lib/impact/calculator";
import { LivingSkyline } from "@/components/LivingSkyline";

const defaultProfile: HouseholdProfile = {
  members: ["kids", "adults"],
  homeType: "apartment",
  hasAc: true,
  hasPurifier: false,
  windows: "sealed",
  commute: "metro",
  cooking: "lpg",
  budget: "medium",
};

const aqiIcons: Record<string, LucideIcon> = {
  good: Sun,
  moderate: CloudSun,
  sensitive: Cloud,
  unhealthy: Wind,
  "very-unhealthy": CloudFog,
  hazardous: ShieldAlert,
};

export default function Home() {
  const [language, setLanguage] = useState<Language>("en");
  const [demo, setDemo] = useState(true);
  const [air, setAir] = useState<AirSnapshot>(demoAir);
  const [profile, setProfile] = useState<HouseholdProfile>(defaultProfile);
  const [onboarding, setOnboarding] = useState(false);
  const [step, setStep] = useState(0);
  const [city, setCity] = useState("");
  const [offline, setOffline] = useState(false);
  const [plan, setPlan] = useState<AdvicePlan>(() => createRulePlan(demoAir, defaultProfile));
  const [chatOpen, setChatOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [streak, setStreak] = useState(4);
  const [toolkit, setToolkit] = useState<string[]>([]);
  const [scenarioActions, setScenarioActions] = useState(["metro", "purifier", "induction"]);
  const [theme, setTheme] = useState<"morning" | "dusk">("dusk");
  const [previewAqi, setPreviewAqi] = useState(demoAir.aqi);

  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    try {
      const saved = localStorage.getItem("breatheeasy-profile");
      if (saved) setProfile(JSON.parse(saved) as HouseholdProfile);
      const savedStreak = localStorage.getItem("breatheeasy-streak");
      if (savedStreak) setStreak(Number(savedStreak));
    } catch {
      // local state remains a safe default.
    }
    setOffline(!navigator.onLine);
    const update = () => setOffline(!navigator.onLine);
    window.addEventListener("offline", update);
    window.addEventListener("online", update);
    return () => {
      window.removeEventListener("offline", update);
      window.removeEventListener("online", update);
    };
  }, []);

  useEffect(() => {
    setPlan(createRulePlan(demo ? demoAir : air, profile));
  }, [demo, air, profile]);

  useEffect(() => {
    setPreviewAqi(demo ? demoAir.aqi : air.aqi);
  }, [demo, air.aqi]);

  const current = demo ? demoAir : air;
  const t = copy[language];
  const cigarettes = exposureCigarettes(current.pm25);
  const previewCategory = categorizeAqi(previewAqi);
  const CategoryIcon = aqiIcons[previewCategory.tone] ?? Cloud;
  const scenarioImpact = scenarioActions.includes("metro") ? tripImpact(5).co2AvoidedG : 0;
  const cleanestHourIndex = current.hourly.reduce(
    (bestIndex, hour, index, hours) => hour.aqi < hours[bestIndex].aqi ? index : bestIndex,
    0,
  );
  const cleanestHour = current.hourly[cleanestHourIndex]?.time ?? "14:00";
  const cleanestTime = cleanestHour.includes("T") ? cleanestHour.slice(11, 16) : cleanestHour.slice(0, 5);
  const dialColors: Record<string, string> = {
    good: "var(--aqi-good)",
    moderate: "var(--aqi-moderate)",
    sensitive: "var(--aqi-sensitive)",
    unhealthy: "var(--aqi-unhealthy)",
    "very-unhealthy": "var(--aqi-very-unhealthy)",
    hazardous: "var(--aqi-hazardous)",
  };
  const dialCircumference = 2 * Math.PI * 66;

  async function locate() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async (position) => {
      const result = await fetch("/api/air", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
      });
      if (result.ok) setAir(await result.json() as AirSnapshot);
    }, () => setOffline(true));
  }

  async function searchCity() {
    if (city.trim().length < 2) return;
    const response = await fetch(`/api/geocoding?q=${encodeURIComponent(city)}`);
    if (!response.ok) return;
    const results = await response.json() as Array<{ name: string; latitude: number; longitude: number }>;
    if (!results[0]) return;
    setDemo(false);
    setAir({ ...demoAir, city: results[0].name, latitude: results[0].latitude, longitude: results[0].longitude, source: "live" });
  }

  async function planDay() {
    setLoading(true);
    setChatOpen(true);
    setAnswer("");
    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "Plan my day for my family",
          language,
          latitude: current.latitude,
          longitude: current.longitude,
          currentAqi: current.aqi,
          pm25: current.pm25,
          profile,
        }),
      });
      if (!response.ok) throw new Error("offline");
      const result = await response.json() as AdvicePlan;
      setPlan(result);
      setAnswer(language === "hi"
        ? "आपका व्यक्तिगत योजना तैयार है। सबसे साफ़ घंटे में बाहर जाएं और फिल्टर की हवा का लाभ लें।"
        : "Your personalized plan is ready. Use the cleanest hours, keep vulnerable members indoors, and ventilate briefly.");
    } catch {
      setAnswer(language === "hi"
        ? "स्मार्ट मोड ऑफ़लाइन है — सुरक्षित मूल योजना आपके लिए तैयार है।"
        : "Smart Mode offline — a safe baseline plan is ready for you.");
    } finally {
      setLoading(false);
    }
  }

  async function sendChat() {
    if (!message.trim()) return;
    setLoading(true);
    const question = message;
    setMessage("");
    setAnswer("");
    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: question, language, latitude: current.latitude, longitude: current.longitude, currentAqi: current.aqi, pm25: current.pm25, profile }),
      });
      if (!response.ok) throw new Error("offline");
      const result = await response.json() as AdvicePlan;
      setPlan(result);
      setAnswer(language === "hi" ? "प्रश्न का उत्तर आपकी वायु स्थिति और परिवार प्रोफ़ाइल के अनुसार तैयार है।" : "Answer prepared for your air conditions and household profile.");
    } catch {
      setAnswer("Smart Mode offline — please follow the baseline advice below.");
    } finally {
      setLoading(false);
    }
  }

  function saveProfile() {
    localStorage.setItem("breatheeasy-profile", JSON.stringify(profile));
    setOnboarding(false);
  }

  async function sharePledge() {
    const text = `My BreatheEasy clean air pledge: aim to avoid 1 kg of weekly transport emissions and protect our neighborhood.`;
    if (navigator.share) {
      await navigator.share({ title: "BreatheEasy Clean Air Pledge", text });
    } else {
      await navigator.clipboard.writeText(text);
    }
  }

  const timeline = useMemo(() => current.hourly.slice(0, 24), [current]);

  return (
    <div className="app-shell" data-theme={theme}>
      <header className="topbar">
        <button className="brand" aria-label="BreatheEasy home" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          <span className="brand-mark" aria-hidden="true"><Wind size={19} strokeWidth={1.7} /></span><span>BreatheEasy</span>
        </button>
        <div className="top-actions">
          <button className="icon-button" aria-label="Switch language" onClick={() => setLanguage(language === "en" ? "hi" : "en")}>{language === "en" ? "हिं" : "EN"}</button>
          <button className="icon-button theme-toggle" aria-label={`Switch to ${theme === "morning" ? "Dusk" : "Morning"} theme`} onClick={() => setTheme(theme === "morning" ? "dusk" : "morning")}>{theme === "morning" ? "Dusk" : "Morning"}</button>
          <label className="demo-toggle">
            <input type="checkbox" checked={demo} onChange={(event) => setDemo(event.target.checked)} />
            <span>Demo mode</span>
          </label>
        </div>
      </header>

      <main>
        {demo && <div className="demo-strip"><span className="demo-dot" />{t.demo} <span>Delhi-style severe smog scenario</span></div>}
        {offline && <div className="offline-banner" role="status"><Wind size={16} aria-hidden="true" />Offline · showing your last known air snapshot</div>}

        <section className="hero" aria-labelledby="air-heading" data-aqi={previewCategory.tone}>
          <div className="hero-heading">
            <div className="location-title">
              <p className="eyebrow">{t.snapshot}<span className="live-mark" aria-hidden="true" /></p>
              <h1 id="air-heading">{demo ? "New Delhi" : current.city}</h1>
              <p className="location-caption">A softer way to read the air around you</p>
            </div>
            <div className="location-tools">
              <button className="secondary location-button" onClick={locate}><Wind size={16} aria-hidden="true" />Use my location</button>
              <div className="city-search">
                <label className="sr-only" htmlFor="city">Search city</label>
                <input id="city" value={city} onChange={(event) => setCity(event.target.value)} onKeyDown={(event) => event.key === "Enter" && searchCity()} placeholder="Find a city" />
                <button className="secondary" onClick={searchCity}>Search</button>
              </div>
            </div>
          </div>

          <div className="hero-grid">
            <LivingSkyline aqi={previewAqi} city={demo ? "New Delhi" : current.city} />
            <div className="hero-copy">
              <div className={`category category-${previewCategory.tone}`}><CategoryIcon size={16} strokeWidth={1.8} aria-hidden="true" /><span>{previewCategory.label}</span></div>
              <motion.strong className="aqi-number" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} key={previewAqi}>{previewAqi}</motion.strong>
              <span className="aqi-unit">US AQI <span>·</span> {current.updatedAt ? "Updated just now" : "Current reading"}</span>
              <h2>{previewAqi > 200 ? "Keep the family indoors" : previewAqi > 100 ? "Choose your outside moments" : "A little more room to breathe"}</h2>
              <p>{previewAqi > 200
                ? "Wear a well-fitted N95 or FFP2 outdoors if needed. Run filtration indoors and postpone strenuous activity."
                : "Use the cleaner hours for time outside, and keep checking conditions as they change."}</p>
              <button className="primary" onClick={planDay}>{loading ? "Building your plan…" : t.plan}<span aria-hidden="true">→</span></button>
            </div>
          </div>

          <div className="sky-preview">
            <div><p className="eyebrow">Feel the difference</p><p className="preview-description">Explore how the city changes as pollution rises.</p></div>
            <label className="sr-only" htmlFor="aqi-preview">Air quality preview</label>
            <input id="aqi-preview" className="aqi-slider" type="range" min="20" max="400" step="1" value={previewAqi} aria-valuetext={`AQI ${previewAqi}, ${previewCategory.label}`} onChange={(event) => setPreviewAqi(Number(event.target.value))} />
            <p className="preview-reading">At this level, <strong>{previewAqi <= 50 ? "the skyline feels open and clear." : previewAqi <= 100 ? "the light softens around the rooftops." : previewAqi <= 150 ? "the far hills begin to fade." : previewAqi <= 200 ? "the distant city dissolves into haze." : "the skyline settles into a smoky veil."}</strong></p>
            <div className="range-labels"><span>Clear · 20</span><span>Heavy haze · 400</span></div>
            {previewAqi !== current.aqi && (
              <button className="text-reset" type="button" onClick={() => setPreviewAqi(current.aqi)}>Back to live air</button>
            )}
          </div>

          <div className="pollutant-grid" aria-label="Pollutant readings">
            {[["PM2.5", current.pm25, "µg/m³"], ["PM10", current.pm10, "µg/m³"], ["NO₂", current.no2, "µg/m³"], ["O₃", current.o3, "µg/m³"]].map(([label, value, unit]) => (
              <div className="pollutant" key={String(label)}><span>{label}</span><strong>{value}</strong><small>{unit}</small>
                <span className="pollutant-note">{label === "PM2.5" ? "Fine particles" : label === "PM10" ? "Coarse particles" : label === "NO₂" ? "Traffic gas" : "Ground-level ozone"}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="section family-scenario" aria-labelledby="scenario-heading">
          <div className="scenario-panel">
            <p className="scenario-kicker">A small shift, felt at home</p>
            <h2 id="scenario-heading">What if your family did this today?</h2>
            <div className="scenario-actions" aria-label="Choose household actions">
              {[
                { id: "metro", icon: TrainFront, label: "Metro, not car" },
                { id: "purifier", icon: AirVent, label: "Purifier in bedroom" },
                { id: "induction", icon: Zap, label: "Induction cooking" },
              ].map((action) => (
                <button
                  className={`scenario-action ${scenarioActions.includes(action.id) ? "selected" : ""}`}
                  key={action.id}
                  aria-pressed={scenarioActions.includes(action.id)}
                  onClick={() => setScenarioActions((selected) => selected.includes(action.id)
                    ? selected.filter((item) => item !== action.id)
                    : [...selected, action.id])}
                >
                  <action.icon size={16} aria-hidden="true" />{action.label}
                </button>
              ))}
            </div>
            <div className="scenario-metrics">
              <article className="scenario-metric">
                <span>Family indoor exposure</span>
                <div className="metric-number">{scenarioActions.includes("purifier") ? "43" : "100"}<small>{scenarioActions.includes("purifier") ? "down 57%" : "starting point"}</small></div>
                <div
                  className="exposure-track"
                  role="meter"
                  aria-label="Illustrative relative family indoor exposure"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={scenarioActions.includes("purifier") ? 43 : 100}
                  aria-valuetext={scenarioActions.includes("purifier") ? "43, down 57 percent" : "100, starting point"}
                >
                  <span style={{ width: scenarioActions.includes("purifier") ? "43%" : "100%" }} />
                </div>
                <small className="metric-disclaimer">Illustrative relative estimate, not a sensor reading</small>
              </article>
              <article className="scenario-metric">
                <span>CO₂ avoided today</span>
                <div className="metric-number">{scenarioImpact} <small>g</small></div>
                <p>Approximate 5 km petrol-car-to-metro trip. Assumptions in “How we calculated this”.</p>
              </article>
            </div>
          </div>
          <div className="family-cards">
            <article className="family-card">
              <span className="family-avatar child" aria-hidden="true">C</span>
              <div><h3>Children</h3><span>More sensitive to pollution</span></div>
              <p>{current.aqi > 150 ? "Stay indoors today. Play in the filtered room and skip the school ground." : "Choose the cleaner forecast window for outdoor play."}</p>
            </article>
            <article className="family-card">
              <span className="family-avatar elder" aria-hidden="true">E</span>
              <div><h3>Older adults</h3><span>Extra care on hazy days</span></div>
              <p>{current.aqi > 150 ? "Keep walks short and indoors during peak pollution. Use a fitted N95 if going out." : "A short walk in the cleaner hour is a gentler choice."}</p>
            </article>
            <article className="family-card">
              <span className="family-avatar adults" aria-hidden="true">A</span>
              <div><h3>Adults</h3><span>Healthy everyday habits</span></div>
              <p>{current.aqi > 150 ? "Take the metro and avoid evening runs outdoors." : "Keep the lower-emission commute and ventilate when air improves."}</p>
            </article>
          </div>
        </section>

        <section className="section" id="plan">
          <div className="section-heading"><div><p className="eyebrow">{t.today}</p><h2>Small rituals, better hours</h2></div><button className="secondary" onClick={() => setOnboarding(true)}>Edit household</button></div>
          <div className="ritual-grid">
            <article className="ritual-card window-card">
              <div className="ritual-title"><Wind size={19} aria-hidden="true" /><span>Window timer</span></div>
              <span className={`window-status ${current.aqi > 150 ? "closed" : "open"}`}>{current.aqi > 150 ? "Keep windows closed" : "A fresh-air break"}</span>
              <h3>{current.aqi > 150 ? `Open at ${cleanestTime}` : "Let the cleaner air in"}</h3>
              <p>{current.aqi > 150 ? "Ventilate for about 10 minutes during the cleaner forecast window, then close up again." : "Open windows briefly while the forecast is at its cleanest."}</p>
            </article>
            <article className="ritual-card dial-card">
              <div className="ritual-title"><Sun size={19} aria-hidden="true" /><span>Day dial</span></div>
              <div className="day-dial" role="img" aria-label="24-hour air quality dial. Lighter segments indicate cleaner hours.">
                <svg viewBox="0 0 170 170" aria-hidden="true">
                  <circle cx="85" cy="85" r="66" fill="none" stroke="var(--hairline)" strokeWidth="26" />
                  {timeline.slice(0, 24).map((hour, index) => (
                    <circle
                      key={hour.time}
                      cx="85"
                      cy="85"
                      r="66"
                      fill="none"
                      stroke={dialColors[categorizeAqi(hour.aqi).tone]}
                      strokeWidth="26"
                      strokeDasharray={`${dialCircumference / 24 - 2} ${dialCircumference}`}
                      transform={`rotate(${index * 15 - 90} 85 85)`}
                    />
                  ))}
                </svg>
                <div className="dial-center"><span>Best hour</span><strong>{cleanestTime}</strong></div>
                <span className="dial-label label-midnight">12 am</span>
                <span className="dial-label label-morning">6 am</span>
                <span className="dial-label label-noon">12 pm</span>
                <span className="dial-label label-evening">6 pm</span>
              </div>
              <p className="dial-caption">Lighter is cleaner. Darker is worse.</p>
            </article>
            <article className="ritual-card pledge-mini" id="community">
              <div className="ritual-title"><Leaf size={19} aria-hidden="true" /><span>Neighborhood pledge</span></div>
              <p className="pledge-count"><strong>{streak}</strong><span>day clean-air streak</span></p>
              <div className="streak-track" role="meter" aria-label="Clean-air streak progress" aria-valuemin={0} aria-valuemax={7} aria-valuenow={Math.min(streak, 7)} aria-valuetext={`${Math.min(streak, 7)} of 7 clean-air days`}><span style={{ width: `${Math.min(streak, 7) / 7 * 100}%` }} /></div>
              <p>Carpool day, no burning, and a little care for the trees and streets.</p>
              <button className="secondary pledge-button" onClick={sharePledge}>Add my family</button>
            </article>
          </div>
          <div className="timeline-label-row"><span>Today’s hourly air</span><span>Forecast AQI · lower is cleaner</span></div>
          <div className="timeline" role="group" aria-label="Hourly air quality forecast" tabIndex={0}>
            {timeline.map((hour, index) => (
              <motion.div className="timeline-hour" key={hour.time} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.018 }}>
                <span>{hour.time.slice(11, 16) || hour.time}</span>
                <div className={`timeline-bar aqi-${categorizeAqi(hour.aqi).tone}`} style={{ height: `${Math.max(18, Math.min(100, hour.aqi / 4))}px` }} aria-hidden="true" />
                <b>{hour.aqi}</b>
              </motion.div>
            ))}
          </div>
          <div className="window-notes"><span><Sun size={16} aria-hidden="true" /> Best window: <strong>{cleanestTime}</strong></span><span><CloudFog size={16} aria-hidden="true" /> Toughest window: <strong>{current.hourly.reduce((worst, hour) => hour.aqi > worst.aqi ? hour : worst, current.hourly[0])?.time.slice(11, 16) || "08:00"}</strong></span></div>
          <div className="plan-sections">
            {[
              { title: "Low-emission routines", icon: Leaf, tips: plan.lowEmission },
              { title: "Indoor air, made calmer", icon: Wind, tips: plan.indoor },
              { title: "Gentler alternatives", icon: CloudSun, tips: plan.sustainable },
            ].map(({ title, icon: Icon, tips }) => (
              <section className="advice-section" key={title}>
                <div className="advice-heading"><Icon size={18} strokeWidth={1.7} aria-hidden="true" /><h3>{title}</h3></div>
                {tips.map((tip) => <article className="advice-card" key={tip.title}><h4>{tip.title}</h4><p>{tip.detail}</p><span className="impact-pill">{tip.impact}</span></article>)}
              </section>
            ))}
          </div>
        </section>

        <section className="section">
          <div className="section-heading"><div><p className="eyebrow">Impact, made legible</p><h2>{cigarettes} cigarette equivalents</h2></div></div>
          <article className="impact-card">
            <p><strong>A useful comparison, not a medical measure.</strong> Today’s PM2.5 is compared with the widely cited approximation that 22 µg/m³ over 24 hours is roughly equivalent to one cigarette.</p>
            <details className="calculation-drawer"><summary>How we calculated this</summary><p>Visibility is an illustrative estimate derived from PM2.5 concentration and is not measured visibility. Exposure uses the approximate 22 µg/m³ per 24-hour cigarette-equivalent rule. Trip emissions use 170 g CO2/km for a petrol car versus 28 g CO2/km for metro travel. Purifier estimates depend on clean-air delivery rate, room size, and use.</p></details>
          </article>
        </section>

        <section className="section" id="toolkit">
          <div className="section-heading"><div><p className="eyebrow">{t.toolkit}</p><h2>Small fixes, real impact</h2></div></div>
          <div className="toolkit-grid">
            {[
              ["Seal gaps", "Low cost", "Reduces infiltration"],
              ["Ventilate at 03:00–06:00", "Free", "Lowest demo AQI window"],
              ["Run kitchen exhaust", "Free", "Limits indoor PM2.5"],
              ["Use wet mopping", "Low cost", "Avoids dust resuspension"],
              ["Wear N95/FFP2 correctly", "Medium", "Seal and replace when damp"],
              ["Skip incense and burning", "Free", "Protects indoor air"],
            ].map(([title, cost, effect]) => (
              <label className={`tool ${toolkit.includes(title) ? "checked" : ""}`} key={title}>
                <input type="checkbox" checked={toolkit.includes(title)} onChange={() => setToolkit((items) => items.includes(title) ? items.filter((item) => item !== title) : [...items, title])} />
                <span className="check">✓</span><div><strong>{title}</strong><small>{cost} · {effect}</small></div>
              </label>
            ))}
          </div>
          <details className="glass-card"><summary>Houseplant myths vs facts</summary><p>Plants add comfort but do not replace filtration or ventilation at pollution levels typical of severe smog.</p></details>
        </section>

        {chatOpen && (
          <aside className="chat-panel" aria-label="BreatheEasy assistant">
            <div className="chat-head"><strong>BreatheEasy Assistant</strong><button aria-label="Close assistant" onClick={() => setChatOpen(false)}>×</button></div>
            <div className="chat-answer" aria-live="polite">{loading ? "Thinking…" : answer || "Ask me how to protect your family."}</div>
            {plan.indoor.length > 0 && <div className="chat-tips">{plan.indoor.map((tip) => <button key={tip.title} onClick={() => setMessage(tip.title)}>{tip.title}</button>)}</div>}
            <div className="chat-input"><input value={message} onChange={(event) => setMessage(event.target.value)} onKeyDown={(event) => event.key === "Enter" && sendChat()} placeholder="Ask a question…" aria-label="Chat message" /><button onClick={sendChat}>Send</button></div>
          </aside>
        )}

        {onboarding && (
          <div className="modal-backdrop" role="presentation">
            <div className="modal" role="dialog" aria-modal="true" aria-labelledby="profile-title">
              <div className="modal-head"><div><p className="eyebrow">Household profile</p><h2 id="profile-title">Step {step + 1} of 4</h2></div><button aria-label="Close" onClick={() => setOnboarding(false)}>×</button></div>
              {step === 0 && <fieldset><legend>Who lives here?</legend>{["kids","elderly","pregnant","respiratory","adults"].map((member) => <button className={profile.members.includes(member as HouseholdProfile["members"][number]) ? "choice active" : "choice"} key={member} onClick={() => setProfile({ ...profile, members: profile.members.includes(member as HouseholdProfile["members"][number]) ? profile.members.filter((item) => item !== member) : [...profile.members, member as HouseholdProfile["members"][number]] })}>{member}</button>)}</fieldset>}
              {step === 1 && <fieldset><legend>Home setup</legend><button className="choice" onClick={() => setProfile({ ...profile, homeType: "apartment" })}>Apartment</button><button className="choice" onClick={() => setProfile({ ...profile, homeType: "house" })}>House</button><label><input type="checkbox" checked={profile.hasPurifier} onChange={(event) => setProfile({ ...profile, hasPurifier: event.target.checked })} /> Air purifier</label></fieldset>}
              {step === 2 && <fieldset><legend>Commute</legend>{["walk","bike","two-wheeler","car","bus","metro"].map((mode) => <button className={`choice ${profile.commute === mode ? "active" : ""}`} key={mode} onClick={() => setProfile({ ...profile, commute: mode as HouseholdProfile["commute"] })}>{mode}</button>)}</fieldset>}
              {step === 3 && <fieldset><legend>Cooking and budget</legend>{["lpg","induction","wood"].map((fuel) => <button className={`choice ${profile.cooking === fuel ? "active" : ""}`} key={fuel} onClick={() => setProfile({ ...profile, cooking: fuel as HouseholdProfile["cooking"] })}>{fuel}</button>)}<div className="budget-row">{["low","medium","high"].map((budget) => <button className={`choice ${profile.budget === budget ? "active" : ""}`} key={budget} onClick={() => setProfile({ ...profile, budget: budget as HouseholdProfile["budget"] })}>{budget}</button>)}</div></fieldset>}
              <div className="modal-actions"><button className="secondary" disabled={step === 0} onClick={() => setStep(step - 1)}>Back</button>{step < 3 ? <button className="primary" onClick={() => setStep(step + 1)}>Next</button> : <button className="primary" onClick={saveProfile}>Save profile</button>}</div>
            </div>
          </div>
        )}
      </main>

      <nav className="bottom-nav" aria-label="Main navigation">
        <a href="#air-heading">Today</a><a href="#plan">Plan</a><a href="#toolkit">Toolkit</a><a href="#community">Community</a>
      </nav>
    </div>
  );
}
