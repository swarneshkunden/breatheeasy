"use client";

import { useCallback, useRef, useState, type RefObject } from "react";
import { Search } from "lucide-react";
import type { CityResult, Language } from "@/lib/types";
import { useCitySearch } from "@/app/app/hooks/useCitySearch";
import { CitySearchResults } from "@/app/app/components/CitySearchResults";

interface CitySearchProps {
  onSelect: (city: CityResult) => void;
  disabled?: boolean;
  language: Language;
  inputRef?: RefObject<HTMLInputElement | null>;
}

export function CitySearch({
  onSelect,
  disabled = false,
  language,
  inputRef,
}: CitySearchProps) {
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
    scheduleSearch,
  } = useCitySearch({ onSelect, language });

  const [open, setOpen] = useState<boolean>(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listId = "city-search-list";

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const next = event.target.value;
      setQuery(next);
      setResults([]);
      setHighlighted(-1);
      setError(null);
      setOpen(next.trim().length >= 2);
      if (next.trim().length < 2) {
        close();
        return;
      }
      scheduleSearch(next);
    },
    [close, scheduleSearch],
  );

  const handleSelect = useCallback(
    (city: CityResult) => {
      select(city);
      setOpen(false);
    },
    [select],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Escape") {
        close();
        setResults([]);
        setOpen(false);
        return;
      }
      if (!open) {
        if (event.key === "ArrowDown" && results.length > 0) {
          setOpen(true);
          setHighlighted(0);
        }
        return;
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setHighlighted((prev) => Math.min(prev + 1, results.length - 1));
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setHighlighted((prev) => Math.max(prev - 1, -1));
      } else if (event.key === "Enter") {
        if (event.nativeEvent.isComposing) return;
        event.preventDefault();
        const selected = results[highlighted];
        if (highlighted >= 0 && selected) handleSelect(selected);
        else void fetchResults(query);
      }
    },
    [
      results,
      handleSelect,
      close,
      highlighted,
      fetchResults,
      query,
      setResults,
    ],
  );

  return (
    <div className="city-search" role="search">
      <label id={labelId} htmlFor="city-search" className="sr-only">
        Search city
      </label>
      <div className="city-search-field">
        <input
          id="city-search"
          ref={inputRef ?? searchInputRef}
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
          aria-activedescendant={
            highlighted >= 0 ? `city-option-${highlighted}` : undefined
          }
          aria-labelledby={labelId}
          aria-describedby={error ? "city-search-error" : undefined}
          placeholder={language === "hi" ? "शहर खोजें" : "Find a city"}
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
        <CitySearchResults
          results={results}
          loading={loading}
          error={error}
          highlighted={highlighted}
          onSelect={handleSelect}
          onHighlight={setHighlighted}
        />
      )}
      {error && (
        <span id="city-search-error" className="city-error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
