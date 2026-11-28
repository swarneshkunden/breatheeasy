import { ImageResponse } from "next/og";

export const alt = "BreatheEasy — calmer, safer air decisions for families";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background: "#161a17",
          color: "#ece7db",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "18px",
            color: "#9db8a0",
            fontSize: 28,
          }}
        >
          <svg
            width="48"
            height="48"
            viewBox="0 0 32 32"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M5 11h15c4 0 4-6 0-6-2 0-3 1-3.5 2" />
            <path d="M4 16h21c4 0 4 6 0 6-2 0-3-1-3.5-2" />
            <path d="M8 26h10" />
          </svg>
          BreatheEasy
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <div style={{ color: "#9db8a0", fontSize: 22, letterSpacing: "5px" }}>
            AIR QUALITY, MADE PRACTICAL
          </div>
          <div
            style={{
              maxWidth: "950px",
              fontSize: 68,
              lineHeight: 1.12,
              fontWeight: 600,
            }}
          >
            A calmer plan for the air around you.
          </div>
        </div>
        <div style={{ color: "#a8ab9f", fontSize: 24 }}>
          Location-aware guidance · BreatheEasy
        </div>
      </div>
    ),
    size,
  );
}
