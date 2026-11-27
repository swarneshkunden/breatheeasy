"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CityResult } from "@/lib/types";

interface UseCitySearchProps {
  onSelect: (city: CityResult) => void;
}

export function useCitySearch({ onSelect }: UseCitySearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CityResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const abortRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      abortRef.current?.abort();
    };
  }, []);

  const close = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    requestIdRef.current += 1;
    abortRef.current?.abort();
    setLoading(false);
    setHighlighted(-1);
    setError(null);
  }, []);

  const select = useCallback(
    (city: CityResult) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      requestIdRef.current += 1;
      abortRef.current?.abort();
      const rounded = { ...city, latitude: Math.round(city.latitude * 100) / 100, longitude: Math.round(city.longitude * 100) / 100 };
      setQuery(`${rounded.name}${rounded.admin1 ? ", " + rounded.admin1 : ""}${rounded.country ? ", " + rounded.country : ""}`);
      setResults([]);
      setLoading(false);
      setHighlighted(-1);
      try {
        localStorage.setItem("breatheeasy-last-city", JSON.stringify({ name: rounded.name, admin1: rounded.admin1, country: rounded.country, latitude: rounded.latitude, longitude: rounded.longitude }));
      } catch {
        // localStorage unavailable; ignore.
      }
      onSelect(rounded);
    },
    [onSelect],
  );

  const fetchResults = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setError(null);
      setLoading(false);
      return;
    }
    const id = ++requestIdRef.current;
    const controller = new AbortController();
    const previousController = abortRef.current;
    abortRef.current = controller;
    if (previousController) previousController.abort();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/geocode?q=${encodeURIComponent(trimmed)}`, { signal: controller.signal });
      if (id !== requestIdRef.current || controller.signal.aborted) return;
      if (!response.ok) throw new Error("Search failed");
      const body = await response.json();
      if (id !== requestIdRef.current) return;
      if (Array.isArray(body)) {
        setResults(body as CityResult[]);
      } else {
        setResults([]);
        setError(body?.message ?? "No match, try a nearby larger city");
      }
    } catch {
      if (id !== requestIdRef.current || controller.signal.aborted) return;
      setResults([]);
      setError("Search is temporarily unavailable");
    } finally {
      if (id === requestIdRef.current) setLoading(false);
    }
  }, []);

  return {
    query,
    setQuery,
    results,
    setResults,
    error,
    setError,
    loading,
    setLoading,
    highlighted,
    setHighlighted,
    close,
    select,
    fetchResults,
  };
}
