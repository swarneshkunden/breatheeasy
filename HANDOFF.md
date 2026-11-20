# HANDOFF — BreatheEasy Urban Air Quality Assistant

## Current branch
`handoff-finish` (local only, never pushed). Baseline checkpoint `052c599`.

## Step one findings (takeover safe)

### Done / passing
- `npm install` succeeds (471 packages).
- `npm run typecheck` — pass. `npm run lint` — pass. `npm run test` — pass (45 tests: presentation, rules, security validation, AI route, geocode route, air route).
- Design-system tokens already match the brief in `src/app/globals.css`: Morning/Dusk themes, AQI color scale, Fraunces + Instrument Sans via next/font, 8px spacing, 22px card radius, 999px pills.
- Components exist: `LivingSkyline`, `DayDial`, plus new `CitySearch` (accessible combobox).
- API routes meet brief: `/api/geocode` (GET, count 5, 5s AbortController, 1h cache, rounded coords, friendly empty, typed 502, rate-limited), `/api/air` (GET ?lat&lon, Zod ranges, 2-day hourly incl. pm10/no2/o3, timezone/utcOffset offset, null-gap handling, 10min cache, rate-limited), `/api/ai` (uses shared in-memory rate limiter + Upstash path, 8s timeout, fallback), `/api/health`.
- Security: Zod input schemas, env validation, middleware CSP/security-headers/Permissions-Policy (geolocation=(self)), sanitized errors, coordinate rounding, no location/health logging.
- i18n en/hi, demo AirSnapshot (Delhi AQI 380), impact calculator + constants, rule engine.
- Pages: `error.tsx`, `not-found.tsx`, `sitemap.ts`, `manifest.webmanifest`, `robots.txt`, `sw.js` (PWA shell).
- `page.tsx` refactored: `fetchAir` helper, GET `/api/air`, `CitySearch` combobox, location-local hour for DayDial marker, last city remembered in localStorage (rounded coords).

### Broken / missing
1. **E2E cannot run** — Playwright browsers not installed (`npx playwright install` needed). All 6 spec tests fail at browser launch. `tests/breatheeasy.spec.ts`.
2. **`npm audit`** — 3 pre-existing dev-dependency vulnerabilities (`@vitest/mocker`, `tinypool`). `npm audit fix --force` bumps vitest outside pinned range; decision pending.
3. **No landing page** — app still at `/`; brief wants `/` = landing page, app at `/app`. `page.tsx` is the app shell (Work Package C).
4. **No `useLocation` hook** — `distanceKm` (haversine) and `shouldRefetch(prev, next, now)` missing; not unit-tested (Work Package B).
5. **No `.env.local`** — copy from `.env.example` to run locally (no secrets).
6. Playwright spec references `/` routes; needs updating for `/app` + geolocation flows (Work Package B/C).

### Decisions made
- Committed all existing source as one local checkpoint (`052c599`) on branch `handoff-finish` before any changes.
- Git repo root is home dir; breatheeasy project lives at `OneDrive/.../Challenge6/breatheeasy` within it.
- HANDOFF.md lives at `breatheeasy/HANDOFF.md` (project root).
- Kept `/api/geocode` naming (per brief); removed old `/api/geocoding`.
- Shared in-memory rate limiter in `src/lib/security/rateLimit.ts`, used by geocode, air, and AI (fallback) routes.
- Do NOT `npm audit fix --force` yet (would loosen pinned vitest); decide in audit loop.
- Keep stack fixed; no library swaps.

### Work Package A status: COMPLETE
- Geocode backend + air route fixed; client CitySearch combobox added; validators + mocked API tests added (success, empty, timeout, invalid input, 429).

### Next step
Work Package B: `useLocation` hook + `distanceKm` + `shouldRefetch`, one-shot + watch (opt-in), permission handling, offline last-known, Playwright geolocation flows. Update HANDOFF.md after.
