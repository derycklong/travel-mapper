# Travel Mapper

## What This Is

A personal travel itinerary and map visualization app. It displays an interactive map with pinned locations organized by day, uses Google Places for location details and photos, and provides OSRM road-network routing between stops. The admin panel lets the user manage locations, days, items, and their order via drag-and-drop.

## Core Value

The map reliably shows the day's planned locations with accurate routing, and the admin panel lets the user manage their itinerary content.

## Requirements

### Validated

- ✓ Visitor can view itinerary with locations organized by day — existing
- ✓ Visitor can see locations on an interactive Leaflet map — existing
- ✓ Visitor can filter itinerary by day — existing
- ✓ Visitor can view place photos and details from Google Places — existing
- ✓ Visitor can see OSRM road routing between locations — existing
- ✓ Admin can log in with password — existing
- ✓ Admin can manage locations (add, edit, delete, reorder) — existing
- ✓ Admin can manage days and day order — existing
- ✓ Admin can manage itinerary items — existing
- ✓ Admin can drag-and-drop to reorder items — existing
- ✓ Map supports dark/light theme toggle — existing

### Active

- [ ] **ADMIN-01**: Admin page (1475 lines) is split into focused components (DayManager, ItemManager, LocationManager, etc.)
- [ ] **MAP-01**: ItineraryMap component (973 lines) is extracted into focused sub-components and utility files
- [ ] **QUAL-01**: Unit tests exist for critical components to enable safe refactoring

### Out of Scope

- User authentication / multi-user support — not needed for a personal project
- Mobile app — web-only
- Real-time collaboration — not needed

## Context

This is an existing Next.js 16 + React 19 app using SQLite (better-sqlite3) with Leaflet maps. The codebase was mapped and the two largest files — the admin page at `src/app/admin/page.tsx` (1475 lines) and the map component at `src/components/map/ItineraryMap.tsx` (973 lines) — are the primary refactoring targets. There are no tests currently. The `@dnd-kit` packages have a version mismatch (core v6, sortable v10, utilities v3) that should be resolved during refactoring.

## Constraints

- **Tech stack**: Must remain Next.js + React + SQLite + Leaflet — no framework migration
- **Production stability**: Existing functionality must not break during refactoring
- **Docker**: App deploys via Docker multi-stage build
- **Admin auth**: Currently weak (base64 token) — consider hardening during refactoring

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Phase 1: Admin page refactor | Largest monolith first — enables safer subsequent changes | — Pending |
| Phase 2: Map component refactor | Second-largest file, depends on stable data layer | — Pending |
| Phase 3: Test setup (if scoped) | Tests needed before more complex changes | — Pending |
| Fix dnd-kit versions during admin refactor | Sortable v10 is already used; align core/utilities to v10 | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-30 after initialization*
