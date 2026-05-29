# Codebase Concerns

**Analysis Date:** 2026-05-29

## Tech Debt

### Admin Page Monolith (God Component)

- Issue: The admin dashboard at `src/app/admin/page.tsx` (1475 lines) handles ALL admin CRUD operations in a single file. It combines inline forms, drag-and-drop via `@dnd-kit`, location management, search, merge, sorting/modal dialogs, and theme toggling into one massive component with inline state and callbacks for every operation.
- Files: `src/app/admin/page.tsx`
- Impact: Impossible to unit test individual behaviors. Difficult to navigate, extend, or refactor without regression risk. Every new admin feature balloons this file further.
- Fix approach: Split into separate components: `DayManager`, `ItemManager`, `LocationManager`, `LocationMergeDialog`, `EditItemDialog`, `EditDayDialog`. Extract data-fetching logic into custom hooks or a dedicated service layer.

### DB Schema Migration via Table Rebuild

- Issue: `src/lib/db.ts` (lines 90-127) rebuilds the entire `itinerary_items` table (CREATE v2, INSERT...SELECT, DROP, RENAME) to change NOTNULL constraints on `latitude`/`longitude` columns. This runs on every server startup. If the migration fails mid-sequence (DROP succeeds but RENAME fails), the table is destroyed.
- Files: `src/lib/db.ts`
- Impact: Potential data loss on any deployment or container restart. No rollback mechanism.
- Fix approach: Use a schema version table to track migrations, only run each migration once. Add proper error handling with transaction rollback.

### ItineraryMap Component Over 970 Lines

- Issue: `src/components/map/ItineraryMap.tsx` (973 lines) handles marker rendering, map controller, popup content, photo gallery navigation, route fetching/splitting, user location, theme toggling, and fit-to-bounds logic all in one file.
- Files: `src/components/map/ItineraryMap.tsx`
- Impact: Hard to maintain. The `MapController` inner component, `PlacePopupContent`, `ItineraryMarker`, and the main exported `ItineraryMap` are interleaved with complex effect dependencies.
- Fix approach: Extract `PlacePopupContent`, `ItineraryMarker`, `MapController`, and route utility functions into separate files under `src/components/map/`.

### In-Memory Rate Limiting Without Persistence

- Issue: `src/app/api/routing/route.ts` uses in-memory `Map` objects for both rate limiting and route caching. These are lost on server restart or in serverless environments.
- Files: `src/app/api/routing/route.ts`
- Impact: Rate limits reset on every deployment. Cache is per-instance only, not shared across multiple replicas.
- Fix approach: Use SQLite-backed rate limiting and caching (the DB is already available), or a Redis-like service for multi-instance deployments.

### Unused Exports and Unnecessary Re-exports

- Issue: `src/lib/constants.ts` exports `ADMIN_PASSWORD` which is duplicated from a hardcoded fallback in `src/app/api/admin/login/route.ts`. The `MAP_DEFAULT_CENTER` coordinates `[142.5, 43.2]` are longitude-first, but the actual default center in `ItineraryMap.tsx` is `[43.2, 142.5]` (latitude-first), suggesting potential confusion.
- Files: `src/lib/constants.ts`, `src/app/api/admin/login/route.ts`
- Impact: Hardcoded password fallback exists in two places (see Security section). The center constant is never imported or used.
- Fix approach: Remove dead constants. Ensure single source of truth for config.

### Seed Script Doesn't Use DB Migration Path

- Issue: `scripts/seed.ts` inserts directly into the SQLite database via SQL, bypassing the app's schema setup code. It uses hardcoded column lists that could drift from the actual schema.
- Files: `scripts/seed.ts`
- Impact: Seed data may fail to insert or produce inconsistent state if the schema changes (e.g., the `google_route_url` and `google_maps_url` columns added in `db.ts` are not populated by the seed script).

## Security

### Weak Admin Authentication Token

- Issue: The admin auth token is `Buffer.from("admin:" + Date.now()).toString("base64")` — a base64-encoded timestamp with a static prefix. There is no HMAC, no secret key, no cryptographic signing. Anyone who sees the token (e.g., via XSS or network inspection) can trivially decode it, observe the pattern, and forge tokens with arbitrary future timestamps.
- Files: `src/lib/auth.ts` (lines 6, 18-20), `src/app/(auth)/admin/login/page.tsx` (line 25, stores in localStorage), `src/app/admin/layout.tsx` (lines 4-16)
- Impact: An attacker who obtains one token (via compromised HTTPS, XSS, or log file inspection) can forge valid tokens indefinitely. The cookie is set with `httpOnly: false`, meaning JavaScript on the page can read it.
- Fix approach: Use a cryptographically signed JWT (e.g., `jsonwebtoken`) or a properly random session token stored in a lookup table. Set cookie `httpOnly: true`.

### Hardcoded Default Password Fallback

