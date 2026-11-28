export function LandingFooter({ t }: { t: Record<string, string> }) {
  return (
    <footer className="landing-footer">
      <p>{t.footerBrand}</p>
      <p className="foot-note">{t.medicalDisclaimer}</p>
    </footer>
  );
}
