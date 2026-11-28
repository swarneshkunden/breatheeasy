"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  shouldRefetch,
  formatLocationLabel,
  type LocationReading,
} from "@/lib/location";
import { POSITION_OPTIONS, roundCoordinate } from "./geolocation-utils";
import { copy } from "@/lib/i18n";
import type { Language } from "@/lib/types";

interface LocationCoords {
  latitude: number;
  longitude: number;
}

interface LocationState {
  coords: LocationCoords | null;
  label: string | null;
  error: string | null;
  following: boolean;
  locating: boolean;
  timestamp: number | null;
}

interface UseLocationOptions {
  onChange?: (
    coords: LocationCoords,
  ) => boolean | void | Promise<boolean | void>;
  language?: Language;
}

export function useLocation({
  onChange,
  language = "en",
}: UseLocationOptions = {}) {
  const t = copy[language];
  const [state, setState] = useState<LocationState>({
    coords: null,
    label: null,
    error: null,
    following: false,
    locating: false,
    timestamp: null,
  });
  const watchIdRef = useRef<number | null>(null);
  const lastReadingRef = useRef<LocationReading | null>(null);
  const wasFollowingRef = useRef(false);
  const followingRef = useRef(false);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const handleError = useCallback(
    (err: GeolocationPositionError) => {
      const message =
        err.code === 1
          ? t.locationPermissionDenied
          : err.code === 3
            ? t.locationRequestTimeout
            : t.locationPositionUnavailable;
      setState((prev) => ({ ...prev, error: message, locating: false }));
    },
    [t],
  );

  const setCoords = useCallback(
    (position: GeolocationPosition, following: boolean) => {
      const coords: LocationCoords = {
        latitude: roundCoordinate(position.coords.latitude),
        longitude: roundCoordinate(position.coords.longitude),
      };
      const now = Date.now();
      setState({
        coords,
        label: formatLocationLabel(coords.latitude, coords.longitude),
        error: null,
        following,
        locating: false,
        timestamp: now,
      });
    },
    [],
  );

  const recordFetched = useCallback((coords: LocationCoords) => {
    const timestamp = Date.now();
    lastReadingRef.current = { ...coords, timestamp };
    setState((prev) => ({ ...prev, timestamp }));
  }, []);

  const fetchForCoordinates = useCallback(
    (coords: LocationCoords) => {
      const onChange = onChangeRef.current;
      if (!onChange) return;
      const result = onChange(coords);
      if (result instanceof Promise) {
        void result
          .then((fetched) => {
            if (fetched !== false) recordFetched(coords);
          })
          .catch(() => {
            setState((prev) => ({
              ...prev,
              error: t.airTemporarilyUnavailable,
            }));
          });
      } else if (result !== false) {
        recordFetched(coords);
      }
    },
    [recordFetched, t],
  );

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState((prev) => ({ ...prev, error: t.locationUnsupported }));
      return;
    }
    if (!isSecureContext) {
      setState((prev) => ({
        ...prev,
        error: t.locationSecureContext,
      }));
      return;
    }
    setState((prev) => ({ ...prev, error: null, locating: true }));
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords(position, followingRef.current);
        fetchForCoordinates({
          latitude: roundCoordinate(position.coords.latitude),
          longitude: roundCoordinate(position.coords.longitude),
        });
      },
      handleError,
      POSITION_OPTIONS,
    );
  }, [setCoords, handleError, fetchForCoordinates, t]);

  const setFollowing = useCallback(
    (active: boolean) => {
      if (active) {
        if (!navigator.geolocation) {
          setState((prev) => ({ ...prev, error: t.locationUnsupported }));
          return;
        }
        if (!isSecureContext) {
          setState((prev) => ({
            ...prev,
            error: t.locationSecureContext,
          }));
          return;
        }
        // Prevent duplicate watchers.
        if (watchIdRef.current !== null) return;
        wasFollowingRef.current = true;
        followingRef.current = true;
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
            if (refresh) fetchForCoordinates(coords);
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
        followingRef.current = false;
        setState((prev) => ({ ...prev, following: false }));
      }
    },
    [setCoords, handleError, fetchForCoordinates, t],
  );

  // Register visibility listener once; never clear the watcher in cleanup except on unmount.
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.hidden) {
        if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current);
          watchIdRef.current = null;
        }
        if (followingRef.current) wasFollowingRef.current = true;
        setState((prev) => ({ ...prev, following: false }));
      } else if (wasFollowingRef.current) {
        setFollowing(true);
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  // Unmount cleanup: clear watcher if active.
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, []);

  return {
    ...state,
    requestLocation,
    setFollowing,
  };
}

export type { LocationCoords, LocationState };
