"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Cloud, CloudFog, CloudSun, ShieldAlert, Sun, Wind, type LucideIcon } from "lucide-react";
import { copy } from "@/lib/i18n";
import { AirSnapshot, AdvicePlan, CityResult, HouseholdProfile, Language, type HourlyAir } from "@/lib/types";
import { categorizeAqi } from "@/lib/rules/engine";
import { exposureCigarettes } from "@/lib/impact/calculator";
import { validateAdvicePlan } from "@/lib/ai/advice-validation";
import { useAirData } from "./useAirData";
import { useHousehold } from "./useHousehold";
import { usePlan } from "./usePlan";
import { useChat } from "./useChat";
import { useScenario } from "./useScenario";

interface UseHomeStateReturn {
  language: Language;
  setLanguage: (lang: Language) => void;
  demo: boolean;
  setDemo: (demo: boolean) => void;
  air: AirSnapshot;
  profile: HouseholdProfile;
  onboarding: boolean;
  setOnboarding: (onboarding: boolean) => void;
  step: number;
  setStep: (step: number) => void;
  offline: boolean;
  plan: AdvicePlan;
  chatOpen: boolean;
  setChatOpen: (open: boolean) => void;
  message: string;
  setMessage: (msg: string) => void;
  answer: string;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  streak: number;
  toolkit: string[];
  scenarioActions: string[];
  theme: "morning" | "dusk";
  setTheme: (theme: "morning" | "dusk") => void;
  previewAqi: number;
  current: AirSnapshot;
  t: Record<string, string>;
  cigarettes: number;
  previewCategory: ReturnType<typeof categorizeAqi>;
  CategoryIcon: LucideIcon;
  scenarioImpact: { exposure: number; exposureReduction: number; co2AvoidedG: number };
  cleanestWindow: { hour: { time: string; aqi: number } } | null;
  cleanestTime: string;
  timeline: HourlyAir[];
  locationHour: number;
  fetchAir: (latitude: number, longitude: number, markLive?: boolean, cityLabel?: string) => Promise<void>;
  locate: () => void;
  handleCitySelect: (city: CityResult) => void;
  planDay: () => Promise<void>;
  sendChat: () => Promise<void>;
  saveProfile: () => void;
  toggleScenarioAction: (id: string) => void;
  toggleTool: (title: string) => void;
  toggleMember: (member: HouseholdProfile["members"][number]) => void;
  setHomeType: (homeType: HouseholdProfile["homeType"]) => void;
  setPurifier: (checked: boolean) => void;
  setCommute: (commute: HouseholdProfile["commute"]) => void;
  setCooking: (cooking: HouseholdProfile["cooking"]) => void;
  setBudget: (budget: HouseholdProfile["budget"]) => void;
  sharePledge: () => Promise<void>;
}

