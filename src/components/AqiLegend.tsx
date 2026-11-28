import { copy } from "@/lib/i18n";
import type { Language } from "@/lib/types";

const categories = [
  ["good", "categoryGood"],
  ["moderate", "categoryModerate"],
  ["sensitive", "categorySensitive"],
  ["unhealthy", "categoryUnhealthy"],
  ["very-unhealthy", "categoryVeryUnhealthy"],
  ["hazardous", "categoryHazardous"],
] as const;

export function AqiLegend({ language = "en" }: { language?: Language }) {
  const t = copy[language];
  return (
    <div className="aqi-legend" aria-label={t.airCategories}>
      {categories.map(([tone, key]) => (
        <span key={tone}>
          <i
            className={`aqi-pattern aqi-${tone}`}
            data-tone={tone}
            aria-hidden="true"
          />
          {t[key]}
        </span>
      ))}
    </div>
  );
}
