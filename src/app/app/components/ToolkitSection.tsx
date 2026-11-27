"use client";

interface ToolkitItem {
  title: string;
  cost: string;
  effect: string;
}

interface ToolkitSectionProps {
  toolkit: string[];
  onToggleTool: (title: string) => void;
}

const TOOLKIT_ITEMS: ToolkitItem[] = [
  ["Seal gaps", "Low cost", "Reduces infiltration"],
  ["Ventilate at 03:00–06:00", "Free", "Lowest demo AQI window"],
  ["Run kitchen exhaust", "Free", "Limits indoor PM2.5"],
  ["Use wet mopping", "Low cost", "Avoids dust resuspension"],
  ["Wear N95/FFP2 correctly", "Medium", "Seal and replace when damp"],
  ["Skip incense and burning", "Free", "Protects indoor air"],
].map(([title, cost, effect]) => ({ title, cost, effect }));

export function ToolkitSection({ toolkit, onToggleTool }: ToolkitSectionProps) {
  return (
    <section className="section" id="toolkit">
      <div className="section-heading"><div><p className="eyebrow">Indoor air toolkit</p><h2>Small fixes, real impact</h2></div></div>
      <div className="toolkit-grid">
        {TOOLKIT_ITEMS.map(({ title, cost, effect }) => (
          <label className={`tool ${toolkit.includes(title) ? "checked" : ""}`} key={title}>
            <input type="checkbox" checked={toolkit.includes(title)} onChange={() => onToggleTool(title)} />
            <span className="check">✓</span>
            <div><strong>{title}</strong><small>{cost} · {effect}</small></div>
          </label>
        ))}
      </div>
      <details className="glass-card"><summary>Houseplant myths vs facts</summary><p>Plants add comfort but do not replace filtration or ventilation at pollution levels typical of severe smog.</p></details>
    </section>
  );
}
