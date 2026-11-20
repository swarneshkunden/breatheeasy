"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", textAlign: "center" }}><section><h1>We hit a rough patch</h1><p>BreatheEasy is keeping its baseline guidance available.</p><button onClick={reset}>Try again</button></section></main>;
}
