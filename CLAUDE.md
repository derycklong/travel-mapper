<!-- GSD:project-start source:PROJECT.md -->
## Project

**Travel Mapper**

A personal travel itinerary and map visualization app. It displays an interactive map with pinned locations organized by day, uses Google Places for location details and photos, and provides OSRM road-network routing between stops. The admin panel lets the user manage locations, days, items, and their order via drag-and-drop.

**Core Value:** The map reliably shows the day's planned locations with accurate routing, and the admin panel lets the user manage their itinerary content.

### Constraints

- **Tech stack**: Must remain Next.js + React + SQLite + Leaflet — no framework migration
- **Production stability**: Existing functionality must not break during refactoring
- **Docker**: App deploys via Docker multi-stage build
- **Admin auth**: Currently weak (base64 token) — consider hardening during refactoring
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Languages
- TypeScript 5.x - All source code (frontend and backend API routes) in `src/`
- CSS - Tailwind CSS v4 with custom theme variables in `src/app/globals.css`
- SQL - Embedded SQLite queries in `src/lib/db.ts` and API route files
## Runtime
- Node.js 22 (specified in `Dockerfile` as `node:22-slim`)
- Next.js 16.2.6 runtime
- npm
- Lockfile: `package-lock.json` present (308KB)
## Frameworks
- Next.js 16.2.6 - Full-stack framework (App Router, server components, API routes)
- React 19.2.4 - UI library
- Tailwind CSS v4 - Utility-first CSS framework
- Leaflet 1.9.4 - Interactive map rendering
- React-Leaflet 5.0.0 - React bindings for Leaflet
- Supercluster 8.0.1 - Geospatial point clustering (for map markers)
- Zustand 5.0.13 - Lightweight global state store (`src/store/itinerary.ts`)
- Radix UI primitives - Dialog, Dropdown Menu, Label, Slot, Toast
- Vaul 1.1.2 - Drawer component (mobile bottom sheet)
- Sonner 2.0.7 - Toast notifications
- Framer Motion 12.40.0 - Animation library
- Lucide React 1.16.0 - Icon library
- dnd-kit - Drag-and-drop (core, sortable, utilities)
- class-variance-authority 0.7.1 - Component variant management
- clsx 2.1.1 + tailwind-merge 3.6.0 - Class name utilities
- Not detected - No test framework configured in `package.json`
- TypeScript 5.x - Type checking
- ESLint 9.x - Linting with `eslint-config-next` (core-web-vitals + TypeScript rules)
- tsx 4.22.3 - TypeScript execution for scripts (`scripts/seed.ts`)
- PostCSS with `@tailwindcss/postcss` plugin - CSS processing
## Key Dependencies
- `better-sqlite3` 12.10.0 - Synchronous SQLite3 driver for Node.js; used as the primary data store
- `next` 16.2.6 - Application framework and server
- `leaflet` + `react-leaflet` - Map rendering; requires Leaflet CSS imported in `globals.css`
- `date-fns` 4.3.0 - Date formatting (though mostly using manual `toLocaleDateString`)
- `zustand` 5.0.13 - Client-side state management for itinerary data, selection, and theme
## Configuration
- Environment variables loaded from `data/.env.local` via custom `src/lib/env.ts` loader (reads file at runtime, not `process.env`)
- Auto-creates `data/.env.local` with defaults on first boot
- Two variables required: `ADMIN_PASSWORD` and `GOOGLE_MAPS_API_KEY`
- Also supports `process.env` through Docker (e.g., `-e GOOGLE_MAPS_API_KEY=...`)
- `ADMIN_PASSWORD` - Password for /admin login (default fallback: "hokkaido2020" in `src/lib/constants.ts`)
- `GOOGLE_MAPS_API_KEY` - Google Places API key
- `tsconfig.json` - TypeScript config (target ES2017, strict mode, path alias `@/*` -> `./src/*`)
- `next.config.ts` - Next.js config (allows all remote images, disables dev indicators)
- `eslint.config.mjs` - ESLint flat config with Next.js vitals + TypeScript rules
- `postcss.config.mjs` - PostCSS with Tailwind v4 plugin
- `.dockerignore` - Excludes node_modules, .next, .env files
## Platform Requirements
- Node.js v20+ (v22 recommended)
- npm
- Google Maps API key with Places API enabled
- Port 1337 used by default (`npm run dev -p 1337`)
- Docker (multi-stage build in `Dockerfile`)
- Node.js 22-slim runtime
- Persistent volume at `/app/data` for SQLite database
- Exposes port 3000 (mapped externally)
## CSS Architecture
- Dark mode via `[data-theme="dark"]` attribute (not Tailwind's built-in `dark:`)
- Custom semantic colors: `--color-bg`, `--color-card`, `--color-accent`, `--color-food`, etc.
- All radii customized (`--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-xl`)
- Leaflet CSS imported globally alongside Tailwind
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Naming Patterns
- PascalCase for React components: `ItineraryMap.tsx`, `HeroSection.tsx`, `AdminLocationMap.tsx`
- camelCase for utilities and libraries: `utils.ts`, `env.ts`, `constants.ts`, `auth.ts`
- kebab-case for route files within `app/` directories: `place-photo/[ref]/route.ts`, `map-tiles/[style]/[z]/[x]/[y]/route.ts`
- Co-located route handlers named `route.ts` inside their route segment directories
- camelCase for all functions and methods: `getDayColor()`, `formatTime()`, `createAdminToken()`
- PascalCase for React components: `ItineraryCard`, `DayTimeline`, `ItineraryApp`
- Factory/constructor functions use camelCase: `createIconMarker()`, `createAdminToken()`
- camelCase for all variables: `activeDayFilter`, `scrollContainerRef`, `editItemForm`
- Boolean state variables prefixed with `is` or `has`: `isLoading`, `isSelected`, `isHovered`, `isDragging`, `isCollapsed`, `hasFitInitial`
- Boolean variables not used in state also use `is` prefix: `isDesktop`, `disposed`
- Constants in UPPER_SNAKE_CASE: `TRIP_TITLE`, `ENV_PATH`, `DB_PATH`, `CACHE_TTL_MS`, `RATE_MAX` (defined in `src/lib/constants.ts` and individual files)
- PascalCase for interfaces and types: `ItineraryDay`, `DayWithItems`, `CategoryIcon`, `AdminLocationMapProps`
- Interface names without `I` prefix (bare PascalCase, not `IItineraryDay`)
- Discriminated union for `CategoryIcon` using literal string union type
- Props interface defined above the component (or inline in the component file)
## Code Style
- No Prettier config detected (no `.prettierrc` file)
- Formatting handled by ESLint alone via `eslint.config.mjs`
- Inline styles used pervasively with `style={{ }}` JSX syntax alongside Tailwind classes
- ESLint 9 with flat config (`eslint.config.mjs`)
- Uses `eslint-config-next` with `core-web-vitals` and `typescript` presets
- Config is minimal (16 lines) — mostly default Next.js rules
- TypeScript/TSX files use 2-space indentation
## Import Organization
- `@/*` maps to `./src/*` (configured in `tsconfig.json` paths)
## Error Handling
- API route errors return `NextResponse.json({ error: "message" }, { status: N })` with appropriate HTTP status codes (400, 401, 500, 502, 429, 404)
- Try/catch blocks in API routes with `console.error` logging and 500 fallback
- Client-side fetch errors caught in try/catch with `toast.error()` user feedback via `sonner`
- Helper function `unauthorized()` returns 401 response (used across admin API routes)
- Early return pattern with `if` guards for validation failures
- Network-level error handling with separate try/catch around fetch, then around response JSON parse:
## Logging
- `console.error` for caught exceptions: `console.error("Failed to load admin data:", e)`
- Tagged console logs with context prefix: `console.log("[place-details] CACHE HIT:", q)`, `console.log("[VISIT] ...")` in middleware
- `console.error` with `[Map]`, `[place-details]` prefixes in error handlers
## Comments
- JSDoc is NOT used — no functions have JSDoc annotations
- Inline comments explain non-obvious logic (mobile workarounds, cross-browser fixes, layout calculations)
- Comments on complex useEffect side effects explain timing/sequence reasoning
- TODO/HACK/FIXME comments not detected in source code
- Not used. Function signatures rely on TypeScript types for documentation.
## Function Design
- Utility functions are small and focused (1-30 lines): `formatTime()`, `hasLocation()`, `getCategoryAccent()`
- React components range widely — `ItineraryMap.tsx` is 974 lines, `AdminDashboard` is 1476 lines
- Route handler files are moderate (50-150 lines typically)
- Props interfaces defined inline at the component, or as a named interface
- Callback props use `useCallback` wrapping for stable references
- Boolean props/flags use descriptive names: `isLast`, `asChild`
- `null` for empty state rendering (JSX return)
- `NextResponse.json({...})` for all API route returns
- Early `return null` pattern for components that render nothing (e.g., `MapController`, `MapClickHandler`)
## Module Design
- Named exports for all components and utilities: `export function ItineraryApp(...)`, `export const MAP_DEFAULT_CENTER = ...`
- One `default export` only for page components (Next.js App Router convention): `src/app/page.tsx`, `src/app/admin/page.tsx`, `src/app/(auth)/admin/login/page.tsx`
- `AdminDashboard` in `src/app/admin/page.tsx` uses `export default function AdminDashboard()`
- Libraries like `db` use `export default db`
- Not used. Each module imported directly from its file.
## State Management
- Zustand store at `src/store/itinerary.ts` for global UI state (days, selected items, theme, filters)
- Local `useState` for component-specific form state (admin page edit forms, filters, search)
- `useRef` for DOM references and mutable values that shouldn't trigger re-renders (scroll positions, timer handles, previous values)
- `useCallback` wrapping for callbacks passed as dependencies to hooks or child components
- Selective subscription: `const selectedDayId = useItineraryStore((s) => s.selectedDayId)`
- Direct store access outside React via `useItineraryStore.getState()`
## Component Architecture
- Client components start with `"use client"` directive
- Server components (pages) do NOT use `"use client"` — data is fetched directly in the server component
- `next/dynamic` used for Leaflet map components (SSR disabled): `const ItineraryMap = dynamic(() => import("../map/ItineraryMap").then((mod) => mod.ItineraryMap), { ssr: false })`
- Tailwind CSS v4 with `@import "tailwindcss"` and `@theme inline` for design tokens
- CSS custom properties for runtime theming (light/dark): `var(--color-bg)`, `var(--color-card)`, `var(--color-accent)`
- Theme toggled via `data-theme` attribute on `<html>`
- Inline `style={}` props used alongside Tailwind utility classes
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## Pattern
- **Server components** — Layout, data fetching (API routes), middleware
- **Client components** — Interactive UI (maps, itineraries, admin interactions)
- **API routes** — Backend logic served via Next.js route handlers (no separate backend)
## Layers
### 1. Application Layer (Next.js App Router)
```
```
### 2. Component Layer (src/components/)
```
```
### 3. Data Layer (src/lib/)
```
```
### 4. Store Layer (src/store/)
```
```
### 5. Middleware (src/)
```
```
## Data Flow
```
```
### Page load flow:
### Admin flow:
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
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
