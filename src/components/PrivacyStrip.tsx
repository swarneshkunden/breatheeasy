export function PrivacyStrip({ t }: { t: Record<string, string> }) {
  return (
    <div className="landing-privacy-strip">
      <p>
        <strong>{t.privacy}</strong> {t.privacyDescription}
      </p>
    </div>
  );
}