- Issue: Both `src/lib/constants.ts` (line 9) and `src/app/api/admin/login/route.ts` (line 4) fall back to `"hokkaido2020"` when `ADMIN_PASSWORD` env var is not set. The `env.ts` module auto-creates a `data/.env.local` file with `ADMIN_PASSWORD=changeme`, but if that file is deleted or misconfigured, the hardcoded `"hokkaido2020"` is used silently.
- Files: `src/lib/constants.ts`, `src/app/api/admin/login/route.ts`, `src/lib/env.ts`
- Impact: Anyone who knows the pattern can guess `hokkaido2020` and gain full admin access to any deployment.
- Fix approach: Remove hardcoded password fallback. Throw an error at startup if `ADMIN_PASSWORD` is not explicitly set in the environment. Validate on first request.

### Plaintext Password Storage

- Issue: The admin password is stored in plaintext at `data/.env.local`. No hashing. The env loader (`src/lib/env.ts`) reads it as raw text and compares it directly against user input in the login handler.
- Files: `data/.env.local` (generated at runtime), `src/lib/env.ts`, `src/app/api/admin/login/route.ts` (line 4)
- Impact: Anyone with filesystem access to the server can read the admin password. No protection if the `.env.local` file is accidentally committed or exposed.
- Fix approach: Hash the stored password (e.g., bcrypt). Compare hashed values server-side.

### No Rate Limiting on Admin Login

- Issue: The login endpoint at `src/app/api/admin/login/route.ts` has no throttling or rate limiting. An attacker can make unlimited brute-force attempts.
- Files: `src/app/api/admin/login/route.ts`
- Impact: Straightforward brute-force attack surface on the admin panel.
- Fix approach: Add exponential backoff, IP-based rate limiting, or account lockout after N failed attempts.

### Middleware Logs Visitor IPs Without Privacy Notice

- Issue: `src/middleware.ts` logs every visitor's IP address and user agent to stdout with no privacy policy, no opt-out, and no notice.
- Files: `src/middleware.ts`
- Impact: GDPR/privacy compliance risk. IP addresses are personally identifiable information (PII) in many jurisdictions.
- Fix approach: Anonymize IPs before logging (e.g., strip last octet), or make logging opt-in. Add a privacy notice.

### Dockerfile Copies Data Directory Including Secrets

- Issue: `Dockerfile` line 33 copies `./data` from the builder stage into the production image. If `data/.env.local` exists in the build context (containing the actual admin password and Google Maps API key), it becomes baked into the Docker image.
- Files: `Dockerfile`
- Impact: Secrets embedded in container images are accessible to anyone who can pull the image or inspect the layer history.
- Fix approach: Use Docker secrets or runtime environment variables. Add `data/.env.local` to `.dockerignore`.

## Known Bugs

### Place-Details Route Has Structural Bug

- Symptoms: `src/app/api/place-details/route.ts` has confusing brace structure between lines 113-147. The `try` block (started at line 77) has its closing `}` at line 147, but the code between lines 143-146 (saving `google_maps_url`) references `place` which is defined only inside the `else` block at line 123. If `detailsData.status !== "OK"`, the code at lines 144-145 will throw a ReferenceError because `place` is not in scope.
- Files: `src/app/api/place-details/route.ts`
- Trigger: Querying a place where Google Places search returns results but the details API returns a non-OK status.
- Workaround: The search results often have enough data to return partial results, but the `google_maps_url` save will crash.
- Fix approach: Move the `google_maps_url` write inside both branches of the if/else, or declare `let place` at the top of the try block.

### estimateTravelTime Assumes Driving Always

- Symptoms: `src/lib/utils.ts` `estimateTravelTime` function (lines 103-131) always assumes driving ("min drive" label). For walking, transit, or non-motorized activities, this is misleading.
- Files: `src/lib/utils.ts`
- Trigger: Any pair of items where coordinates are set and distance exceeds 0.5km.
- Fix approach: Accept a transport mode parameter or infer from the activity text.

## Performance Bottlenecks

### OSRM Route Fetching on Every Day Filter Change

- Problem: The `ItineraryMap.tsx` (lines 669-702) re-fetches OSRM routes for ALL items in filtered days whenever `filteredDays` changes. For deep itineraries, this triggers up to N parallel `fetch("/api/routing")` calls.
- Files: `src/components/map/ItineraryMap.tsx`, `src/app/api/routing/route.ts`
- Cause: No persistent route cache. The in-memory `routeCoords` Map resets on page reload. The backend cache is also in-memory (line 11 of `routing/route.ts`).
- Improvement path: Persist route results to the SQLite database so they survive page reloads and server restarts.

### Place Photo Binary Blob Storage in SQLite

