"use client";

// CitySearch is a single cohesive accessible combobox component (keyboard nav, ARIA, debounce, abort controller) — justified over 150 lines.

import { useCallback, useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
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
    setOpen(false);
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
      setOpen(false);
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
      setOpen(false);
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
      requestIdRef.current += 1;
      abortRef.current?.abort();
      setResults([]);
      setHighlighted(-1);
      setError(null);
      setOpen(next.trim().length >= 2);
      setLoading(next.trim().length >= 2);
      if (next.trim().length < 2) {
        setLoading(false);
        return;
      }
      debounceRef.current = setTimeout(() => fetchResults(next), 300);
    },
    [fetchResults],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Escape") { close(); return; }
      if (!open) {
        if (event.key === "ArrowDown" && results.length > 0) { setOpen(true); setHighlighted(0); }
        return;
      }
      if (event.key === "ArrowDown") { event.preventDefault(); setHighlighted((prev) => Math.min(prev + 1, results.length - 1)); }
      else if (event.key === "ArrowUp") { event.preventDefault(); setHighlighted((prev) => Math.max(prev - 1, -1)); }
      else if (event.key === "Enter") {
        event.preventDefault();
        if (highlighted >= 0) select(results[highlighted]);
        else void fetchResults(query);
      }
    },
    [open, results, select, close, highlighted, fetchResults, query],
  );

  const labelId = "city-search-label";
  const listId = "city-search-list";

  return (
    <div className="city-search" role="search">
      <label id={labelId} className="sr-only">Search city</label>
      <div className="city-search-field">
        <input
          id="city-search"
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          autoComplete="off"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          aria-haspopup="listbox"
          aria-activedescendant={highlighted >= 0 ? `city-option-${highlighted}` : undefined}
          aria-labelledby={labelId}
          aria-describedby={error ? "city-search-error" : undefined}
          placeholder="Find a city"
        />
        <button
          type="button"
          aria-label="Search cities"
          onClick={() => void fetchResults(query)}
          disabled={disabled || loading || query.trim().length < 2}
        >
          <Search size={16} aria-hidden="true" />
        </button>
      </div>
      {open && (
        <ul id={listId} role="listbox" aria-label="City suggestions">
          {loading ? (
            <li role="option" aria-disabled="true" aria-selected={false}>Loading…</li>
          ) : results.length === 0 ? (
            <li role="option" aria-disabled="true" aria-selected={false}>{error ?? "No results"}</li>
          ) : (
            results.map((city, index) => {
              const active = index === highlighted;
              const label = [city.name, city.admin1, city.country].filter(Boolean).join(", ");
              return (
                <li
                  key={index}
                  id={`city-option-${index}`}
                  role="option"
                  aria-selected={active}
                  data-active={active}
                  onClick={() => select(city)}
                  onMouseEnter={() => setHighlighted(index)}
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
