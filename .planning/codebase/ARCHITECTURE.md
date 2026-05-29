# Architecture

**Last updated:** 2026-05-29
**Project:** Travel Mapper

## Pattern

Next.js 14 App Router (React Server Components by default) with a clear server/client split:

- **Server components** — Layout, data fetching (API routes), middleware
- **Client components** — Interactive UI (maps, itineraries, admin interactions)
- **API routes** — Backend logic served via Next.js route handlers (no separate backend)

## Layers

### 1. Application Layer (Next.js App Router)

```
src/app/
├── (auth)/admin/login/   — Login page (client)
├── admin/                 — Admin dashboard (client, heavy)
├── api/                   — REST API route handlers
│   ├── admin/             — Admin-only endpoints
│   ├── itinerary/         — Public itinerary endpoints
│   ├── routing/           — OSRM road routing
│   ├── place-details/     — Google Places details
│   ├── place-photo/       — Google Places photo proxy
│   ├── map-tiles/         — Map tile proxy
│   └── settings/          — Public settings
└── page.tsx               — Home page (itinerary display)
```

### 2. Component Layer (src/components/)

```
src/components/
├── admin/             — Admin UI components
│   └── AdminLocationMap.tsx
├── itinerary/         — Public itinerary components
│   ├── ItineraryApp.tsx      — Main itinerary shell (client)
│   ├── ItineraryCard.tsx     — Day/location card
│   ├── DayTimeline.tsx       — Timeline view
│   ├── DayFilter.tsx         — Day navigation filter
│   └── HeroSection.tsx       — Page hero
├── map/               — Map components
│   └── ItineraryMap.tsx      — Leaflet map with markers
└── ui/                — Reusable UI primitives
    └── button.tsx
```

### 3. Data Layer (src/lib/)

```
src/lib/
├── db.ts         — SQLite via better-sqlite3
├── auth.ts       — Admin authentication (base64 HMAC)
├── types.ts      — TypeScript type definitions
├── utils.ts      — Utility functions
├── env.ts        — Environment config loader
└── constants.ts  — App-wide constants
```

### 4. Store Layer (src/store/)

```
src/store/
└── itinerary.ts   — Zustand store for itinerary state
```

### 5. Middleware (src/)

```
src/middleware.ts  — Request logging, admin auth gate
```

## Data Flow

```
Browser → Next.js App Router
           ├── Server Components (layout, page shell)
           │   └── fetch → API routes → SQLite
           └── Client Components (maps, itinerary UI)
               ├── Zustand store (client state)
               └── fetch → API routes → SQLite
                           └── External APIs (Google Places, OSRM)
```

### Page load flow:
1. Server renders layout + shell
2. Client hydrates `ItineraryApp.tsx`
3. `ItineraryApp` calls API route `/api/itinerary` to load locations
4. Data flows into Zustand store
5. Map component (`ItineraryMap.tsx`) renders markers from store
6. Day filter and timeline read from store

### Admin flow:
1. Server renders admin layout (client component)
2. Client component calls `/api/admin/login` with password
3. Auth token stored in cookie (base64 HMAC)
4. Subsequent admin API calls authenticated via middleware
5. Admin page manages locations, days, items with drag-and-drop

## Entry Points

| Path | Type | Purpose |
|------|------|---------|
| `src/app/page.tsx` | Server | Home page — renders HeroSection + ItineraryApp |
| `src/app/layout.tsx` | Server | Root layout — fonts, metadata |
| `src/app/(auth)/admin/login/page.tsx` | Client | Admin login page |
| `src/app/admin/page.tsx` | Client | Admin dashboard (1475 lines) |
| `src/app/admin/layout.tsx` | Client | Admin layout with auth check |

## Key Abstractions

- **Zustand store** — Single source of truth for client-side itinerary state; actions for loading, filtering, and manipulating locations/days
- **API routes** — Thin request handlers that call into lib modules; no service layer abstraction between route handler and database
- **Middleware-based auth** — Admin routes gated by middleware checking auth cookie; public routes unrestricted

## Build Order Implications

- Database schema must exist first (SQLite, tables created on app start via DROP/CREATE)
- API routes depend on lib modules
- Client components depend on API routes
- Map component depends on locations data from store
