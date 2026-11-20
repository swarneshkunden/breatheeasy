"use memo";

import { memo } from "react";
import { skyLayerMix, visibilityKm } from "@/lib/presentation";

interface LivingSkylineProps {
  aqi: number;
  city: string;
}

function LivingSkylineView({ aqi, city }: LivingSkylineProps) {
  const colors = skyLayerMix(aqi);
  const visibility = visibilityKm(aqi);

  return (
    <div className="skyline-column">
      <div className="skyline" role="img" aria-label={`Illustrated skyline for ${city} at preview AQI ${aqi}`}>
        <svg viewBox="0 0 680 260" preserveAspectRatio="xMidYMax slice" role="img" aria-labelledby="skyline-title skyline-desc">
          <title id="skyline-title">Living city skyline</title>
          <desc id="skyline-desc">A distant city, dome, houses, and trees fade as AQI rises.</desc>
          <rect width="680" height="260" fill={colors.sky} />
          <circle cx="566" cy="55" r="22" fill="#F2D8A2" opacity={colors.sunOpacity} />

          <g fill={colors.far} opacity={aqi > 300 ? 0.42 : aqi > 200 ? 0.62 : 0.82}>
            <rect x="24" y="96" width="37" height="118" />
            <rect x="74" y="70" width="28" height="144" />
            <rect x="118" y="108" width="48" height="106" />
            <rect x="184" y="82" width="34" height="132" />
            <rect x="238" y="102" width="52" height="112" />
            <rect x="312" y="74" width="38" height="140" />
            <rect x="370" y="112" width="44" height="102" />
            <rect x="432" y="84" width="31" height="130" />
            <rect x="486" y="118" width="50" height="96" />
            <rect x="554" y="78" width="42" height="136" />
            <rect x="616" y="106" width="38" height="108" />
          </g>

          <g fill={colors.mid}>
            <rect x="0" y="170" width="76" height="90" />
            <rect x="88" y="142" width="58" height="118" />
            <rect x="158" y="164" width="72" height="96" />
            <rect x="240" y="126" width="56" height="134" />
            <rect x="307" y="158" width="76" height="102" />
            <rect x="394" y="136" width="63" height="124" />
            <rect x="468" y="168" width="78" height="92" />
            <rect x="558" y="148" width="58" height="112" />
            <rect x="628" y="172" width="52" height="88" />
            <path d="M266 160a39 39 0 0 1 78 0v43h-78z" />
            <rect x="300" y="128" width="10" height="20" />
            <rect x="303" y="118" width="4" height="12" />
          </g>

          <g fill={colors.near}>
            <rect x="0" y="220" width="680" height="40" />
            <rect x="48" y="196" width="74" height="24" />
            <rect x="132" y="202" width="54" height="18" />
            <rect x="506" y="194" width="70" height="26" />
            <rect x="588" y="204" width="48" height="16" />
            <circle cx="224" cy="198" r="18" />
            <circle cx="246" cy="205" r="13" />
            <circle cx="412" cy="198" r="20" />
            <circle cx="436" cy="207" r="12" />
          </g>
          <rect width="680" height="260" fill="#76655A" opacity={Math.min(0.38, 0.03 + aqi / 1100)} />
        </svg>
      </div>
      <p className="sr-only">The distant skyline, dome, houses, trees, and haze are an illustrated AQI preview for {city}. The visible label is an approximation, not a measured reading.</p>
      <div className="skyline-caption">
        <span>THE LIVING SKYLINE</span>
        <span>You can see about <strong>{visibility.toFixed(1)} km</strong> today</span>
      </div>
      <p className="assumption-note">Approximation: AQI 0–400 visibility formula, not a meteorological reading.</p>
    </div>
  );
}

export const LivingSkyline = memo(LivingSkylineView);
