"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Wind, CloudFog, Cloud, CloudSun, ShieldAlert, Sun, type LucideIcon } from "lucide-react";
import { demoAir } from "@/lib/air/demo";
import { categorizeAqi, createRulePlan } from "@/lib/rules/engine";
import { copy } from "@/lib/i18n";
import { AirSnapshot, AdvicePlan, CityResult, HouseholdProfile, Language } from "@/lib/types";
import { exposureCigarettes } from "@/lib/impact/calculator";
import { bestWindow, whatIfTotals } from "@/lib/presentation";
import { useLocation } from "@/hooks/useLocation";
import { formatLocationLabel } from "@/lib/location";
import { AirDisplay } from "./components/AirDisplay";
import { FamilyScenario } from "./components/FamilyScenario";
import { PlanRituals } from "./components/PlanRituals";
import { AdviceSections } from "./components/AdviceSections";
import { ImpactSection } from "./components/ImpactSection";
import { ToolkitSection } from "./components/ToolkitSection";
import { ChatPanel } from "./components/ChatPanel";
import { OnboardingModal } from "./components/OnboardingModal";

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

  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (onboarding && modalRef.current) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      const focusable = modalRef.current.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      focusable?.focus();
    } else if (!onboarding && previousActiveElement.current) {
      previousActiveElement.current.focus();
      previousActiveElement.current = null;
    }
  }, [onboarding]);

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
    if (!chatOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setChatOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [chatOpen]);

  useEffect(() => {
    if (!chatOpen) return;
    const panel = document.querySelector<HTMLElement>('.chat-panel');
    if (!panel) return;
    const focusableSelect = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const focusableElements = panel.querySelectorAll<HTMLElement>(focusableSelect);
    let focusIndex = 0;
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
      event.preventDefault();
      if (event.key === "ArrowDown") {
        focusIndex = Math.min(focusIndex + 1, focusableElements.length - 1);
        focusableElements[focusIndex]?.focus();
      } else if (event.key === "ArrowUp") {
        focusIndex = Math.max(focusIndex - 1, 0);
        focusableElements[focusIndex]?.focus();
      }
    };
    panel.addEventListener("keydown", handleKeydown);
    return () => panel.removeEventListener("keydown", handleKeydown);
  }, [chatOpen]);

  useEffect(() => {
    setPreviewAqi(demo ? demoAir.aqi : air.aqi);
  }, [demo, air.aqi]);

  const current = demo ? demoAir : air;
  const t = copy[language];
  const cigarettes = exposureCigarettes(current.pm25);
  const previewCategory = categorizeAqi(previewAqi);

  const aqiIcons: Record<string, LucideIcon> = {
    good: Sun,
    moderate: CloudSun,
    sensitive: Cloud,
    unhealthy: Wind,
    "very-unhealthy": CloudFog,
    hazardous: ShieldAlert,
  };
  const CategoryIcon = aqiIcons[previewCategory.tone] ?? Cloud;

  const scenarioImpact = whatIfTotals(scenarioActions);
  const cleanestWindow = bestWindow(current.hourly);
  const cleanestHour = cleanestWindow?.hour.time ?? "14:00";
  const cleanestTime = cleanestHour.includes("T") ? cleanestHour.slice(11, 16) : cleanestHour.slice(0, 5);

  const now = new Date();
  const offsetHours = (current.utcOffsetSeconds ?? 0) / 3600;
  const locationHour = ((now.getUTCHours() + offsetHours) % 24 + 24) % 24;

  const timeline = useMemo(() => current.hourly.slice(0, 24), [current]);

  async function fetchAir(latitude: number, longitude: number, markLive = true, cityLabel?: string) {
    const lat = Math.round(latitude * 100) / 100;
    const lon = Math.round(longitude * 100) / 100;
    try {
      setOffline(false);
      const response = await fetch(`/api/air?lat=${encodeURIComponent(String(lat))}&lon=${encodeURIComponent(String(lon))}`);
      if (!response.ok) throw new Error("air unavailable");
      const result = await response.json() as AirSnapshot;
      setAir({ ...result, city: cityLabel ?? result.city });
      if (markLive) setDemo(false);
    } catch {
      setOffline(true);
    }
  }

  async function locate() {
    requestLocation();
  }

  async function handleCitySelect(city: CityResult) {
    const cityLabel = [city.name, city.admin1, city.country].filter(Boolean).join(", ");
    await fetchAir(city.latitude, city.longitude, true, cityLabel);
  }

  function offlineMessage(lang: Language) {
    return lang === "hi"
      ? "स्मार्ट मोड अभी उपलब्ध नहीं है — Gemini API सेटिंग जाँचें या सुरक्षित मूल योजना का उपयोग करें。"
      : "Smart Mode is unavailable right now. Check the Gemini API configuration; your safe baseline plan is ready.";
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
      setAnswer(result.smartMode === "offline"
        ? offlineMessage(language)
        : language === "hi"
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
      setAnswer(result.smartMode === "offline"
        ? offlineMessage(language)
        : language === "hi"
          ? "प्रश्न का उत्तर आपकी वायु स्थिति और परिवार प्रोफ़ाइल के अनुसार तैयार है।"
          : "Answer prepared for your air conditions and household profile.");
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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target?.closest('.timeline')) return;
      const container = target.closest('.timeline') as HTMLElement;
      const items = Array.from(container.querySelectorAll<HTMLElement>('.timeline-hour'));
      if (!items.length) return;
      const currentIndex = items.findIndex((el) => el === document.activeElement);
      if (currentIndex === -1) return;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        event.preventDefault();
        items[(currentIndex + 1) % items.length]?.focus();
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault();
        items[(currentIndex - 1 + items.length) % items.length]?.focus();
      } else if (event.key === 'Home') {
        event.preventDefault();
        items[0]?.focus();
      } else if (event.key === 'End') {
        event.preventDefault();
        items[items.length - 1]?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="app-shell" data-theme={theme}>
      <a href="#main-content" className="sr-only focus-visible:not-sr-only focus-visible:absolute focus-visible:top-4 focus-visible:left-4 focus-visible:z-50 focus-visible:px-4 focus-visible:py-2 focus-visible:bg-accent focus-visible:text-background focus-visible:rounded focus-visible:font-medium">
        Skip to main content
      </a>
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

      <main id="main-content">
        {demo && <div className="demo-strip"><span className="demo-dot" />{t.demo} <span>Delhi-style severe smog scenario</span></div>}
        {offline && <div className="offline-banner" role="status"><Wind size={16} aria-hidden="true" />Offline · showing your last known air snapshot</div>}

        <AirDisplay
          demo={demo}
          current={current}
          previewAqi={previewAqi}
          previewCategory={previewCategory}
          CategoryIcon={CategoryIcon}
          t={t}
          loading={loading}
          onPlanDay={planDay}
          onLocate={locate}
          onToggleFollow={() => setFollowing(!following)}
          following={following}
          locationError={locationError}
          onCitySelect={handleCitySelect}
        />

        <FamilyScenario
          scenarioActions={scenarioActions}
          scenarioImpact={scenarioImpact}
          current={current}
          profile={profile}
          onToggleAction={(id) => setScenarioActions((selected) => selected.includes(id)
            ? selected.filter((item) => item !== id)
            : [...selected, id])}
          onEditHousehold={() => setOnboarding(true)}
          onAddFamily={() => setOnboarding(true)}
        />

        <PlanRituals
          cleanestWindow={cleanestWindow}
          cleanestTime={cleanestTime}
          timeline={timeline}
          locationHour={locationHour}
          streak={streak}
          onSharePledge={sharePledge}
        />

        <AdviceSections plan={plan} />

        <ImpactSection cigarettes={cigarettes} />

        <ToolkitSection toolkit={toolkit} onToggleTool={(title) => setToolkit((items) => items.includes(title) ? items.filter((item) => item !== title) : [...items, title])} />

        <footer className="footer-notes">
          <p><strong>General guidance only.</strong> This is not medical advice. If symptoms are severe or worsen, seek qualified medical care.</p>
          <p><strong>Privacy.</strong> Location is rounded before server use. The household profile is stored only in this browser.</p>
        </footer>

        {chatOpen && (
          <ChatPanel
            loading={loading}
            message={message}
            answer={answer}
            plan={plan}
            onClose={() => setChatOpen(false)}
            onMessageChange={(value) => setMessage(value)}
            onSendChat={sendChat}
            onTipClick={(title) => setMessage(title)}
          />
        )}

        {onboarding && (
          <OnboardingModal
            onboarding={onboarding}
            step={step}
            profile={profile}
            onClose={() => setOnboarding(false)}
            onBack={() => setStep(step - 1)}
            onNext={() => setStep(step + 1)}
            onSave={saveProfile}
            onMemberToggle={(member) => setProfile({ ...profile, members: profile.members.includes(member) ? profile.members.filter((item) => item !== member) : [...profile.members, member] })}
            onHomeTypeChange={(homeType) => setProfile({ ...profile, homeType })}
            onPurifierToggle={(checked) => setProfile({ ...profile, hasPurifier: checked })}
            onCommuteChange={(commute) => setProfile({ ...profile, commute })}
            onCookingChange={(cooking) => setProfile({ ...profile, cooking })}
            onBudgetChange={(budget) => setProfile({ ...profile, budget })}
          />
        )}
      </main>

      <nav className="bottom-nav" aria-label="Main navigation">
        <a href="#air-heading">Today</a><a href="#plan">Plan</a><a href="#toolkit">Toolkit</a><a href="#community">Community</a>
      </nav>
    </div>
  );
}
