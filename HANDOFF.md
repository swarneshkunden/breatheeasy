# HANDOFF — BreatheEasy Urban Air Quality Assistant

## Current branch
`handoff-finish` (local only, never pushed). Baseline checkpoint `052c599`.

## Step one findings (takeover safe)

### Done / passing
- `npm install` succeeds (471 packages). Playwright Chromium browsers now installed.
- `npm run typecheck` — pass. `npm run lint` — pass. `npm run test` — pass (63 tests: presentation, rules, security validation, AI/geocode/air routes, location helpers, useLocation hook).
- `npm run build` — pass.
- Design-system tokens already match the brief in `src/app/globals.css`: Morning/Dusk themes, AQI color scale, Fraunces + Instrument Sans via next/font, 8px spacing, 22px card radius, 999px pills.
- Components exist: `LivingSkyline`, `DayDial`, plus new `CitySearch` (accessible combobox).
- API routes meet brief: `/api/geocode` (GET, count 5, 5s AbortController, 1h cache, rounded coords, friendly empty, typed 502, rate-limited), `/api/air` (GET ?lat&lon, Zod ranges, 2-day hourly incl. pm10/no2/o3, timezone/utcOffset offset, null-gap handling, 10min cache, rate-limited), `/api/ai` (uses shared in-memory rate limiter + Upstash path, 8s timeout, fallback), `/api/health`.
- Security: Zod input schemas, env validation, middleware CSP/security-headers/Permissions-Policy (geolocation=(self)), sanitized errors, coordinate rounding, no location/health logging.
- i18n en/hi, demo AirSnapshot (Delhi AQI 380), impact calculator + constants, rule engine.
- Pages: `error.tsx`, `not-found.tsx`, `sitemap.ts`, `manifest.webmanifest`, `robots.txt`, `sw.js` (PWA shell).
- `page.tsx` refactored: `fetchAir` helper, GET `/api/air`, `CitySearch` combobox, `useLocation` hook integration (one-shot + follow toggle, location-local hour for DayDial, GPS label, localStorage last city rounded coords).
- `src/lib/location.ts`: `distanceKm`, `shouldRefetch`, `formatLocationLabel`. `src/hooks/useLocation.ts`: one-shot + watch, permission errors, secure context, visibility pause/resume.
- Slider is keyboard-controllable (Home/End/arrows) with `aria-label="Air quality preview"`.

### Broken / missing
1. **`npm run test:e2e` fails** — Playwright browsers installed but the 9 tests in `tests/breatheeasy.spec.ts` were written for a different UI version and several fail on selector/interaction mismatches. Work Package D redesigns the UI and specifies the e2e flows for it, so the suite will be rewritten in D. Known blocker for the e2e audit aspect.
2. **`npm audit`** — 3 pre-existing dev-dependency vulnerabilities (`@vitest/mocker`, `tinypool`). `npm audit fix --force` bumps vitest outside pinned range; decision pending.
3. **No landing page** — app still at `/`; brief wants `/` = landing page, app at `/app`. `page.tsx` is the app shell (Work Package C).
4. **No `.env.local`** — copy from `.env.example` to run locally (no secrets).
5. Playwright spec references `/` routes; needs `/app` paths for C.

### Decisions made
- Committed all existing source as one local checkpoint (`052c599`) on branch `handoff-finish` before any changes.
- Git repo root is home dir; breatheeasy project lives at `OneDrive/.../Challenge6/breatheeasy` within it.
- HANDOFF.md lives at `breatheeasy/HANDOFF.md` (project root).
- Kept `/api/geocode` naming (per brief); removed old `/api/geocoding`.
- Shared in-memory rate limiter in `src/lib/security/rateLimit.ts`, used by geocode, air, and AI (fallback) routes.
- Do NOT `npm audit fix --force` yet (would loosen pinned vitest); decide in audit loop.
- Keep stack fixed; no library swaps.

### Work Package A status: COMPLETE
Work Package B status: COMPLETE (hook + helpers + unit tests + page integration; geolocation Playwright tests added to spec but suite awaits D alignment).

### Next step
Work Package C: landing page at `/`, move app to `/app`, update links/manifest/sitemap/metadata/tests, then Lighthouse 95+ mobile. Update HANDOFF.md after.
