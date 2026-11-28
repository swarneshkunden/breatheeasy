import type { Metadata, Viewport } from "next";
import {
  Fraunces,
  Instrument_Sans,
  Noto_Sans_Devanagari,
} from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});
const body = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});
const devanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  variable: "--font-devanagari",
  display: "swap",
});
const PRODUCTION_URL =
  "https://breatheeasy-urban-air-quality-assistant.vercel.app";

export const metadata: Metadata = {
  title: {
    default: "BreatheEasy — Urban Air Quality Assistant",
    template: "%s | BreatheEasy",
  },
  description:
    "Location-aware air quality and safer daily routines for families.",
  manifest: "/manifest.webmanifest",
  metadataBase: new URL(PRODUCTION_URL),
  openGraph: {
    title: "BreatheEasy — Urban Air Quality Assistant",
    description:
      "Location-aware air quality and safer daily routines for families.",
    type: "website",
    url: PRODUCTION_URL,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "BreatheEasy clean air guidance",
      },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#161A17",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const language =
    cookieStore.get("breatheeasy-language")?.value === "hi" ? "hi" : "en";
  const theme = cookieStore.get("breatheeasy-theme")?.value;
  const themeAttribute =
    theme === "light" ? "morning" : theme === "dark" ? "dusk" : "system";
  const colorScheme =
    theme === "light" ? "light" : theme === "dark" ? "dark" : "light dark";

  return (
    <html lang={language} data-theme={themeAttribute} style={{ colorScheme }}>
      <body
        className={`${display.variable} ${body.variable} ${devanagari.variable}`}
      >
        {children}
      </body>
    </html>
  );
}
