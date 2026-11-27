"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { shouldRefetch, formatLocationLabel, type LocationReading } from "@/lib/location";
import { GEO_ERRORS, POSITION_OPTIONS, roundCoordinate } from "./geolocation-utils";

interface LocationCoords {
  latitude: number;
  longitude: number;
}

interface LocationState {
  coords: LocationCoords | null;
  label: string | null;
  error: string | null;
  following: boolean;
  timestamp: number | null;
}

interface UseLocationOptions {
  onChange?: (coords: LocationCoords) => void;
}

export function useLocation({ onChange }: UseLocationOptions = {}) {
  const [state, setState] = useState<LocationState>({
    coords: null,
    label: null,
    error: null,
    following: false,
    timestamp: null,
  });
  const watchIdRef = useRef<number | null>(null);
  const lastReadingRef = useRef<LocationReading | null>(null);
  const lastFetchRef = useRef(0);
  const wasFollowingRef = useRef(false);

  const handleError = useCallback(
    (err: GeolocationPositionError) => {
      const message = GEO_ERRORS[err.code] ?? "Unable to determine your location.";
      setState((prev) => ({ ...prev, error: message }));
    },
    [],
  );

  const setCoords = useCallback(
    (position: GeolocationPosition, following: boolean) => {
      const coords: LocationCoords = { latitude: roundCoordinate(position.coords.latitude), longitude: roundCoordinate(position.coords.longitude) };
      const now = Date.now();
      lastReadingRef.current = { ...coords, timestamp: now };
      lastFetchRef.current = now;
      setState({
        coords,
        label: formatLocationLabel(coords.latitude, coords.longitude),
        error: null,
        following,
        timestamp: now,
      });
    },
    [],
  );

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState((prev) => ({ ...prev, error: "Geolocation is not supported by this browser." }));
      return;
    }
    if (!isSecureContext) {
      setState((prev) => ({
        ...prev,
        error: "Location access requires a secure connection (HTTPS or localhost).",
      }));
      return;
    }
    setState((prev) => ({ ...prev, error: null }));
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords(position, state.following);
        onChange?.({ latitude: roundCoordinate(position.coords.latitude), longitude: roundCoordinate(position.coords.longitude) });
      },
      handleError,
      POSITION_OPTIONS,
    );
  }, [state.following, setCoords, handleError, onChange]);

  const setFollowing = useCallback(
    (active: boolean) => {
      if (active) {
        if (!navigator.geolocation) {
          setState((prev) => ({ ...prev, error: "Geolocation is not supported by this browser." }));
          return;
        }
        if (!isSecureContext) {
          setState((prev) => ({
            ...prev,
            error: "Location access requires a secure connection (HTTPS or localhost).",
          }));
          return;
        }
        wasFollowingRef.current = true;
        watchIdRef.current = navigator.geolocation.watchPosition(
          (position) => {
            const coords: LocationCoords = {
              latitude: roundCoordinate(position.coords.latitude),
              longitude: roundCoordinate(position.coords.longitude),
            };
            const now = Date.now();
            const next: LocationReading = { ...coords, timestamp: now };
            const refresh = shouldRefetch(lastReadingRef.current, next, now);
            setCoords(position, true);
            if (refresh && lastReadingRef.current) onChange?.(coords);
            lastReadingRef.current = next;
          },
          handleError,
          POSITION_OPTIONS,
        );
        setState((prev) => ({ ...prev, following: true, error: null }));
      } else {
        if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current);
          watchIdRef.current = null;
        }
        wasFollowingRef.current = false;
        setState((prev) => ({ ...prev, following: false }));
      }
    },
    [setCoords, handleError, onChange],
  );

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.hidden) {
        if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current);
          watchIdRef.current = null;
        }
        if (state.following) wasFollowingRef.current = true;
        setState((prev) => ({ ...prev, following: false }));
      } else if (wasFollowingRef.current) {
        setFollowing(true);
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [state.following, setFollowing]);

  return {
    ...state,
    requestLocation,
    setFollowing,
  };
}

export type { LocationCoords, LocationState };
