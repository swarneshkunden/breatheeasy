"use client";

import { useCallback } from "react";
import { AirSnapshot, AdvicePlan, HouseholdProfile, Language } from "@/lib/types";
import { validateAdvicePlan } from "@/lib/ai/advice-validation";

interface UseChatInput {
  language: Language;
  current: AirSnapshot;
  profile: HouseholdProfile;
  onPlanReceived: (plan: AdvicePlan) => void;
}

interface UseChatReturn {
  sendChat: (message: string) => Promise<void>;
}

export function useChat({ language, current, profile, onPlanReceived }: UseChatInput): UseChatReturn {
  const sendChat = useCallback(async (message: string) => {
    if (!message.trim()) return;
    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, language, latitude: current.latitude, longitude: current.longitude, currentAqi: current.aqi, pm25: current.pm25, profile }),
      });
      if (!response.ok) throw new Error("offline");
      const result = await validateAdvicePlan(await response.json());
      onPlanReceived(result);
    } catch {
      onPlanReceived({
        lowEmission: [],
        indoor: [],
        sustainable: [],
        smartMode: "offline",
        smartModeReason: "network_error",
      });
    }
  }, [language, current, profile, onPlanReceived]);

  return {
    sendChat,
  };
}
