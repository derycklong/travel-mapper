# Technology Stack

**Analysis Date:** 2026-05-29

## Languages

**Primary:**
- TypeScript 5.x - All source code (frontend and backend API routes) in `src/`

**Secondary:**
- CSS - Tailwind CSS v4 with custom theme variables in `src/app/globals.css`
- SQL - Embedded SQLite queries in `src/lib/db.ts` and API route files

## Runtime

**Environment:**
- Node.js 22 (specified in `Dockerfile` as `node:22-slim`)
- Next.js 16.2.6 runtime

**Package Manager:**
- npm
- Lockfile: `package-lock.json` present (308KB)

## Frameworks

**Core:**
- Next.js 16.2.6 - Full-stack framework (App Router, server components, API routes)
- React 19.2.4 - UI library
- Tailwind CSS v4 - Utility-first CSS framework

**Mapping:**
- Leaflet 1.9.4 - Interactive map rendering
- React-Leaflet 5.0.0 - React bindings for Leaflet
- Supercluster 8.0.1 - Geospatial point clustering (for map markers)

**State Management:**
- Zustand 5.0.13 - Lightweight global state store (`src/store/itinerary.ts`)

**UI Components:**
- Radix UI primitives - Dialog, Dropdown Menu, Label, Slot, Toast
- Vaul 1.1.2 - Drawer component (mobile bottom sheet)
- Sonner 2.0.7 - Toast notifications
- Framer Motion 12.40.0 - Animation library
- Lucide React 1.16.0 - Icon library
- dnd-kit - Drag-and-drop (core, sortable, utilities)
- class-variance-authority 0.7.1 - Component variant management
- clsx 2.1.1 + tailwind-merge 3.6.0 - Class name utilities

**Testing:**
- Not detected - No test framework configured in `package.json`

**Build/Dev:**
- TypeScript 5.x - Type checking
- ESLint 9.x - Linting with `eslint-config-next` (core-web-vitals + TypeScript rules)
- tsx 4.22.3 - TypeScript execution for scripts (`scripts/seed.ts`)
- PostCSS with `@tailwindcss/postcss` plugin - CSS processing

## Key Dependencies

**Critical:**
- `better-sqlite3` 12.10.0 - Synchronous SQLite3 driver for Node.js; used as the primary data store
- `next` 16.2.6 - Application framework and server
- `leaflet` + `react-leaflet` - Map rendering; requires Leaflet CSS imported in `globals.css`

**Infrastructure:**
- `date-fns` 4.3.0 - Date formatting (though mostly using manual `toLocaleDateString`)
- `zustand` 5.0.13 - Client-side state management for itinerary data, selection, and theme

## Configuration

**Environment:**
- Environment variables loaded from `data/.env.local` via custom `src/lib/env.ts` loader (reads file at runtime, not `process.env`)
- Auto-creates `data/.env.local` with defaults on first boot
- Two variables required: `ADMIN_PASSWORD` and `GOOGLE_MAPS_API_KEY`
- Also supports `process.env` through Docker (e.g., `-e GOOGLE_MAPS_API_KEY=...`)

**Required env vars:**
- `ADMIN_PASSWORD` - Password for /admin login (default fallback: "hokkaido2020" in `src/lib/constants.ts`)
- `GOOGLE_MAPS_API_KEY` - Google Places API key

**Build:**
- `tsconfig.json` - TypeScript config (target ES2017, strict mode, path alias `@/*` -> `./src/*`)
- `next.config.ts` - Next.js config (allows all remote images, disables dev indicators)
- `eslint.config.mjs` - ESLint flat config with Next.js vitals + TypeScript rules
- `postcss.config.mjs` - PostCSS with Tailwind v4 plugin
- `.dockerignore` - Excludes node_modules, .next, .env files

## Platform Requirements

**Development:**
- Node.js v20+ (v22 recommended)
- npm
- Google Maps API key with Places API enabled
- Port 1337 used by default (`npm run dev -p 1337`)

**Production:**
- Docker (multi-stage build in `Dockerfile`)
- Node.js 22-slim runtime
- Persistent volume at `/app/data` for SQLite database
- Exposes port 3000 (mapped externally)

## CSS Architecture

**Approach:** Tailwind CSS v4 with `@theme inline` custom properties in `globals.css`
- Dark mode via `[data-theme="dark"]` attribute (not Tailwind's built-in `dark:`)
- Custom semantic colors: `--color-bg`, `--color-card`, `--color-accent`, `--color-food`, etc.
- All radii customized (`--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-xl`)
- Leaflet CSS imported globally alongside Tailwind

---

*Stack analysis: 2026-05-29*
