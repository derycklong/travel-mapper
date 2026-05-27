# Location Dashboard UI Overhaul — Design Spec

**Date:** 2026-05-27
**File:** `src/app/admin/page.tsx`
**Related:** `src/components/admin/AdminLocationMap.tsx`

## Overview

Five coordinated UI improvements to the admin location dashboard:
1. Edit location moves from inline form to modal dialog
2. Search locations grouped with location table; fix overlapping character in search input
3. Merge locations via drag-and-drop between cards
4. Google Maps search becomes a standalone always-visible section
5. Map click updates lat/lng in the edit form; requires manual save

---

## 1. Edit Location → Modal Dialog

### What changes
- The inline edit/add form (currently lines 828-935) moves into a `<Dialog>` component
- Dialog uses Radix UI primitives (already a project dependency)
- Triggered by: "Add Location" button, clicking a location card, or clicking a Google search result

### Dialog structure
- **Header:** "Edit Location" or "Add Location" + Cancel (X) button
- **Body:** Name, Address, Latitude, Longitude inputs (same grid layout as current inline form)
- **Footer:** Save/Update button

Note: Google Maps search is NOT in the dialog. It is a standalone section above the location cards (see section 4).

### State
- `editingLocation` still tracks the location being edited
- Dialog open state derived from `editingLocation !== null`
- Cancel sets `editingLocation` to `null` without saving

### Dependencies
- `@radix-ui/react-dialog` (already installed)
- `X` icon from `lucide-react` (already imported)

---

## 2. Search Locations + Location Table + Overlap Fix

### What changes
- The client-side filter input stays above the location cards list
- Google Maps search moves to its own standalone section (see section 4)
- Both search inputs sit above the scrollable location cards list

### Overlap fix
- Current issue: spinner at `absolute right-2` inside input with `pr-7` causes text overlap on narrow inputs
- Fix: change input padding to `pr-9` and move spinner to `right-2.5`
- Alternative: use `box-sizing` and ensure text truncation with `text-overflow: ellipsis`

---

## 3. Merge Location → Drag-and-Drop

### What changes
- Remove the inline amber merge panel and two `<select>` dropdowns
- Each location card gains a **drag handle** (GripVertical icon from lucide-react)
- Uses `@dnd-kit/core` (already installed and used for itinerary items)

### Interaction
1. User grabs a location card by its drag handle
2. User drags it over another location card
3. Target card highlights with amber border/glow (`border-amber-400 bg-amber-50`)
4. User drops → confirmation dialog: "Merge [Source Name] into [Target Name]? This cannot be undone."
5. On confirm → calls existing `mergeLocations` API
6. On cancel → no action, card returns to original position

### Drag configuration
- `PointerSensor` with `distance: 5` activation constraint (same as itinerary)
- `closestCenter` collision detection
- Only location cards are draggable (not the map or other UI elements)

### State changes
- Remove: `showMerge`, `mergeSource`, `mergeTarget`, `isMerging`
- Add: `mergeSourceId` (set on drag end before confirmation), `showMergeConfirm` (boolean)
- `mergeLocations` function stays the same, called after confirmation

---

## 4. Google Search → Standalone Section

### What changes
- Google Maps search is no longer nested inside the edit form
- Becomes a standalone section above the location cards list, always visible
- Non-collapsible (no toggle button)

### Layout
```
┌─────────────────────────────────────────────┐
│ [Search...]        [Region] [🔍 Search]     │
├─────────────────────────────────────────────┤
│ Results (when available):                   │
│ ┌─────────────┐ ┌─────────────┐            │
│ │ Place Name  │ │ Place Name  │            │
│ │ Address     │ │ Address     │            │
│ │ lat, lng    │ │ lat, lng    │            │
│ └─────────────┘ └─────────────┘            │
└─────────────────────────────────────────────┘
```

### Behavior
- Search input + region input + search button in a flex row
- Results display as a scrollable list of cards (max 6 results visible, scrollable)
- Clicking a result sets `editingLocation` with the result data and opens the edit modal
- Loading spinner shows during search (overlap fixed per section 2)

---

## 5. Map Click → Update Form Fields (Manual Save)

### What changes
- When the edit modal is open (`editingLocation !== null`), clicking the map updates the lat/lng fields in the modal
- Does NOT auto-save — user must click "Update Location" to persist

### Logic change in `onPick`
Current behavior:
```ts
onPick={(latitude, longitude) => {
  setEditingLocation({ id: "", name: "", address: null, latitude, longitude });
  setFlyToKey((k) => k + 1);
}}
```

New behavior:
```ts
onPick={(latitude, longitude) => {
  setEditingLocation((prev) => {
    if (prev) {
      // Modal is open — update coordinates on existing location
      return { ...prev, latitude, longitude };
    }
    // No modal open — start new location
    return { id: "", name: "", address: null, latitude, longitude };
  });
  setFlyToKey((k) => k + 1);
}}
```

### User feedback
- When map click updates coordinates on an existing location, show a toast: "Coordinates updated — click Update Location to save"
- The lat/lng input fields in the modal reflect the new values immediately

---

## Right Panel Layout (After Changes)

The right panel (previously cluttered with merge UI, edit form, and nested Google search) becomes:

```
┌─────────────────────────────────┐
│ [Add Location] [Filter...]      │  ← Toolbar (fixed)
├─────────────────────────────────┤
│ Google Maps Search              │  ← Standalone section
│ [Search...] [Region] [🔍]       │
│ [Results...]                    │
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │ 📍 Location 1          [✏🗑]│ │
│ │ 📍 Location 2          [✏🗑]│ │  ← Scrollable cards
│ │ 📍 Location 3          [✏🗑]│ │    (with drag handles)
│ │ ...                         │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

Edit form → Modal overlay
Merge UI → Drag-and-drop on cards

---

## Files Modified

| File | Changes |
|------|---------|
| `src/app/admin/page.tsx` | Major refactor: modal dialog, drag-and-drop merge, standalone Google search, map click logic |
| `src/components/admin/AdminLocationMap.tsx` | No changes needed (onPick handler logic changes in page.tsx) |

## Files Created

| File | Purpose |
|------|---------|
| `src/components/admin/EditLocationDialog.tsx` | Modal dialog component for editing/adding locations |

---

## Risk Assessment

- **Low risk:** Map click logic change (section 5) — small, isolated change
- **Medium risk:** Drag-and-drop merge (section 3) — dnd-kit already used in the project, but card-level drag is new
- **Medium risk:** Modal extraction (section 1) — extracting a large inline form into a component, but Radix Dialog is already used
- **Low risk:** Google search repositioning (section 4) — purely layout change, no API changes
- **Low risk:** Overlap fix (section 2) — CSS-only change
