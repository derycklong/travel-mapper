# Coding Conventions

**Analysis Date:** 2026-05-29

## Naming Patterns

**Files:**
- PascalCase for React components: `ItineraryMap.tsx`, `HeroSection.tsx`, `AdminLocationMap.tsx`
- camelCase for utilities and libraries: `utils.ts`, `env.ts`, `constants.ts`, `auth.ts`
- kebab-case for route files within `app/` directories: `place-photo/[ref]/route.ts`, `map-tiles/[style]/[z]/[x]/[y]/route.ts`
- Co-located route handlers named `route.ts` inside their route segment directories

**Functions:**
- camelCase for all functions and methods: `getDayColor()`, `formatTime()`, `createAdminToken()`
- PascalCase for React components: `ItineraryCard`, `DayTimeline`, `ItineraryApp`
- Factory/constructor functions use camelCase: `createIconMarker()`, `createAdminToken()`

**Variables:**
- camelCase for all variables: `activeDayFilter`, `scrollContainerRef`, `editItemForm`
- Boolean state variables prefixed with `is` or `has`: `isLoading`, `isSelected`, `isHovered`, `isDragging`, `isCollapsed`, `hasFitInitial`
- Boolean variables not used in state also use `is` prefix: `isDesktop`, `disposed`
- Constants in UPPER_SNAKE_CASE: `TRIP_TITLE`, `ENV_PATH`, `DB_PATH`, `CACHE_TTL_MS`, `RATE_MAX` (defined in `src/lib/constants.ts` and individual files)

**Types:**
- PascalCase for interfaces and types: `ItineraryDay`, `DayWithItems`, `CategoryIcon`, `AdminLocationMapProps`
- Interface names without `I` prefix (bare PascalCase, not `IItineraryDay`)
- Discriminated union for `CategoryIcon` using literal string union type
- Props interface defined above the component (or inline in the component file)

## Code Style

**Formatting:**
- No Prettier config detected (no `.prettierrc` file)
- Formatting handled by ESLint alone via `eslint.config.mjs`
- Inline styles used pervasively with `style={{ }}` JSX syntax alongside Tailwind classes

**Linting:**
- ESLint 9 with flat config (`eslint.config.mjs`)
- Uses `eslint-config-next` with `core-web-vitals` and `typescript` presets
- Config is minimal (16 lines) — mostly default Next.js rules

**Indentation:**
- TypeScript/TSX files use 2-space indentation

## Import Organization

**Order:**
1. React / Next.js framework imports (e.g., `"react"`, `"next/server"`, `"next/navigation"`)
2. Third-party library imports (e.g., `"zustand"`, `"leaflet"`, `"react-leaflet"`, `"lucide-react"`, `"framer-motion"`, `"@dnd-kit/core"`, `"vaul"`, `"sonner"`, `"clsx"`, `"class-variance-authority"`)
3. Internal aliased imports (`@/lib/utils`, `@/store/itinerary`, `@/lib/types`, `@/lib/db`, etc.)
4. Relative sibling imports (`./HeroSection`, `./DayTimeline`, `./ItineraryCard`)

**Grouping style:** Groups separated by blank lines, each group sorted alphabetically within.

**Path Aliases:**
- `@/*` maps to `./src/*` (configured in `tsconfig.json` paths)

## Error Handling

**Patterns:**
- API route errors return `NextResponse.json({ error: "message" }, { status: N })` with appropriate HTTP status codes (400, 401, 500, 502, 429, 404)
- Try/catch blocks in API routes with `console.error` logging and 500 fallback
- Client-side fetch errors caught in try/catch with `toast.error()` user feedback via `sonner`
- Helper function `unauthorized()` returns 401 response (used across admin API routes)
- Early return pattern with `if` guards for validation failures

```typescript
// src/app/api/admin/days/route.ts — pattern example
if (!validateAdmin(request)) return unauthorized();
const { searchParams } = new URL(request.url);
const id = searchParams.get("id");
if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
```

