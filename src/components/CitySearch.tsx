"use client";

import { useCallback, useRef, useState } from "react";
import { Search } from "lucide-react";
import type { CityResult } from "@/lib/types";
import { useCitySearch } from "@/app/app/hooks/useCitySearch";
import { CitySearchResults } from "@/app/app/components/CitySearchResults";

interface CitySearchProps {
  onSelect: (city: CityResult) => void;
  value?: string;
  disabled?: boolean;
}

export function CitySearch({ onSelect, value: initialValue, disabled = false }: CitySearchProps) {
  const labelId = "city-search-label";
  const {
    query,
    setQuery,
    results,
    setResults,
    error,
    setError,
    loading,
    highlighted,
    setHighlighted,
    close,
    select,
    fetchResults,
  } = useCitySearch({ onSelect });

  const [open, setOpen] = useState<boolean>(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listId = "city-search-list";

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const next = event.target.value;
      setQuery(next);
      setResults([]);
      setHighlighted(-1);
      setError(null);
      setOpen(next.trim().length >= 2);
      if (next.trim().length < 2) return;
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
    [results, select, close, highlighted, fetchResults, query],
  );

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
      {open && <CitySearchResults results={results} loading={loading} error={error} highlighted={highlighted} onSelect={select} onHighlight={setHighlighted} />}
      {error && <span id="city-search-error" className="city-error" role="alert">{error}</span>}
    </div>
  );
}
