"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import {
  Cloud,
  CloudFog,
  CloudSun,
  ShieldAlert,
  Sun,
  Wind,
  type LucideIcon,
} from "lucide-react";
import { copy } from "@/lib/i18n";
import {
  AirSnapshot,
  AdvicePlan,
  CityResult,
  HouseholdProfile,
  Language,
  type HourlyAir,
} from "@/lib/types";
import { categorizeAqi } from "@/lib/rules/engine";
import { exposureCigarettes } from "@/lib/impact/calculator";
import { useAirData } from "./useAirData";
import { useHousehold } from "./useHousehold";
import { usePlan } from "./usePlan";
import { useChat } from "./useChat";
import { useScenario } from "./useScenario";
import { incrementPledgeCount, readPledgeCount } from "@/lib/pledge-counter";

interface UseHomeStateReturn {
  language: Language;
  setLanguage: (lang: Language) => void;
  demo: boolean;
  setDemo: (demo: boolean) => void;
  air: AirSnapshot;
  profile: HouseholdProfile;
  onboarding: boolean;
  modalRef: RefObject<HTMLDialogElement | null>;
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
  theme: "morning" | "dusk" | "system";
  themePreference: "light" | "dark" | "system";
  setThemePreference: (theme: "light" | "dark" | "system") => void;
  previewAqi: number | null;
  current: AirSnapshot;
  t: Record<string, string>;
  cigarettes: number | null;
  previewCategory: ReturnType<typeof categorizeAqi>;
  CategoryIcon: LucideIcon;
  scenarioImpact: {
    exposure: number;
    exposureReduction: number;
    co2AvoidedG: number;
  };
  cleanestWindow: { hour: { time: string; aqi: number | null } } | null;
  cleanestTime: string;
  timeline: HourlyAir[];
  locationHour: number;
  following: boolean;
  locationError: string | null;
  locating: boolean;
  setFollowing: (active: boolean) => void;
  fetchAir: (
    latitude: number,
    longitude: number,
    markLive?: boolean,
    cityLabel?: string,
  ) => Promise<boolean>;
  locate: () => void;
  handleCitySelect: (city: CityResult) => void;
  planDay: () => Promise<void>;
  sendChat: (question?: string) => Promise<void>;
  messages: ChatMessage[];
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

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export function useHomeState(
  initialPreferences: {
    language: Language;
    theme: "light" | "dark" | "system";
  } = { language: "en", theme: "system" },
): UseHomeStateReturn {
  const [language, setLanguageState] = useState<Language>(
    initialPreferences.language,
  );
  const [themePreference, setThemePreferenceState] = useState<
    "light" | "dark" | "system"
  >(initialPreferences.theme);
  const theme =
    themePreference === "light"
      ? "morning"
      : themePreference === "dark"
        ? "dusk"
        : "system";
  const [streak, setStreak] = useState(0);
  const [onboarding, setOnboarding] = useState(false);
  const [step, setStep] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [answer, setAnswer] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const modalRef = useRef<HTMLDialogElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const previousChatElement = useRef<HTMLElement | null>(null);

  const {
    demo,
    setDemo,
    air,
    current,
    fetchAir,
    locate,
    handleCitySelect,
    offline,
    timeline,
    locationHour,
    following,
    locating,
    locationError,
    setFollowing,
  } = useAirData(language);
  const {
    profile,
    toggleMember,
    setHomeType,
    setPurifier,
    setCommute,
    setCooking,
    setBudget,
    saveProfile,
  } = useHousehold();
  const {
    plan,
    setPlan,
    previewAqi,
    previewCategory,
    scenarioImpact,
    cleanestWindow,
    cleanestTime,
    toggleScenarioAction,
    scenarioActions,
  } = usePlan({ language, demo, air, profile });
  const { toolkit, toggleTool } = useScenario();

  const setLanguage = useCallback((nextLanguage: Language) => {
    setLanguageState(nextLanguage);
    document.documentElement.lang = nextLanguage;
    document.cookie = `breatheeasy-language=${nextLanguage}; path=/; max-age=31536000; samesite=lax`;
  }, []);

  const setThemePreference = useCallback(
    (nextTheme: "light" | "dark" | "system") => {
      setThemePreferenceState(nextTheme);
      const root = document.documentElement;
      root.dataset.theme =
        nextTheme === "light"
          ? "morning"
          : nextTheme === "dark"
            ? "dusk"
            : "system";
      root.style.colorScheme =
        nextTheme === "light"
          ? "light"
          : nextTheme === "dark"
            ? "dark"
            : "light dark";
      document.cookie = `breatheeasy-theme=${nextTheme}; path=/; max-age=31536000; samesite=lax`;
    },
    [],
  );

  useEffect(() => {
    setStreak(readPledgeCount(localStorage));
  }, []);

  const saveAndCloseProfile = useCallback(() => {
    saveProfile();
    setOnboarding(false);
  }, [saveProfile]);
  const { sendChat: chatSendChat } = useChat({
    language,
    current,
    profile,
    onPlanReceived: (result: AdvicePlan) => {
      setPlan(result);
      setAnswer(result.answer);
      setMessages((existing) => [
        ...existing,
        { role: "assistant", content: result.answer },
      ]);
    },
  });

  useEffect(() => {
    if (onboarding && modalRef.current) {
      const active = document.activeElement;
      previousActiveElement.current =
        active instanceof HTMLElement ? active : null;
      const focusable = modalRef.current.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
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
    if (chatOpen) {
      if (!previousChatElement.current) {
        const active = document.activeElement;
        previousChatElement.current =
          active instanceof HTMLElement ? active : null;
      }
      return;
    }
    previousChatElement.current?.focus();
    previousChatElement.current = null;
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
    const active = document.activeElement;
    previousChatElement.current = active instanceof HTMLElement ? active : null;
    setLoading(true);
    setChatOpen(true);
    setAnswer("");
    const question =
      language === "hi"
        ? "मेरे परिवार के लिए दिन की योजना बनाएं"
        : "Plan my day for my family";
    setMessages((existing) => [
      ...existing,
      { role: "user", content: question },
    ]);
    await chatSendChat(question);
    setLoading(false);
  }, [language, chatSendChat]);

  const sharePledge = useCallback(async () => {
    setStreak(incrementPledgeCount(localStorage));
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
    context.fillText(
      "*Approximate planning estimate, not a lifecycle assessment.",
      104,
      930,
    );
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/png"),
    );
    const text =
      "My BreatheEasy Clean Air Pledge: a lower-emission commute, cleaner indoor air, and neighborhood care.";
    if (blob && navigator.share && navigator.canShare) {
      const file = new File([blob], "breatheeasy-clean-air-pledge.png", {
        type: "image/png",
      });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: "BreatheEasy Clean Air Pledge",
          text,
          files: [file],
        });
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

  const sendChat = useCallback(
    async (suggestedQuestion?: string) => {
      const question = (suggestedQuestion ?? message).trim();
      if (!question) return;
      setLoading(true);
      setAnswer("");
      setMessages((existing) => [
        ...existing,
        { role: "user", content: question },
      ]);
      setMessage("");
      await chatSendChat(question);
      setLoading(false);
    },
    [message, chatSendChat, setLoading, setAnswer, setMessage],
  );

  return {
    language,
    setLanguage,
    demo,
    setDemo,
    air,
    profile,
    onboarding,
    modalRef,
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
    messages,
    loading,
    setLoading,
    streak,
    toolkit,
    scenarioActions,
    theme,
    themePreference,
    setThemePreference,
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
    following,
    locationError,
    locating,
    setFollowing,
    fetchAir,
    locate,
    handleCitySelect,
    planDay,
    sendChat,
    saveProfile: saveAndCloseProfile,
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