- Network-level error handling with separate try/catch around fetch, then around response JSON parse:

```typescript
// src/app/admin/page.tsx — pattern example
try {
  res = await fetch("/api/admin/locations", { method, headers, body });
} catch {
  toast.error("Network error — could not reach the server");
  return;
}
try {
  data = await res.json();
} catch {
  toast.error("Server returned an invalid response");
  return;
}
```

## Logging

**Framework:** `console.log` and `console.error` only (no structured logging library)

**Patterns:**
- `console.error` for caught exceptions: `console.error("Failed to load admin data:", e)`
- Tagged console logs with context prefix: `console.log("[place-details] CACHE HIT:", q)`, `console.log("[VISIT] ...")` in middleware
- `console.error` with `[Map]`, `[place-details]` prefixes in error handlers

## Comments

**When to Comment:**
- JSDoc is NOT used — no functions have JSDoc annotations
- Inline comments explain non-obvious logic (mobile workarounds, cross-browser fixes, layout calculations)
- Comments on complex useEffect side effects explain timing/sequence reasoning
- TODO/HACK/FIXME comments not detected in source code

**JSDoc/TSDoc:**
- Not used. Function signatures rely on TypeScript types for documentation.

## Function Design

**Size:**
- Utility functions are small and focused (1-30 lines): `formatTime()`, `hasLocation()`, `getCategoryAccent()`
- React components range widely — `ItineraryMap.tsx` is 974 lines, `AdminDashboard` is 1476 lines
- Route handler files are moderate (50-150 lines typically)

**Parameters:**
- Props interfaces defined inline at the component, or as a named interface
- Callback props use `useCallback` wrapping for stable references
- Boolean props/flags use descriptive names: `isLast`, `asChild`

**Return Values:**
- `null` for empty state rendering (JSX return)
- `NextResponse.json({...})` for all API route returns
- Early `return null` pattern for components that render nothing (e.g., `MapController`, `MapClickHandler`)

## Module Design

**Exports:**
- Named exports for all components and utilities: `export function ItineraryApp(...)`, `export const MAP_DEFAULT_CENTER = ...`
- One `default export` only for page components (Next.js App Router convention): `src/app/page.tsx`, `src/app/admin/page.tsx`, `src/app/(auth)/admin/login/page.tsx`
- `AdminDashboard` in `src/app/admin/page.tsx` uses `export default function AdminDashboard()`
- Libraries like `db` use `export default db`

**Barrel Files:**
- Not used. Each module imported directly from its file.

## State Management

**Pattern:**
- Zustand store at `src/store/itinerary.ts` for global UI state (days, selected items, theme, filters)
- Local `useState` for component-specific form state (admin page edit forms, filters, search)
- `useRef` for DOM references and mutable values that shouldn't trigger re-renders (scroll positions, timer handles, previous values)
- `useCallback` wrapping for callbacks passed as dependencies to hooks or child components

**Store access pattern:**
- Selective subscription: `const selectedDayId = useItineraryStore((s) => s.selectedDayId)`
- Direct store access outside React via `useItineraryStore.getState()`

## Component Architecture

**Directives:**
- Client components start with `"use client"` directive
- Server components (pages) do NOT use `"use client"` — data is fetched directly in the server component

**Dynamic Imports:**
- `next/dynamic` used for Leaflet map components (SSR disabled): `const ItineraryMap = dynamic(() => import("../map/ItineraryMap").then((mod) => mod.ItineraryMap), { ssr: false })`

**CSS Strategy:**
- Tailwind CSS v4 with `@import "tailwindcss"` and `@theme inline` for design tokens
- CSS custom properties for runtime theming (light/dark): `var(--color-bg)`, `var(--color-card)`, `var(--color-accent)`
- Theme toggled via `data-theme` attribute on `<html>`
- Inline `style={}` props used alongside Tailwind utility classes

---

*Convention analysis: 2026-05-29*
