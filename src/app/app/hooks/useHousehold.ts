"use client";

import { useCallback, useEffect, useState } from "react";
import { HouseholdProfile } from "@/lib/types";
import { profileSchema } from "@/lib/security/validation";

const defaultProfile: HouseholdProfile = {
  members: ["kids", "adults"],
  homeType: "apartment",
  hasAc: true,
  hasPurifier: false,
  windows: "sealed",
  commute: "metro",
  cooking: "lpg",
  budget: "medium",
};

interface UseHouseholdReturn {
  profile: HouseholdProfile;
  setProfile: (profile: HouseholdProfile) => void;
  toggleMember: (member: HouseholdProfile["members"][number]) => void;
  setHomeType: (homeType: HouseholdProfile["homeType"]) => void;
  setPurifier: (checked: boolean) => void;
  setCommute: (commute: HouseholdProfile["commute"]) => void;
  setCooking: (cooking: HouseholdProfile["cooking"]) => void;
  setBudget: (budget: HouseholdProfile["budget"]) => void;
  saveProfile: () => void;
}

export function useHousehold(): UseHouseholdReturn {
  const [profile, setProfileState] = useState<HouseholdProfile>(defaultProfile);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("breatheeasy-profile");
      if (saved) {
        const parsed = profileSchema.safeParse(JSON.parse(saved));
        if (parsed.success) setProfileState(parsed.data);
      }
    } catch {
      // Corrupted local storage: keep defaults.
    }
  }, []);

  const setProfile = useCallback((next: HouseholdProfile) => {
    setProfileState(next);
  }, []);

  const toggleMember = useCallback((member: HouseholdProfile["members"][number]) => {
    setProfileState((prev) => ({
      ...prev,
      members: prev.members.includes(member)
        ? prev.members.filter((item) => item !== member)
        : [...prev.members, member],
    }));
  }, []);

  const setHomeType = useCallback((homeType: HouseholdProfile["homeType"]) => {
    setProfileState((prev) => ({ ...prev, homeType }));
  }, []);

  const setPurifier = useCallback((checked: boolean) => {
    setProfileState((prev) => ({ ...prev, hasPurifier: checked }));
  }, []);

  const setCommute = useCallback((commute: HouseholdProfile["commute"]) => {
    setProfileState((prev) => ({ ...prev, commute }));
  }, []);

  const setCooking = useCallback((cooking: HouseholdProfile["cooking"]) => {
    setProfileState((prev) => ({ ...prev, cooking }));
  }, []);

  const setBudget = useCallback((budget: HouseholdProfile["budget"]) => {
    setProfileState((prev) => ({ ...prev, budget }));
  }, []);

  const saveProfile = useCallback(() => {
    localStorage.setItem("breatheeasy-profile", JSON.stringify(profile));
  }, [profile]);

  return {
    profile,
    setProfile,
    toggleMember,
    setHomeType,
    setPurifier,
    setCommute,
    setCooking,
    setBudget,
    saveProfile,
  };
}
