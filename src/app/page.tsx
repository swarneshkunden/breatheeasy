import { HeroSection } from "@/components/HeroSection";
import { HowItWorksSection } from "@/components/HowItWorksSection";
import { WhatYouGetSection } from "@/components/WhatYouGetSection";
import { PrivacyStrip } from "@/components/PrivacyStrip";
import { LandingFooter } from "@/components/LandingFooter";
import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";
import { PreferenceControls } from "@/components/PreferenceControls";
import { cookies } from "next/headers";
import { copy } from "@/lib/i18n";

export const metadata = {
  title: "Family Clean Air Guidance",
  description:
    "Understand local air quality and build practical, safer routines for your family.",
};

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const cookieStore = await cookies();
  const language =
    cookieStore.get("breatheeasy-language")?.value === "hi" ? "hi" : "en";
  const themeValue = cookieStore.get("breatheeasy-theme")?.value;
  const theme =
    themeValue === "light" || themeValue === "dark" ? themeValue : "system";
  const t = copy[language];

  return (
    <div className="landing-shell">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <header className="landing-header">
        <Link href="/" className="landing-brand">
          <span className="landing-brand-mark">
            <BrandMark />
          </span>
          <span>BreatheEasy</span>
        </Link>
        <a href="/app" className="landing-button landing-button-primary">
          {t.checkMyAir}
        </a>
        <PreferenceControls initialLanguage={language} initialTheme={theme} />
      </header>
      <main className="landing-main" id="main-content">
        <HeroSection t={t} />
        <HowItWorksSection t={t} />
        <WhatYouGetSection t={t} />
        <PrivacyStrip t={t} />
      </main>
      <LandingFooter t={t} />
    </div>
  );
}
