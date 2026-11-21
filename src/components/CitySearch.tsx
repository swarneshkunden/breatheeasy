"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CityResult } from "@/lib/types";

interface CitySearchProps {
  onSelect: (city: CityResult) => void;
  value?: string;
  disabled?: boolean;
}

export function CitySearch({ onSelect, value: initialValue, disabled = false }: CitySearchProps) {
  const [query, setQuery] = useState(initialValue ?? "");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<CityResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const highlighted = useRef(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const boxRef = useRef<HTMLUListElement>(null);
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
    setOpen(false);
    highlighted.current = -1;
    setError(null);
  }, []);

  const select = useCallback(
    (city: CityResult) => {
      const rounded = { ...city, latitude: Math.round(city.latitude * 100) / 100, longitude: Math.round(city.longitude * 100) / 100 };
      setQuery(`${rounded.name}${rounded.admin1 ? ", " + rounded.admin1 : ""}${rounded.country ? ", " + rounded.country : ""}`);
      setResults([]);
      setOpen(false);
      highlighted.current = -1;
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
      setOpen(false);
      setError(null);
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
        setOpen(true);
      } else {
        setResults([]);
        setOpen(false);
        setError(body?.message ?? "No match, try a nearby larger city");
      }
    } catch {
      if (id !== requestIdRef.current || controller.signal.aborted) return;
      setResults([]);
      setOpen(false);
      setError("Search is temporarily unavailable");
    } finally {
      if (id === requestIdRef.current) setLoading(false);
    }
  }, []);

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const next = event.target.value;
      setQuery(next);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      setError(null);
      debounceRef.current = setTimeout(() => fetchResults(next), 300);
    },
    [fetchResults],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Escape") { close(); return; }
      if (!open) { if (event.key === "ArrowDown") { setOpen(true); highlighted.current = 0; } return; }
      if (event.key === "ArrowDown") { event.preventDefault(); highlighted.current = Math.min(highlighted.current + 1, results.length - 1); }
      else if (event.key === "ArrowUp") { event.preventDefault(); highlighted.current = Math.max(highlighted.current - 1, -1); }
      else if (event.key === "Enter") { event.preventDefault(); if (highlighted.current >= 0) select(results[highlighted.current]); }
    },
    [open, results, select, close],
  );

  useEffect(() => {
    if (inputRef.current && boxRef.current) {
      inputRef.current.setAttribute("aria-controls", boxRef.current.id);
    }
  }, []);

  const labelId = "city-search-label";
  const listId = "city-search-list";

  return (
    <div className="city-search" role="combobox" aria-expanded={open} aria-controls={listId} aria-haspopup="listbox">
      <label id={labelId} className="sr-only">Search city</label>
      <input
        ref={inputRef}
        id="city-search"
        value={query}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        autoComplete="off"
        role="searchbox"
        aria-autocomplete="list"
        aria-activedescendant={highlighted.current >= 0 ? `city-option-${highlighted.current}` : undefined}
        aria-labelledby={`${labelId} ${error ? "city-search-error" : ""}`}
        aria-describedby={error ? "city-search-error" : undefined}
        placeholder="Find a city"
      />
      {open && boxRef.current && (
        <ul ref={boxRef} id={listId} role="listbox">
          {loading ? (
            <li role="option" aria-disabled="true" aria-selected={false}>Loading…</li>
          ) : results.length === 0 ? (
            <li role="option" aria-disabled="true" aria-selected={false}>{error ?? "No results"}</li>
          ) : (
            results.map((city, index) => {
              const active = index === highlighted.current;
              const label = [city.name, city.admin1, city.country].filter(Boolean).join(", ");
              return (
                <li
                  key={index}
                  id={`city-option-${index}`}
                  role="option"
                  aria-selected={active}
                  data-active={active}
                  onClick={() => select(city)}
                >
                  {label}
                </li>
              );
            })
          )}
        </ul>
      )}
      {error && <span id="city-search-error" className="city-error" role="alert">{error}</span>}
    </div>
  );
}

export type { CityResult };
