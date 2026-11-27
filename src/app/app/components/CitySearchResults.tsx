"use client";

import { CityResult } from "@/lib/types";

interface CitySearchResultsProps {
  results: CityResult[];
  loading: boolean;
  error: string | null;
  highlighted: number;
  onSelect: (city: CityResult) => void;
  onHighlight: (index: number) => void;
}

export function CitySearchResults({
  results,
  loading,
  error,
  highlighted,
  onSelect,
  onHighlight,
}: CitySearchResultsProps) {
  const listId = "city-search-list";

  return (
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
              onClick={() => onSelect(city)}
              onMouseEnter={() => onHighlight(index)}
            >
              {label}
            </li>
          );
        })
      )}
    </ul>
  );
}
