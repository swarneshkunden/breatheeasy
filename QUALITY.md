# QUALITY.md — Code Quality Audit (before fixes)

## Metrics (baseline)

| Metric | Tool | Result | Target |
|--------|------|--------|--------|
| TypeScript errors | `tsc --noEmit` | 0 | 0 |
| Lint warnings | `eslint --max-warnings 0` | 0 | 0 |
| Duplicate code | `jscpd src` | 1.60% | <3% |
| Circular imports | `madge --circular` | 0 | 0 |
| Unit tests | `vitest run` | 82 pass | all pass |
| Build | `next build` | pass | pass |

## Files over 150 lines

| File | Lines | Issue |
|------|-------|-------|
| `src/app/app/AppClient.tsx` | 631 | Monolithic component, needs splitting |
| `src/components/CitySearch.tsx` | 206 | Over limit |
| `src/hooks/useLocation.ts` | 169 | Over limit |
| `src/lib/presentation.ts` | 155 | Just over limit |
| `src/app/api/ai/route.test.ts` | 174 | Test file (acceptable but large) |

## `any` type usage (non-test)

None found in source files. Only in `src/lib/ai/client.test.ts` (lines 9, 11): `fetchSpy as any` — test mock typing.

## Unsafe type casts (`as`)

| File | Lines | Context |
|------|-------|---------|
| `src/app/app/AppClient.tsx` | 74, 100, 178, 214, 245, 317, 319, 616, 618, 619 | DOM element casts, JSON.parse casts, response.json() casts, enum member casts |
| `src/components/CitySearch.tsx` | 85 | `body as CityResult[]` — API response cast |
| `src/lib/ai/client.ts` | 79 | `response.json()` payload cast |
| `src/app/api/air/route.ts` | 65 | `response.json()` payload cast |
| `src/app/api/geocode/route.ts` | 59 | `response.json()` payload cast |
| `src/lib/security/validation.test.ts` | 27 | Test environment cast |

`as const` usages (safe, enum-like objects) are not flagged.

## Non-null assertions (`!.`)

None found.

## Console statements

| File | Lines |
|------|-------|
| `src/app/api/ai/route.ts` | 88, 103 — `console.error` for Smart Mode fallback logging |

## TODO / FIXME

None found.

## jscpd duplicates (8 clones, 1.60%)

1. `app/api/air/route.ts` ↔ `app/api/geocode/route.ts`: rate limit check + fetch/abort/timeout pattern (shared logic)
2. `app/api/air/route.test.ts` ↔ `app/api/geocode/route.test.ts`: 502 error handling in tests
3. `app/app/AppClient.tsx`: duplicated offline message rendering (lines 211-221 and 242-252)
4. `hooks/useLocation.ts`: secure context + geolocation check duplicated (lines 75-83 and 100-106)
5. `hooks/useLocation.test.ts`: error test clones (3×)
6. `lib/ai/client.test.ts`: mock setup clones (2×)

## knip unused

**Unused files:** `public/sw.js`, all new `src/app/app/components/*` (if created), `src/lib/constants.ts`

**Unused deps:** `framer-motion`, `@testing-library/jest-dom`, `eslint-config-next`

**Unused exported types:** `LocationCoords`, `AiResponse`, `AiPromptInput`, `MemberType`, `CommuteMode`, `CookingFuel`, `Budget`

## Fix plan (in order per rules)

a) Remove unused files/exports/deps
b) Remove `any`, unsafe casts, non-null assertions
c) Merge duplicated logic into reusable helpers
d) Split oversized components/functions into small units
e) Move magic numbers/strings into named constants
f) Consistent typed error-handling pattern
g) Fix folder structure, circular imports, naming
h) Comments where non-obvious, improve README
i) Add unit tests for new/changed pure logic
