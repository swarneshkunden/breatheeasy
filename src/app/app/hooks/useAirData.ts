"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { demoAir } from "@/lib/air/demo";
import { AirSnapshot, type HourlyAir } from "@/lib/types";
import { useLocation } from "@/hooks/useLocation";
import { formatLocationLabel } from "@/lib/location";
import { validateAirSnapshot } from "@/lib/ai/air-validation";

interface UseAirDataReturn {
  demo: boolean;
  setDemo: (demo: boolean) => void;
  air: AirSnapshot;
  current: AirSnapshot;
  fetchAir: (latitude: number, longitude: number, markLive?: boolean, cityLabel?: string) => Promise<void>;
  locate: () => void;
  handleCitySelect: (city: import("@/lib/types").CityResult) => void;
  offline: boolean;
  timeline: HourlyAir[];
  locationHour: number;
  following: boolean;
  locationError: string | null;
  setFollowing: (active: boolean) => void;
}

export function useAirData(): UseAirDataReturn {
  const [demo, setDemo] = useState(true);
  const [air, setAir] = useState<AirSnapshot>(demoAir);
  const [offline, setOffline] = useState(false);

  const {
    requestLocation,
    setFollowing,
    following,
    error: locationError,
  } = useLocation({
    onChange: async (coords) => {
      await fetchAir(coords.latitude, coords.longitude, true);
      setAir((prev) => ({
        ...prev,
        city: formatLocationLabel(coords.latitude, coords.longitude),
      }));
    },
  });

  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    setOffline(!navigator.onLine);
    const update = () => setOffline(!navigator.onLine);
    window.addEventListener("offline", update);
    window.addEventListener("online", update);
    return () => {
      window.removeEventListener("offline", update);
      window.removeEventListener("online", update);
    };
  }, []);

  const fetchAir = useCallback(async (latitude: number, longitude: number, markLive = true, cityLabel?: string) => {
    const lat = Math.round(latitude * 100) / 100;
    const lon = Math.round(longitude * 100) / 100;
    try {
      setOffline(false);
      const response = await fetch(`/api/air?lat=${encodeURIComponent(String(lat))}&lon=${encodeURIComponent(String(lon))}`);
      if (!response.ok) throw new Error("air unavailable");
      const result = await validateAirSnapshot(await response.json());
      setAir({ ...result, city: cityLabel ?? result.city });
      if (markLive) setDemo(false);
    } catch {
      setOffline(true);
    }
  }, []);

  const locate = useCallback(() => {
    requestLocation();
  }, [requestLocation]);

  const handleCitySelect = useCallback(async (city: import("@/lib/types").CityResult) => {
    const cityLabel = [city.name, city.admin1, city.country].filter(Boolean).join(", ");
    await fetchAir(city.latitude, city.longitude, true, cityLabel);
  }, [fetchAir]);

  const current = demo ? demoAir : air;
  const timeline = current.hourly.slice(0, 24);

  const now = new Date();
  const offsetHours = (current.utcOffsetSeconds ?? 0) / 3600;
  const locationHour = ((now.getUTCHours() + offsetHours) % 24 + 24) % 24;

  return {
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
    locationError,
    setFollowing,
  };
}
