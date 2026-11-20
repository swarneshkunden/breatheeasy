import type { Metadata, Viewport } from "next";
import { Fraunces, Instrument_Sans } from "next/font/google";
import "./globals.css";

const display = Fraunces({ subsets: ["latin"], variable: "--font-display", display: "swap" });
const body = Instrument_Sans({ subsets: ["latin"], variable: "--font-body", display: "swap" });

export const metadata: Metadata = {
  title: "BreatheEasy — Urban Air Quality Assistant",
  description: "Smog-smart routines, indoor air hacks, and community action for cleaner family days.",
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "BreatheEasy — Urban Air Quality Assistant",
    description: "Smog-smart routines, indoor air hacks, and community action for cleaner family days.",
    type: "website",
    url: "https://breatheeasy.example",
    images: [{ url: "/og-image.svg", width: 1200, height: 630, alt: "BreatheEasy clean air pledge" }],
  },
};

export const viewport: Viewport = { themeColor: "#161A17", width: "device-width", initialScale: 1 };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${body.variable}`}>{children}</body>
    </html>
  );
}
