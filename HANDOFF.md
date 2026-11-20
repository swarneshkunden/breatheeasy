# HANDOFF — BreatheEasy Urban Air Quality Assistant

## Current branch
`handoff-finish` (local only, never pushed). Baseline checkpoint `052c599`.

## Step one findings (takeover safe)

### Done / passing
- `npm install` succeeds (471 packages). Playwright Chromium browsers installed.
- `npm run typecheck` — pass. `npm run lint` — pass. `npm run test` — pass (63 tests).
- `npm run build` — pass. Build emits `/` (landing), `/app` (app), `/api/*`, `/sitemap.xml`, `_not-found`.
- Design-system tokens match the brief in `src/app/globals.css`: Morning/Dusk themes, AQI color scale, Fraunces + Instrument Sans via next/font, 8px spacing, 22px card radius, 999px pills.
- Components: `LivingSkyline`, `DayDial`, `CitySearch` (accessible combobox).
- API routes meet brief: `/api/geocode` (GET, count 5, 5s AbortController, 1h cache, rounded coords, friendly empty, typed 502, rate-limited), `/api/air` (GET ?lat&lon, Zod ranges, 2-day hourly incl. pm10/no2/o3, timezone/utcOffset offset, null-gap handling, 10min cache, rate-limited), `/api/ai` (shared rate limiter + Upstash path, 8s timeout, fallback), `/api/health`.
- Security: Zod input schemas, env validation, middleware CSP/security-headers/Permissions-Policy (geolocation=(self)), sanitized errors, coordinate rounding, no location/health logging.
- i18n en/hi, demo AirSnapshot (Delhi AQI 380), impact calculator + constants, rule engine.
- Pages: `error.tsx`, `not-found.tsx`, `sitemap.ts`, `manifest.webmanifest` (start_url=/app), `robots.txt`, `sw.js` (PWA), `og-image.svg`, layout openGraph metadata.
- `page.tsx` = landing page (server component): hero with Living Skyline + demo AQI + two buttons, 3-step how-it-works, 4 what-you-get cards, privacy strip + not-medical-advice footer.
- `src/app/app/page.tsx` = the app (client): `fetchAir` GET helper, `CitySearch`, `useLocation` hook integration (one-shot + follow toggle, location-local hour for DayDial, GPS label "Your location (28.61°N, 77.21°E)", keyboard AQI slider).
- `src/lib/location.ts`: `distanceKm`, `shouldRefetch`, `formatLocationLabel`. `src/hooks/useLocation.ts`: one-shot + watch, permission errors, secure context, visibility pause/resume.

### Broken / missing
1. **`npm run test:e2e` fails** — Playwright browsers installed but the spec tests (`tests/breatheeasy.spec.ts`, now routed to `/app`) were written for a different UI version and fail on selector/interaction mismatches (slider Home key, offline banner trigger, demo text, etc.). Work Package D redesigns the UI and specifies the e2e flows for it, so the suite will be rewritten in D. Known blocker for the e2e audit aspect.
2. **`npm audit`** — 3 pre-existing dev-dependency vulnerabilities (`@vitest/mocker`, `tinypool`). `npm audit fix --force` bumps vitest outside pinned range; decision pending.
3. **No `.env.local`** — copy from `.env.example` to run locally (no secrets).
4. **Work Package D (visual redesign) not started** — the app UI still looks cheap per the brief. Needs the Calm air/honest data design system applied section by section.
5. **Work Package B `useLocation` Playwright geolocation flows** added to spec but await D alignment.

### Decisions made
- Committed all existing source as one local checkpoint (`052c599`) on branch `handoff-finish` before any changes.
- Git repo root is home dir; breatheeasy project lives at `OneDrive/.../Challenge6/breatheeasy` within it.
- HANDOFF.md lives at `breatheeasy/HANDOFF.md` (project root).
- Kept `/api/geocode` naming (per brief); removed old `/api/geocoding`.
- Shared in-memory rate limiter in `src/lib/security/rateLimit.ts`, used by geocode, air, and AI (fallback) routes.
- Do NOT `npm audit fix --force` yet (would loosen pinned vitest); decide in audit loop.
- Keep stack fixed; no library swaps.

### Work Package A status: COMPLETE
Work Package B status: COMPLETE (hook + helpers + unit tests + page integration).
Work Package C status: COMPLETE (landing page `/`, app at `/app`, manifest/sitemap/metadata/OG updated, tests routed to `/app`).

### Next step
Work Package D: visual redesign ("Calm air, honest data") section by section — tokens/fonts, hero+skyline+slider, What-If+Family cards, Window timer+Day dial, Pledge+share card, polish. Then final audit loop. Update HANDOFF.md after.
