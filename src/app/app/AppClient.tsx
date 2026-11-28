"use client";

import { Wind } from "lucide-react";
import { useHomeState } from "@/app/app/hooks/useHomeState";
import { AirDisplay } from "./components/AirDisplay";
import { FamilyScenario } from "./components/FamilyScenario";
import { PlanRituals } from "./components/PlanRituals";
import { AdviceSections } from "./components/AdviceSections";
import { ImpactSection } from "./components/ImpactSection";
import { ToolkitSection } from "./components/ToolkitSection";
import { ChatPanel } from "./components/ChatPanel";
import { OnboardingModal } from "./components/OnboardingModal";
import { BrandMark } from "@/components/BrandMark";
import { PreferenceControls } from "@/components/PreferenceControls";

export default function Home({
  initialLanguage = "en",
  initialTheme = "system",
}: {
  initialLanguage?: "en" | "hi";
  initialTheme?: "light" | "dark" | "system";
}) {
  const {
    language,
    setLanguage,
    demo,
    setDemo,
    profile,
    onboarding,
    modalRef,
    setOnboarding,
    step,
    setStep,
    offline,
    plan,
    chatOpen,
    setChatOpen,
    message,
    setMessage,
    answer,
    loading,
    streak,
    toolkit,
    scenarioActions,
    theme,
    messages,
    previewAqi,
    current,
    t,
    cigarettes,
    previewCategory,
    CategoryIcon,
    scenarioImpact,
    cleanestTime,
    timeline,
    locationHour,
    following,
    locationError,
    setFollowing,
    locating,
    locate,
    handleCitySelect,
    planDay,
    sendChat,
    saveProfile,
    sharePledge,
    toggleScenarioAction,
    toggleTool,
    toggleMember,
    setHomeType,
    setPurifier,
    setCommute,
    setCooking,
    setBudget,
    themePreference,
    setThemePreference,
  } = useHomeState({ language: initialLanguage, theme: initialTheme });

  return (
    <div className="app-shell" data-theme={theme}>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <header className="topbar">
        <button
          className="brand"
          aria-label="BreatheEasy home"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <span className="brand-mark">
            <BrandMark />
          </span>
          <span>BreatheEasy</span>
        </button>
        <div className="top-actions">
          <PreferenceControls
            initialLanguage={initialLanguage}
            initialTheme={initialTheme}
            language={language}
            theme={themePreference}
            onLanguageChange={setLanguage}
            onThemeChange={setThemePreference}
          />
        </div>
      </header>

      <main id="main-content">
        <div className="demo-strip">
          <div className="demo-status" role="status">
            <span
              className={demo ? "demo-dot" : "live-mark"}
              aria-hidden="true"
            />
            {demo
              ? t.demoPrompt
              : current.source === "unavailable"
                ? t.noLocationPrompt
                : t.livePrompt}
          </div>
          <label className="demo-toggle">
            <input
              type="checkbox"
              role="switch"
              checked={demo}
              onChange={(event) => setDemo(event.target.checked)}
              aria-label={t.demo}
            />
            <span>{t.demo}</span>
          </label>
        </div>
        {offline && (
          <div className="offline-banner" role="status">
            <Wind size={16} aria-hidden="true" />
            {t.offlineBanner}
          </div>
        )}

        <AirDisplay
          demo={demo}
          current={current}
          previewAqi={previewAqi}
          previewCategory={previewCategory}
          CategoryIcon={CategoryIcon}
          t={t}
          language={language}
          loading={loading}
          locating={locating}
          onPlanDay={() => {
            void planDay();
          }}
          onLocate={locate}
          onToggleFollow={() => setFollowing(!following)}
          following={following}
          locationError={locationError}
          onCitySelect={(city) => {
            void handleCitySelect(city);
          }}
        />

        <FamilyScenario
          scenarioActions={scenarioActions}
          scenarioImpact={scenarioImpact}
          current={current}
          profile={profile}
          language={language}
          onToggleAction={toggleScenarioAction}
          onEditHousehold={() => setOnboarding(true)}
          onAddFamily={() => setOnboarding(true)}
        />

        <PlanRituals
          cleanestTime={cleanestTime}
          currentAqi={current.aqi}
          timeline={timeline}
          locationHour={locationHour}
          utcOffsetSeconds={current.utcOffsetSeconds}
          language={language}
          streak={streak}
          onSharePledge={() => {
            void sharePledge();
          }}
          onEditHousehold={() => {
            setStep(0);
            setOnboarding(true);
          }}
          onAddFamily={() => {
            setStep(0);
            setOnboarding(true);
          }}
        />

        <AdviceSections plan={plan} language={language} />

        <ImpactSection cigarettes={cigarettes} language={language} />

        <ToolkitSection
          toolkit={toolkit}
          air={current}
          language={language}
          onToggleTool={toggleTool}
        />

        <footer className="footer-notes">
          <p>
            <strong>{t.generalGuidance}</strong> {t.medicalDisclaimer}
          </p>
          <p>
            <strong>{t.privacyHeading}</strong> {t.privacyDescription}
          </p>
        </footer>

        {chatOpen && (
          <ChatPanel
            loading={loading}
            message={message}
            answer={answer}
            messages={messages}
            plan={plan}
            onClose={() => setChatOpen(false)}
            onMessageChange={(value) => setMessage(value)}
            onSendChat={(text) => {
              void sendChat(text);
            }}
          />
        )}

        {onboarding && (
          <OnboardingModal
            onboarding={onboarding}
            modalRef={modalRef}
            step={step}
            profile={profile}
            onClose={() => setOnboarding(false)}
            onBack={() => setStep(step - 1)}
            onNext={() => setStep(step + 1)}
            onSave={() => {
              void saveProfile();
            }}
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
        <a href="#air-heading">Today</a>
        <a href="#plan">Plan</a>
        <a href="#toolkit">Toolkit</a>
        <a href="#community">Community</a>
      </nav>
    </div>
  );
}