- Problem: Photos fetched from Google Places API are stored as BLOBs in the SQLite database (`src/app/api/place-photo/[ref]/route.ts`, line 58). SQLite is not designed for blob storage at scale. The database file will grow unboundedly.
- Files: `src/app/api/place-photo/[ref]/route.ts`, `src/lib/db.ts` (lines 143-148)
- Cause: Every photo reference gets cached indefinitely. There is no eviction policy or size limit on the `place_photos` table.
- Improvement path: Store photos on the filesystem or use a CDN. Add an LRU eviction policy or TTL on cached photos.

## Fragile Areas

### ItineraryItems Schema Evolution Code

- Files: `src/lib/db.ts` (lines 70-127)
- Why fragile: The code checks column existence via `PRAGMA table_info` and conditionally adds columns or rebuilds the table. Multiple startup-run migrations are stacked in the same file with no version tracking. A schema change that requires a second table rebuild would run the rebuild code every startup once the columns are already nullable, since the check is `if (latCol?.notnull || lngCol?.notnull)` — if the migration itself succeeds, this condition will be false on subsequent restarts, but any new migration added after line 127 runs unconditionally.
- Safe modification: Add a `schema_version` table. Only run migrations when the stored version is below the target. Use explicit version numbers.
- Test coverage: None.

### Drag-and-Drop Reorder with @dnd-kit Version Mismatch

- Files: `package.json` — `@dnd-kit/core` v6.3.1, `@dnd-kit/sortable` v10.0.0, `@dnd-kit/utilities` v3.2.2
- Why fragile: Three separate packages from the `@dnd-kit` monorepo are pinned at three different major versions (v3, v6, v10). Major version mismatches between tightly coupled packages can cause runtime errors or unexpected behavior. Sortable v10 expects core v10 APIs.
- Test coverage: No drag-and-drop tests exist.

### Google Places API Cache Invalidation

- Files: `src/app/api/place-details/route.ts`, `src/app/api/admin/location-search/route.ts`
- Why fragile: Place details are cached for 30 days (`CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000`). Location search results for 24 hours. There is no mechanism to manually invalidate or refresh cached data. Stale business hours, closed businesses, or changed addresses will not be reflected.
- Safe modification: Add a `forceRefresh` query parameter that bypasses cache. Add admin UI button to clear caches.

## Scaling Limits

### SQLite Concurrency

- Current capacity: SQLite with WAL mode supports concurrent reads but serializes writes. This works fine for a single-user admin tool.
- Limit: With multiple concurrent admin users or under heavy write load, write contention will cause performance degradation.
- Scaling path: Migrate to a client-server database (PostgreSQL, SQLite via Litestream, or Turso for edge compatibility).

### In-Memory Caches

- Current capacity: The OSRM route cache in `routing/route.ts` is capped at 200 entries. The rate limiter is in-memory.
- Limit: Both are per-instance and non-persistent. Lost on restart. Not shared across replicas.
- Scaling path: Use the SQLite database for persistence.

## Dependencies at Risk

### @dnd-kit Version Mismatch

- Risk: `@dnd-kit/core` at v6.3.1, `@dnd-kit/sortable` at v10.0.0, `@dnd-kit/utilities` at v3.2.2. These are from the same monorepo and should share a major version.
- Impact: Undefined behavior, missing exports, type errors, or runtime crashes on drag-and-drop interactions.
- Migration plan: Align all three packages to the same major version (preferably v6 or migrate fully to v10).

### Next.js 16.2.6 (Bleeding Edge)

- Risk: Next.js 16.2.6 was released very recently (writing this at the tail end of the 16.x lifecycle). React 19.2.4 is also very new. The combination of bleeding-edge versions with no pinned minor resolution may introduce regressions.
- Impact: Unexpected build failures, API deprecation warnings, or incompatibility with ecosystem packages.
- Migration plan: Pin exact versions. Watch the Next.js changelog for patch releases.

## Missing Critical Features

### No Tests

- Problem: The codebase has zero tests. No unit tests, no integration tests, no E2E tests. No `jest.config`, `vitest.config`, or any `*.test.*` files exist anywhere in the project.
- Blocks: Confident refactoring of any component. The admin page monolith (1475 lines) and map component (973 lines) cannot be safely split without tests to catch regressions.
- Risk: Any change risks breaking existing functionality with no safety net.

### No Error Boundaries

- Problem: The React app has no error boundaries (`componentDidCatch` or `<Suspense>` error boundaries). If any component throws during rendering, the entire UI crashes.
- Files: `src/app/layout.tsx` — standard layout with no error boundary wrapping
- Risk: A crash in the map component or admin dashboard takes down the entire page.

### No Input Validation Library

- Problem: All input validation is done manually via inline checks (e.g., `if (!body.name || body.latitude === undefined)` in `admin/locations/route.ts`). No schema validation library (Zod, Yup) is used.
- Files: All admin route handlers
- Risk: Inconsistent validation. Missing edge cases. TypeScript types don't enforce runtime validation.

## Test Coverage Gaps

- **No tests at all** in the project. Every area is uncovered.

---

*Concerns audit: 2026-05-29*
