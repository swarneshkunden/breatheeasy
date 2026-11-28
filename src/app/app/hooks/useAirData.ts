"use client";

import { useCallback, useEffect, useState } from "react";
import { demoAir } from "@/lib/air/demo";
import {
  AirSnapshotSchema,
  type AirSnapshot,
  type HourlyAir,
} from "@/lib/types";
import type { Language } from "@/lib/types";
import { useLocation } from "@/hooks/useLocation";

interface UseAirDataReturn {
  demo: boolean;
  setDemo: (demo: boolean) => void;
  air: AirSnapshot;
  current: AirSnapshot;
  fetchAir: (
    latitude: number,
    longitude: number,
    markLive?: boolean,
    cityLabel?: string,
  ) => Promise<boolean>;
  locate: () => void;
  handleCitySelect: (city: import("@/lib/types").CityResult) => void;
  offline: boolean;
  timeline: HourlyAir[];
  locationHour: number;
  following: boolean;
  locationError: string | null;
  locating: boolean;
  setFollowing: (active: boolean) => void;
}

const unavailableAir: AirSnapshot = {
  aqi: null,
  pm25: null,
  pm10: null,
  no2: null,
  o3: null,
  city: "",
  latitude: 0,
  longitude: 0,
  hourly: [],
  source: "unavailable",
  updatedAt: "",
  timezone: null,
  utcOffsetSeconds: null,
};

export function useAirData(language: Language): UseAirDataReturn {
  const [demo, setDemoState] = useState(false);
  const [demoPreferenceLoaded, setDemoPreferenceLoaded] = useState(false);
  const [air, setAir] = useState<AirSnapshot>(unavailableAir);
  const [offline, setOffline] = useState(false);

  const {
    requestLocation,
    setFollowing,
    following,
    locating,
    error: locationError,
  } = useLocation({
    language,
    onChange: (coords) => {
      void fetchAir(coords.latitude, coords.longitude, true);
    },
  });

  const setDemo = useCallback((enabled: boolean) => {
    setDemoState(enabled);
  }, []);

  useEffect(() => {
    setDemoState(localStorage.getItem("breatheeasy-demo") === "true");
    setDemoPreferenceLoaded(true);
  }, []);

  useEffect(() => {
    if (demoPreferenceLoaded)
      localStorage.setItem("breatheeasy-demo", String(demo));
  }, [demo, demoPreferenceLoaded]);

  useEffect(() => {
    if ("serviceWorker" in navigator)
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    setOffline(!navigator.onLine);
    const update = () => setOffline(!navigator.onLine);
    window.addEventListener("offline", update);
    window.addEventListener("online", update);
    return () => {
      window.removeEventListener("offline", update);
      window.removeEventListener("online", update);
    };
  }, []);

  const fetchAir = useCallback(
    async (
      latitude: number,
      longitude: number,
      markLive = true,
      cityLabel?: string,
    ): Promise<boolean> => {
      const lat = Math.round(latitude * 100) / 100;
      const lon = Math.round(longitude * 100) / 100;
      try {
        setOffline(false);
        const response = await fetch(
          `/api/air?lat=${encodeURIComponent(String(lat))}&lon=${encodeURIComponent(String(lon))}`,
        );
        if (!response.ok) throw new Error("air unavailable");
        const result = AirSnapshotSchema.parse(await response.json());
        setAir({ ...result, city: cityLabel ?? result.city });
        if (markLive) setDemo(false);
        return true;
      } catch {
        setOffline(true);
        return false;
      }
    },
    [],
  );

  const locate = useCallback(() => {
    requestLocation();
  }, [requestLocation]);

  const handleCitySelect = useCallback(
    (city: import("@/lib/types").CityResult) => {
      const cityLabel = [city.name, city.admin1, city.country]
        .filter(Boolean)
        .join(", ");
      void fetchAir(city.latitude, city.longitude, true, cityLabel);
    },
    [fetchAir],
  );

  const current = demo ? demoAir : air;
  const timeline = current.hourly.slice(0, 24);

  const now = new Date();
  const offsetHours = (current.utcOffsetSeconds ?? 0) / 3600;
  const locationHour = (((now.getUTCHours() + offsetHours) % 24) + 24) % 24;

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
    locating,
    setFollowing,
  };
}
