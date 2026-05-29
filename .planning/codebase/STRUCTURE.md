# Structure

**Last updated:** 2026-05-29
**Project:** Travel Mapper

## Directory Layout

```
travel-mapper/
├── .planning/                  # GSD planning artifacts
│   └── codebase/               # Codebase documentation (this folder)
├── .claude/                    # Claude Code config (per-project)
├── docker/                     # Docker configuration
│   └── Dockerfile
├── public/                     # Static assets
├── data/                       # SQLite database files (mounted in Docker)
├── src/                        # Application source
│   ├── app/                    # Next.js App Router pages & API
│   │   ├── (auth)/             # Auth route group
│   │   │   └── admin/login/
│   │   ├── admin/              # Admin dashboard
│   │   ├── api/                # REST API route handlers
│   │   │   ├── admin/          # Admin-only endpoints
│   │   │   │   ├── days/
│   │   │   │   ├── items/
│   │   │   │   ├── locations/
│   │   │   │   ├── login/
│   │   │   │   └── settings/
│   │   │   ├── itinerary/
│   │   │   ├── map-tiles/...
│   │   │   ├── place-details/
│   │   │   ├── place-photo/...
│   │   │   ├── routing/
│   │   │   └── settings/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/             # React components
│   │   ├── admin/
│   │   ├── itinerary/
│   │   ├── map/
│   │   └── ui/
│   ├── lib/                    # Shared utilities & data access
│   │   ├── auth.ts
│   │   ├── constants.ts
│   │   ├── db.ts
│   │   ├── env.ts
│   │   ├── types.ts
│   │   └── utils.ts
│   ├── store/                  # Zustand state management
│   │   └── itinerary.ts
│   └── middleware.ts
├── package.json
├── next.config.ts
├── tsconfig.json
├── postcss.config.mjs
└── tailwind.config.ts
```

## Key File Locations

### Configuration

| File | Purpose |
|------|---------|
| `package.json` | Dependencies and scripts (Next.js 14, React 18) |
| `next.config.ts` | Next.js configuration (images, webpack, env) |
| `tsconfig.json` | TypeScript configuration |
| `tailwind.config.ts` | Tailwind CSS configuration |
| `postcss.config.mjs` | PostCSS configuration |
| `docker/Dockerfile` | Production Docker build |

### Source Files by Size (most significant)

| File | Lines | Role |
|------|-------|------|
| `src/app/admin/page.tsx` | ~1475 | Admin dashboard (monolith) |
| `src/lib/db.ts` | ~200 | Database schema + queries |
| `src/lib/types.ts` | ~150 | Type definitions |
| `src/components/itinerary/ItineraryApp.tsx` | ~250 | Main itinerary client component |
| `src/components/map/ItineraryMap.tsx` | ~200 | Leaflet map with markers |
| `src/app/api/admin/locations/route.ts` | ~120 | Location CRUD API |
| `src/middleware.ts` | ~60 | Request middleware |

## Naming Conventions

- **Files:** kebab-case (`itinerary-card.tsx`, `route.ts`, `db.ts`)
- **Components:** PascalCase (`ItineraryMap`, `AdminLocationMap`, `HeroSection`)
- **API routes:** Named `route.ts` per Next.js App Router convention
- **Types:** PascalCase (`ItineraryDay`, `Location`, `ItineraryItem`)
- **Functions:** camelCase (`loadItinerary`, `authenticate`)

## File Ownership Patterns

- **Route handlers** co-located with their route in `src/app/api/`
- **Components** organized by feature domain in `src/components/`
- **Shared logic** in `src/lib/` (no sub-domain splitting)
- **State management** in `src/store/` (single store file)
- No `services/` or `hooks/` directories — patterns have not been extracted yet