export function useHomeState(): UseHomeStateReturn {
  const [language, setLanguage] = useState<Language>("en");
  const [theme, setTheme] = useState<"morning" | "dusk">("dusk");
  const [streak, setStreak] = useState(4);
  const [onboarding, setOnboarding] = useState(false);
  const [step, setStep] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  const { demo, setDemo, air, current, fetchAir, locate, handleCitySelect, offline, timeline, locationHour } = useAirData();
  const { profile, toggleMember, setHomeType, setPurifier, setCommute, setCooking, setBudget, saveProfile } = useHousehold();
  const { plan, setPlan, previewAqi, previewCategory, scenarioImpact, cleanestWindow, cleanestTime, toggleScenarioAction, scenarioActions } = usePlan({ language, demo, air, profile });
  const { toolkit, toggleTool } = useScenario();
  const { sendChat: chatSendChat, onTipClick } = useChat({
    language,
    current,
    profile,
    onPlanReceived: (result: AdvicePlan) => {
      const isOffline = result.smartMode === "offline";
      const isHindi = language === "hi";
      setPlan(result);
      setAnswer(
        isOffline
          ? isHindi
            ? "आपका व्यक्तिगत योजना तैयार है। सबसे साफ़ घंटे में बाहर जाएं और फिल्टर की हवा का लाभ लें।"
            : "Your personalized plan is ready. Use the cleanest hours, keep vulnerable members indoors, and ventilate briefly."
          : isHindi
            ? "स्मार्ट मोड अभी उपलब्ध नहीं है — Gemini API सेटिंग जाँचें या सुरक्षित मूल योजना का उपयोग करें।"
            : "Smart Mode is unavailable right now. Check the Gemini API configuration; your safe baseline plan is ready.",
      );
    },
  });

  useEffect(() => {
    if (onboarding && modalRef.current) {
      const active = document.activeElement;
      previousActiveElement.current = active instanceof HTMLElement ? active : null;
      const focusable = modalRef.current.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      focusable?.focus();
    } else if (!onboarding && previousActiveElement.current) {
      previousActiveElement.current.focus();
      previousActiveElement.current = null;
    }
  }, [onboarding]);

  useEffect(() => {
    if (!chatOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setChatOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [chatOpen]);

  useEffect(() => {
    if (!chatOpen) return;
    const panel = document.querySelector<HTMLElement>('.chat-panel');
    if (!panel) return;
    const focusableSelect = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const focusableElements = panel.querySelectorAll<HTMLElement>(focusableSelect);
    let focusIndex = 0;
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
      event.preventDefault();
      if (event.key === "ArrowDown") {
        focusIndex = Math.min(focusIndex + 1, focusableElements.length - 1);
        focusableElements[focusIndex]?.focus();
      } else if (event.key === "ArrowUp") {
        focusIndex = Math.max(focusIndex - 1, 0);
        focusableElements[focusIndex]?.focus();
      }
    };
    panel.addEventListener("keydown", handleKeydown);
    return () => panel.removeEventListener("keydown", handleKeydown);
  }, [chatOpen]);

  const t = copy[language];
  const cigarettes = exposureCigarettes(current.pm25);

  const aqiIcons: Record<string, LucideIcon> = {
    good: Sun,
    moderate: CloudSun,
    sensitive: Cloud,
    unhealthy: Wind,
    "very-unhealthy": CloudFog,
    hazardous: ShieldAlert,
  };
  const CategoryIcon = aqiIcons[previewCategory.tone] ?? Cloud;

  const planDay = useCallback(async () => {
    setLoading(true);
    setChatOpen(true);
    setAnswer("");
    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "Plan my day for my family",
          language,
          latitude: current.latitude,
          longitude: current.longitude,
          currentAqi: current.aqi,
          pm25: current.pm25,
          profile,
        }),
      });
      if (!response.ok) throw new Error("offline");
      const body = await response.json();
      const validated = validateAdvicePlan(body);
      setPlan(validated);
      const isOffline = validated.smartMode === "offline";
      const isHindi = language === "hi";
      setAnswer(
        isOffline
          ? isHindi
            ? "आपका व्यक्तिगत योजना तैयार है। सबसे साफ़ घंटे में बाहर जाएं और फिल्टर की हवा का लाभ लें।"
            : "Your personalized plan is ready. Use the cleanest hours, keep vulnerable members indoors, and ventilate briefly."
          : isHindi
            ? "स्मार्ट मोड अभी उपलब्ध नहीं है — Gemini API सेटिंग जाँचें या सुरक्षित मूल योजना का उपयोग करें।"
            : "Smart Mode is unavailable right now. Check the Gemini API configuration; your safe baseline plan is ready.",
      );
    } catch {
      setAnswer(
        language === "hi"
          ? "स्मार्ट मोड ऑफ़लाइन है — सुरक्षित मूल योजना आपके लिए तैयार है।"
          : "Smart Mode offline — a safe baseline plan is ready for you.",
      );
    } finally {
      setLoading(false);
    }
  }, [language, current, profile, setLoading, setChatOpen, setAnswer, setPlan]);

  const sharePledge = useCallback(async () => {
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1080;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.fillStyle = "#FBF8F2";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = "#DDD5C6";
    context.lineWidth = 2;
    context.strokeRect(48, 48, 984, 984);
    context.fillStyle = "#23291F";
    context.font = "700 64px Georgia";
    context.fillText("Clean Air Pledge", 104, 180);
    context.font = "500 38px Georgia";
    context.fillText("A calmer week, one choice at a time.", 104, 240);
    context.fillStyle = "#4F6F58";
    context.font = "700 164px Georgia";
    context.fillText(`${scenarioImpact.co2AvoidedG * 7}`, 104, 520);
    context.fillStyle = "#23291F";
    context.font = "600 34px sans-serif";
    context.fillText("grams of CO₂ avoided this week*", 104, 570);
    context.font = "500 28px sans-serif";
    context.fillStyle = "#5B6155";
    context.fillText("Carpool day  ·  No burning  ·  Dust control", 104, 690);
    context.fillText("School activity  ·  BreatheEasy", 104, 738);
    context.font = "20px sans-serif";
    context.fillText("*Approximate planning estimate, not a lifecycle assessment.", 104, 930);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    const text = "My BreatheEasy Clean Air Pledge: a lower-emission commute, cleaner indoor air, and neighborhood care.";
    if (blob && navigator.share && navigator.canShare) {
      const file = new File([blob], "breatheeasy-clean-air-pledge.png", { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title: "BreatheEasy Clean Air Pledge", text, files: [file] });
        return;
      }
    }
    if (blob) {
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = "breatheeasy-clean-air-pledge.png";
      link.click();
    }
    await navigator.clipboard?.writeText(text);
  }, [scenarioImpact]);

  const sendChat = useCallback(async () => {
    if (!message.trim()) return;
    setLoading(true);
    setAnswer("");
    const question = message;
    setMessage("");
    await chatSendChat(question);
    setLoading(false);
  }, [message, chatSendChat, setLoading, setAnswer, setMessage]);

  return {
    language,
    setLanguage,
    demo,
    setDemo,
    air,
    profile,
    onboarding,
    setOnboarding,
    step,
    setStep,
    offline,
    plan,
    chatOpen,
    setChatOpen,
    message,
    setMessage,
    answer,
    loading,
    setLoading,
    streak,
    toolkit,
    scenarioActions,
    theme,
    setTheme,
    previewAqi,
    current,
    t,
    cigarettes,
    previewCategory,
    CategoryIcon,
    scenarioImpact,
    cleanestWindow,
    cleanestTime,
    timeline,
    locationHour,
    fetchAir,
    locate,
    handleCitySelect,
    planDay,
    sendChat,
    saveProfile,
    sharePledge,
    toggleScenarioAction,
    toggleTool,
    toggleMember,
    setHomeType,
    setPurifier,
    setCommute,
    setCooking,
    setBudget,
  };
}
