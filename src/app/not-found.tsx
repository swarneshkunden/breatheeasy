import Link from "next/link";

export default function NotFound() {
  return <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", textAlign: "center" }}><section><h1>404 · Clear a new route</h1><p>This page is outside BreatheEasy’s air map.</p><Link href="/">Return home</Link></section></main>;
}
