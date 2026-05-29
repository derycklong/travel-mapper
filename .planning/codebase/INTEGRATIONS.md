# External Integrations

**Analysis Date:** 2026-05-29

## APIs & External Services

**Google Places API:**
- Used for location search (admin), place details (ratings, reviews, photos), and photo proxy
- SDK/Client: Raw `fetch()` calls to REST endpoints (no Google client library)
- Auth: `GOOGLE_MAPS_API_KEY` env var
- Required API sub-services: Places API (Text Search, Place Details, Place Photos)
- Endpoints called:
  - `https://maps.googleapis.com/maps/api/place/textsearch/json` - Location search (`src/app/api/admin/location-search/route.ts`) and place details lookup (`src/app/api/place-details/route.ts`)
  - `https://maps.googleapis.com/maps/api/place/details/json` - Reviews and extended details (`src/app/api/place-details/route.ts`)
  - `https://maps.googleapis.com/maps/api/place/photo` - Photo image proxy (`src/app/api/place-photo/[ref]/route.ts`)

**OSRM (Open Source Routing Machine):**
- Used for road-network route lines between consecutive waypoints on the map
- Endpoint: `https://router.project-osrm.org/route/v1/driving/{coordinates}?geometries=geojson&overview=full`
- No API key required (public service)
- Rate-limited server-side: 30 requests/minute per IP
- In-memory cache: 200 entries with 1-hour TTL
- 10-second timeout on upstream requests
- Max 10 waypoints per request (`src/app/api/routing/route.ts`)

**Map Tile Providers:**
- OpenStreetMap tiles: `https://a.tile.openstreetmap.org/{z}/{x}/{y}.png` - Default light theme
- CARTO dark tiles: `https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png` - Dark theme
- Proxied through Next.js API route (`src/app/api/map-tiles/[style]/[z]/[x]/[y]/route.ts`) with 7-day revalidation and 24-hour cache headers
- User-Agent header set to "Hokkaido Itinerary Map/1.0"

## Data Storage

**Databases:**
- SQLite via `better-sqlite3` 12.10.0
- Connection: Local file at `data/itinerary.db` (WAL mode enabled)
- Client: Direct `better-sqlite3` synchronous calls (no ORM)
- Schema: 6 tables defined in `src/lib/db.ts`:
  - `itinerary_days` - Trip day records
  - `itinerary_items` - Activity items per day
  - `locations` - Normalized location data
  - `settings` - Key-value application settings
  - `place_cache` - Google Places detail results (30-day TTL)
  - `location_search_cache` - Google Places search results (24-hour TTL)
  - `place_photos` - Photo binary data cached as BLOBs (permanent)
- Database file tracked in git (`!data/itinerary.db` in `.gitignore`)

**File Storage:**
- Local filesystem only (`data/` directory for SQLite database and `data/.env.local`)
- No cloud file storage (S3, etc.)

**Caching:**
- SQLite-based cache for Google Places API cost reduction
- In-memory `Map` for OSRM routing results (200 entries, 1-hour TTL)
- Next.js `revalidate` for tile proxy (7 days)

## Authentication & Identity

**Auth Provider:**
- Custom admin authentication (no OAuth, no third-party provider)
- Implementation: Bearer token derived from `admin:{timestamp}` base64-encoded
  - Validation in `src/lib/auth.ts` (token must be < 24 hours old)
  - Token created on login at `/api/admin/login` and stored in `localStorage` and cookie
  - Middleware via `src/app/admin/layout.tsx` checks cookie on admin pages

**Password:**
- Single admin password stored in `data/.env.local` as `ADMIN_PASSWORD`
- Fallback default: "hokkaido2020" (in `src/lib/constants.ts`)
- Password is validated server-side via POST to `/api/admin/login`

## Monitoring & Observability

**Error Tracking:**
- None (no Sentry, DataDog, etc.)
- Errors logged to console only via `console.error()`

**Logs:**
- Console logging for:
  - Visit tracking (`[VISIT]` middleware, `src/middleware.ts`)
  - Cache hits (`CACHE HIT`) and Google fetches (`GOOGLE FETCH`) in `src/app/api/place-details/route.ts`, `src/app/api/admin/location-search/route.ts`, and `src/app/api/place-photo/[ref]/route.ts`
  - General errors via `console.error()`

## CI/CD & Deployment

**Hosting:**
- No cloud hosting configured (Vercel, AWS, etc.)
- Docker-based deployment via multi-stage `Dockerfile`
- Image runs Next.js in production mode (`next start` on port 3000)

**CI Pipeline:**
- None detected (no `.github/workflows/`, no `Jenkinsfile`, etc.)

## Environment Configuration

**Required env vars:**
- `ADMIN_PASSWORD` - Admin login password (loaded from `data/.env.local`)
- `GOOGLE_MAPS_API_KEY` - Google Places API key (loaded from `data/.env.local`)

**Secrets location:**
- `data/.env.local` - Created automatically on first run with defaults
- File is gitignored by `.env*` pattern in `.gitignore`
- Docker can also inject `GOOGLE_MAPS_API_KEY` via `-e` flag

## Webhooks & Callbacks

**Incoming:**
- None

**Outgoing:**
- None

## Browser APIs Used

**Geolocation API:**
- `navigator.geolocation.getCurrentPosition()` in `src/components/map/ItineraryMap.tsx` (`locateUser` function)
- Used to center map on user's current location
- Falls back to toast error on failure

**ResizeObserver:**
- Used in `src/components/map/ItineraryMap.tsx` to handle map container resizing

**localStorage:**
- Theme persistence (`data-theme` attribute, key: `theme`)
- Admin auth token persistence (key: `admin_token`)
- Mobile drawer scroll position (sessionStorage)

## Cache Strategy for API Cost Reduction

| Cache Table | Data | TTL | Calls Saved Per Hit |
|---|---|---|---|
| `place_cache` | Place details (ratings, reviews, photos) | 30 days | 2 API calls (Text Search + Place Details) |
| `location_search_cache` | Admin location search results | 24 hours | 1 API call (Text Search) |
| `place_photos` | Place photo image BLOBs | Permanent (no TTL expiry) | 1 API call (Place Photo) |

---

*Integration audit: 2026-05-29*
