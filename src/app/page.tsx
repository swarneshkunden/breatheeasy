import { HeroSection } from "@/components/HeroSection";
import { HowItWorksSection } from "@/components/HowItWorksSection";
import { WhatYouGetSection } from "@/components/WhatYouGetSection";
import { PrivacyStrip } from "@/components/PrivacyStrip";
import { LandingFooter } from "@/components/LandingFooter";

export const metadata = {
  title: "BreatheEasy — Urban Air Quality Assistant",
  description: "Smog-smart routines, indoor air hacks, and community action for cleaner family days.",
};

export default function LandingPage() {
  return (
    <div className="landing-shell">
      <a href="#hero-heading" className="skip-link">Skip to main content</a>
      <header className="landing-header">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">*</span>
          <span>BreatheEasy</span>
        </div>
        <a href="/app" className="button button-primary">
          Check my air
        </a>
      </header>
      <HeroSection />
      <HowItWorksSection />
      <WhatYouGetSection />
      <PrivacyStrip />
      <LandingFooter />
    </div>
  );
}