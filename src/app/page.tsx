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
import { AirSnapshot, AdvicePlan, CityResult, HouseholdProfile, Language } from "@/lib/types";
import { exposureCigarettes } from "@/lib/impact/calculator";
import { LivingSkyline } from "@/components/LivingSkyline";
import { DayDial } from "@/components/DayDial";
import { CitySearch } from "@/components/CitySearch";
import { bestWindow, whatIfTotals } from "@/lib/presentation";
import { useLocation } from "@/hooks/useLocation";
import { formatLocationLabel } from "@/lib/location";

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

const { requestLocation, setFollowing, following, error: locationError } = useLocation({
  onChange: async (coords) => {
    await fetchAir(coords.latitude, coords.longitude, true);
    setAir((prev) => ({
      ...prev,
      city: formatLocationLabel(coords.latitude, coords.longitude),
    }));
  },
});

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
  const scenarioImpact = whatIfTotals(scenarioActions);
  const cleanestWindow = bestWindow(current.hourly);
  const cleanestHour = cleanestWindow?.hour.time ?? "14:00";
  const cleanestTime = cleanestHour.includes("T") ? cleanestHour.slice(11, 16) : cleanestHour.slice(0, 5);

  const now = new Date();
  const offsetHours = (current.utcOffsetSeconds ?? 0) / 3600;
  const locationHour = ((now.getUTCHours() + offsetHours) % 24 + 24) % 24;

  async function fetchAir(latitude: number, longitude: number, markLive = true) {
    const lat = Math.round(latitude * 100) / 100;
    const lon = Math.round(longitude * 100) / 100;
    try {
      setOffline(false);
      const response = await fetch(`/api/air?lat=${encodeURIComponent(String(lat))}&lon=${encodeURIComponent(String(lon))}`);
      if (!response.ok) throw new Error("air unavailable");
      const result = await response.json() as AirSnapshot;
      setAir(result);
      if (markLive) setDemo(false);
    } catch {
      setOffline(true);
    }
  }

  async function locate() {
    requestLocation();
  }

  async function handleCitySelect(city: CityResult) {
    fetchAir(city.latitude, city.longitude);
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
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1080;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.fillStyle = "#FBF8F2";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = "#DDD5C6";
    context.lineWidth = 2;
    context.strokeRect(48, 48, 984, 984);
    context.fillStyle = "#23291F";
    context.font = "700 64px Georgia";
    context.fillText("Clean Air Pledge", 104, 180);
    context.font = "500 38px Georgia";
    context.fillText("A calmer week, one choice at a time.", 104, 240);
    context.fillStyle = "#4F6F58";
    context.font = "700 164px Georgia";
    context.fillText(`${whatIfTotals(scenarioActions).co2AvoidedG * 7}`, 104, 520);
    context.fillStyle = "#23291F";
    context.font = "600 34px sans-serif";
    context.fillText("grams of CO₂ avoided this week*", 104, 570);
    context.font = "500 28px sans-serif";
    context.fillStyle = "#5B6155";
    context.fillText("Carpool day  ·  No burning  ·  Dust control", 104, 690);
    context.fillText("School activity  ·  BreatheEasy", 104, 738);
    context.font = "20px sans-serif";
    context.fillText("*Approximate planning estimate, not a lifecycle assessment.", 104, 930);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    const text = "My BreatheEasy Clean Air Pledge: a lower-emission commute, cleaner indoor air, and neighborhood care.";
    if (blob && navigator.share && navigator.canShare) {
      const file = new File([blob], "breatheeasy-clean-air-pledge.png", { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title: "BreatheEasy Clean Air Pledge", text, files: [file] });
        return;
      }
    }
    if (blob) {
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = "breatheeasy-clean-air-pledge.png";
      link.click();
    }
    await navigator.clipboard?.writeText(text);
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
              <button
                className={`secondary location-button ${following ? "location-active" : ""}`}
                aria-pressed={following}
                onClick={() => setFollowing(!following)}
              >
                {following ? "Following location" : "Follow my location"}
              </button>
              {following && <span className="following-indicator">Following your location, updates when you move</span>}
              {locationError && <span className="location-error" role="alert">{locationError}</span>}
              <CitySearch onSelect={handleCitySelect} />
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
            <input id="aqi-preview" className="aqi-slider" type="range" min="20" max="400" step="1" value={previewAqi} aria-valuetext={`AQI ${previewAqi}, ${previewCategory.label}`} onChange={(event) => setPreviewAqi(Number(event.target.value))} onKeyDown={(event) => {
              if (event.key === "Home") { event.preventDefault(); setPreviewAqi(20); }
              else if (event.key === "End") { event.preventDefault(); setPreviewAqi(400); }
              else if (event.key === "ArrowLeft") { event.preventDefault(); setPreviewAqi((prev) => Math.max(20, prev - 1)); }
              else if (event.key === "ArrowRight") { event.preventDefault(); setPreviewAqi((prev) => Math.min(400, prev + 1)); }
            }} />
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
                <div className="metric-number">{scenarioImpact.exposure}<small>{scenarioImpact.exposureReduction > 0 ? `down ${scenarioImpact.exposureReduction}%` : "starting point"}</small></div>
                <div
                  className="exposure-track"
                  role="meter"
                  aria-label="Illustrative relative family indoor exposure"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={scenarioImpact.exposure}
                  aria-valuetext={`${scenarioImpact.exposure}, ${scenarioImpact.exposureReduction > 0 ? `down ${scenarioImpact.exposureReduction} percent` : "starting point"}`}
                >
                  <span style={{ width: `${scenarioImpact.exposure}%`, background: scenarioImpact.exposure <= 55 ? "var(--aqi-good)" : scenarioImpact.exposure <= 75 ? "var(--aqi-moderate)" : "var(--aqi-unhealthy)" }} />
                </div>
                <small className="metric-disclaimer">Illustrative relative estimate, not a sensor reading</small>
              </article>
              <article className="scenario-metric">
                <span>CO₂ avoided today</span>
                <div className="metric-number">{scenarioImpact.co2AvoidedG} <small>g</small></div>
                <p>Approximate 5 km petrol-car-to-metro trip. Assumptions in “How we calculated this”.</p>
              </article>
            </div>
          </div>
          <div className="family-cards">
            {profile.members.length === 0 ? (
              <article className="family-card family-empty">
                <div><h3>Add family members</h3><span>Personal advice appears here</span></div>
                <p>Choose who is at home so BreatheEasy can tailor the plan.</p>
                <button className="secondary" onClick={() => setOnboarding(true)}>Add family</button>
              </article>
            ) : profile.members.map((member) => {
              const labels: Record<HouseholdProfile["members"][number], { name: string; age: string; initial: string }> = {
                kids: { name: "Child", age: "School-age", initial: "C" },
                elderly: { name: "Older adult", age: "Extra care", initial: "E" },
                pregnant: { name: "Pregnant member", age: "Extra care", initial: "P" },
                respiratory: { name: "Asthma / respiratory", age: "Sensitive", initial: "R" },
                adults: { name: "Healthy adult", age: "Everyday habits", initial: "A" },
              };
              const label = labels[member];
              const verdict = member === "kids" || member === "respiratory" || member === "pregnant"
                ? current.aqi > 150 ? "Stay indoors, play in a filtered room, and avoid the school ground." : "Choose the cleaner forecast window for gentle outdoor time."
                : member === "elderly"
                  ? current.aqi > 150 ? "Keep walks short and indoors at peak pollution. Use a fitted mask if going out." : "A short walk during the cleaner hour is the gentler choice."
                  : current.aqi > 150 ? "Take the metro and avoid evening exercise outdoors." : "Keep the lower-emission commute and ventilate only in cleaner hours.";
              return (
                <article className="family-card" key={member}>
                  <span className="family-avatar" aria-hidden="true">{label.initial}</span>
                  <div><h3>{label.name}</h3><span>{label.age}</span>{plan.smartMode === "offline" && <small className="smart-badge">Smart Mode offline</small>}</div>
                  <p>{verdict}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="section" id="plan">
          <div className="section-heading"><div><p className="eyebrow">{t.today}</p><h2>Small rituals, better hours</h2></div><button className="secondary" onClick={() => setOnboarding(true)}>Edit household</button></div>
          <div className="ritual-grid">
            <article className="ritual-card window-card">
              <div className="ritual-title"><Wind size={19} aria-hidden="true" /><span>Window timer</span></div>
              <span className={`window-status ${cleanestWindow && cleanestWindow.hour.aqi > 150 ? "closed" : "open"}`}>{cleanestWindow && cleanestWindow.hour.aqi > 150 ? "Keep windows closed" : "Good time to open"}</span>
              <h3>{cleanestWindow && cleanestWindow.hour.aqi > 150 ? "Even the best hour is unhealthy" : `Open at ${cleanestTime}`}</h3>
              <p>{cleanestWindow && cleanestWindow.hour.aqi > 150
                ? "Use filtration indoors and keep windows closed. Ventilation is not recommended at these forecast levels."
                : "Ventilate about 10 minutes, then close up again. This window has the lowest forecast AQI."}</p>
            </article>
            <article className="ritual-card dial-card">
              <div className="ritual-title"><Sun size={19} aria-hidden="true" /><span>Day dial</span></div>
              <div className="day-dial">
                <DayDial hourly={timeline} bestHour={cleanestTime} currentHour={locationHour} />
              </div>
              <p className="dial-caption">Lighter is cleaner. Darker is worse.</p>
            </article>
            <article className="ritual-card pledge-mini" id="community">
              <div className="ritual-title"><Leaf size={19} aria-hidden="true" /><span>Neighborhood pledge</span></div>
              <p className="pledge-count"><strong>{streak}</strong><span>day clean-air streak</span></p>
              <div className="streak-track" role="meter" aria-label="Clean-air streak progress" aria-valuemin={0} aria-valuemax={7} aria-valuenow={Math.min(streak, 7)} aria-valuetext={`${Math.min(streak, 7)} of 7 clean-air days`}><span style={{ width: `${Math.min(streak, 7) / 7 * 100}%` }} /></div>
              <ul className="pledge-checklist" aria-label="Clean air pledge checklist">
                {["Carpool day", "No burning", "Tree & dust care", "School activity check"].map((item) => (
                  <li key={item}><input type="checkbox" aria-label={item} />{item}</li>
                ))}
              </ul>
              <button className="secondary pledge-button" onClick={sharePledge}>Add my family</button>
            </article>
          </div>
          <div className="timeline-label-row"><span>Today’s hourly air</span><span>Forecast AQI · lower is cleaner</span></div>
          <div className="timeline" role="group" aria-label="Hourly air quality forecast" tabIndex={0}>
            {timeline.map((hour) => (
              <div className="timeline-hour" key={hour.time}>
                <span>{hour.time.slice(11, 16) || hour.time}</span>
                <div className={`timeline-bar aqi-${categorizeAqi(hour.aqi).tone}`} style={{ height: `${Math.max(18, Math.min(100, hour.aqi / 4))}px` }} aria-hidden="true" />
                <b>{hour.aqi}</b>
              </div>
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
                {tips.map((tip) => (
                  <article className="advice-card" key={tip.title}>
                    <h4>{tip.title}</h4>
                    <p>{tip.detail}</p>
                    <span className="impact-pill">{tip.impact}</span>
                    <details className="tip-calculation">
                      <summary>How we calculated this</summary>
                      <p>Planning estimate using the centralized emission factors and purifier assumptions. It is not a clinical or lifecycle measurement.</p>
                    </details>
                  </article>
                ))}
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

        <footer className="footer-notes">
          <p><strong>General guidance only.</strong> This is not medical advice. If symptoms are severe or worsen, seek qualified medical care.</p>
          <p><strong>Privacy.</strong> Location is rounded before server use. The household profile is stored only in this browser.</p>
        </footer>

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
