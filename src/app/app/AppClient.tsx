"use client";

import { Wind, CloudFog, Cloud, CloudSun, ShieldAlert, Sun } from "lucide-react";
import { useHomeState } from "@/app/app/hooks/useHomeState";
import { AirDisplay } from "./components/AirDisplay";
import { FamilyScenario } from "./components/FamilyScenario";
import { PlanRituals } from "./components/PlanRituals";
import { AdviceSections } from "./components/AdviceSections";
import { ImpactSection } from "./components/ImpactSection";
import { ToolkitSection } from "./components/ToolkitSection";
import { ChatPanel } from "./components/ChatPanel";
import { OnboardingModal } from "./components/OnboardingModal";

export default function Home() {
  const {
    language, setLanguage, demo, setDemo, air, profile, onboarding, setOnboarding,
    step, setStep, offline, plan, chatOpen, setChatOpen, message, setMessage,
    answer, loading, setLoading, streak, toolkit, scenarioActions, theme, setTheme,
    previewAqi, current, t, cigarettes, previewCategory, CategoryIcon,
    scenarioImpact, cleanestWindow, cleanestTime, timeline, locationHour, following, locationError, setFollowing,
    fetchAir, locate, handleCitySelect, planDay, sendChat, saveProfile, sharePledge,
    toggleScenarioAction, toggleTool, toggleMember, setHomeType, setPurifier,
    setCommute, setCooking, setBudget,
  } = useHomeState();

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
            <input type="checkbox" checked={demo} onChange={(event) => setDemo(event.target.checked)} aria-label="Demo mode" />
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
          onToggleAction={toggleScenarioAction}
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

        <ToolkitSection toolkit={toolkit} onToggleTool={toggleTool} />

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
            onMemberToggle={toggleMember}
            onHomeTypeChange={setHomeType}
            onPurifierToggle={setPurifier}
            onCommuteChange={setCommute}
            onCookingChange={setCooking}
            onBudgetChange={setBudget}
          />
        )}
      </main>

      <nav className="bottom-nav" aria-label="Main navigation">
        <a href="#air-heading">Today</a><a href="#plan">Plan</a><a href="#toolkit">Toolkit</a><a href="#community">Community</a>
      </nav>
    </div>
  );
}
