import AppClient from "./AppClient";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Family Air Quality Dashboard",
  description:
    "Check current air quality, plan family routines, and get evidence-based guidance.",
};

export default async function AppPage() {
  const cookieStore = await cookies();
  const initialLanguage =
    cookieStore.get("breatheeasy-language")?.value === "hi" ? "hi" : "en";
  const themeValue = cookieStore.get("breatheeasy-theme")?.value;
  const initialTheme =
    themeValue === "light" || themeValue === "dark" ? themeValue : "system";
  return (
    <AppClient initialLanguage={initialLanguage} initialTheme={initialTheme} />
  );
}
