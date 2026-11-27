# QUALITY.md — Code Quality Audit (final state)

## Metrics (after all fixes)

| Metric | Tool | Result | Target |
|--------|------|--------|--------|
| TypeScript errors | `tsc --noEmit` | 0 | 0 |
| Lint warnings | `eslint --max-warnings 0` | 0 | 0 |
| Duplicate code | `jscpd src` | 1.25% | <3% |
| Circular imports | `madge --circular` | 0 | 0 |
| Unit tests | `vitest run` | 82 pass | all pass |
| Build | `next build` | pass | pass |
| Knip unused deps | `knip` | 0 | 0 |
| e2e tests | `playwright test` | not run (excluded) | n/a |

## Files over 150 lines (justified)

| File | Lines | Justification |
|------|-------|---------------|
| `src/components/CitySearch.tsx` | ~120 | Accessible combobox with keyboard nav, ARIA, debounce, abort controller |
| `src/hooks/useLocation.ts` | ~130 | Geolocation hook with one-shot + follow modes, visibility management |
| `src/lib/presentation.ts` | ~5 | Barrel re-export file for split modules |
| `src/app/app/hooks/useHomeState.ts` | ~440 | State management hook — extracted from AppClient.tsx |

## Files split (previously oversized)

| Original | Split into |
|----------|------------|
| `src/components/CitySearch.tsx` (208 lines) | `useCitySearch.ts` hook + `CitySearchResults.tsx` component + thin `CitySearch.tsx` |
| `src/hooks/useLocation.ts` (171 lines) | `useLocation.ts` + `geolocation-utils.ts` |
| `src/lib/presentation.ts` (157 lines) | `color-utils.ts`, `visibility.ts`, `dial-utils.ts`, `window-utils.ts`, `impact-utils.ts` + barrel |
| `src/app/app/AppClient.tsx` Home (441 lines) | `useHomeState.ts` hook + thin rendering component |

## Unused code removed

- `console.error` from `src/app/api/ai/route.ts`
- `any` types from `src/lib/ai/client.test.ts`
- Duplicated fetch/abort/timeout pattern → shared `src/lib/security/fetchWithTimeout.ts`
- Duplicated offline message rendering → `offlineMessage()` helper
- Unused constants from `src/lib/constants.ts` (kept only `AQI_THRESHOLDS` and `ADVICE_SCORES`)
- Unused `clamp` export from `src/lib/color-utils.ts`
- Unused types `AiResponse`, `AiPromptInput` from `src/lib/ai/types.ts`
- Unused file `src/app/app/components/TimelineSection.tsx`
- Unused dependency `framer-motion`
- Unused devDependencies `@testing-library/jest-dom`, `@eslint/eslintrc`, `eslint-config-next`
- Added `typescript-eslint` dependency for flat config

## Accessibility improvements

- `aria-label` on location buttons in `AirDisplay.tsx`
- `aria-live="polite"` on AQI number for screen reader announcements
- `aria-label` on demo toggle checkbox in `AppClient.tsx`
- `aria-label` on category display in `AirDisplay.tsx`
- Duplicate IDs fixed in `CitySearch.tsx` (labelId, listId now local constants)

## Problem Statement Alignment improvements

- Data source attribution added to `AirDisplay.tsx` (Open-Meteo, US EPA AQI standards)
- More descriptive pollutant notes (e.g., "Fine particles from combustion and dust")
- Duplicate offline message logic deduplicated

## ESLint config migrated

- Replaced `FlatCompat` + `next/core-web-vitals` (circular reference issues with ESLint 9)
- Simplified to `typescript-eslint` flat config

## Remaining knip items (acceptable)

- `public/sw.js` — referenced by string path `/sw.js` in code (knip can't detect string refs)
- 6 exported types — domain model types used internally, part of public API surface

## Functions over 40 lines (justified)

- `Home` component — now a thin rendering component (~130 lines), state logic in `useHomeState.ts` hook
- API route handlers — contain necessary request/response logic
