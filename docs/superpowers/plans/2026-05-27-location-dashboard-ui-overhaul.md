# Location Dashboard UI Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the admin location dashboard with modal editing, drag-and-drop merge, standalone Google search, and map-click-to-edit functionality.

**Architecture:** Extract the inline edit form into a Radix Dialog component, extract Google search into a standalone component, add dnd-kit drag-and-drop for merge between location cards, and update the map click handler to update form fields instead of creating new locations when editing.

**Tech Stack:** React 19, Next.js 16 App Router, Radix Dialog, @dnd-kit/core, Leaflet/react-leaflet, Tailwind CSS v4, sonner (toasts), lucide-react (icons)

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `src/components/admin/EditLocationDialog.tsx` | Create | Modal dialog for adding/editing locations with name, address, lat/lng inputs |
| `src/components/admin/GoogleLocationSearch.tsx` | Create | Standalone Google Maps search section with search bar, region filter, results list |
| `src/app/admin/page.tsx` | Modify | Remove inline edit form and nested Google search, add dialog, drag-and-drop merge, update map click logic |

---

### Task 1: Create EditLocationDialog Component

**Files:**
- Create: `src/components/admin/EditLocationDialog.tsx`

- [ ] **Step 1: Create the EditLocationDialog component**

```tsx
// src/components/admin/EditLocationDialog.tsx
"use client";

import { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { Location } from "@/lib/types";

interface EditLocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  location: Location | null;
  onSave: () => void;
  onCancel: () => void;
}

export function EditLocationDialog({
  open,
  onOpenChange,
  location,
  onSave,
  onCancel,
}: EditLocationDialogProps) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  useEffect(() => {
    if (location && open) {
      setName(location.name);
      setAddress(location.address || "");
      setLatitude(String(location.latitude));
      setLongitude(String(location.longitude));
    }
  }, [location, open]);

  const handleSave = () => {
    if (!location) return;
    const lat = Number(latitude);
    const lng = Number(longitude);
    if (isNaN(lat) || isNaN(lng)) {
      return;
    }
    // Update the location object via a synthetic event
    (location as any).name = name;
    (location as any).address = address || null;
    (location as any).latitude = lat;
    (location as any).longitude = lng;
    onSave();
  };

  if (!location) return null;

  const isEditing = !!location.id;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" />
        <Dialog.Content className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-[var(--color-border)]">
          <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--color-border)]">
            <Dialog.Title className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
              {isEditing ? "Edit Location" : "Add Location"}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" aria-label="Close">
                <X className="w-4 h-4" style={{ color: "var(--color-muted)" }} />
              </button>
            </Dialog.Close>
          </div>

          <div className="p-5 space-y-3">
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: "var(--color-muted)" }}>Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Location name"
                className="w-full h-9 px-3 rounded-lg border text-sm"
                style={{ borderColor: "var(--color-border)", background: "var(--color-card)", color: "var(--color-text)" }}
                autoFocus
              />
            </div>

            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: "var(--color-muted)" }}>Address</label>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Address"
                className="w-full h-9 px-3 rounded-lg border text-sm"
                style={{ borderColor: "var(--color-border)", background: "var(--color-card)", color: "var(--color-text)" }}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: "var(--color-muted)" }}>Latitude</label>
                <input
                  type="number"
                  step="any"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="Latitude"
                  className="w-full h-9 px-3 rounded-lg border text-sm"
                  style={{ borderColor: "var(--color-border)", background: "var(--color-card)", color: "var(--color-text)" }}
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: "var(--color-muted)" }}>Longitude</label>
                <input
                  type="number"
                  step="any"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="Longitude"
                  className="w-full h-9 px-3 rounded-lg border text-sm"
                  style={{ borderColor: "var(--color-border)", background: "var(--color-card)", color: "var(--color-text)" }}
                />
              </div>
            </div>
          </div>

          <div className="px-5 pb-5">
            <button
              onClick={handleSave}
              disabled={!name.trim()}
              className={`w-full h-10 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 ${
                isEditing
                  ? "bg-[#4285F4] text-white hover:bg-[#3367d6]"
                  : "bg-[#1a1a1a] text-white hover:bg-[#333]"
              }`}
            >
              {isEditing ? "Update Location" : "Save Location"}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit src/components/admin/EditLocationDialog.tsx`
Expected: No errors (or only unrelated errors from other files)

---

### Task 2: Create GoogleLocationSearch Component

**Files:**
- Create: `src/components/admin/GoogleLocationSearch.tsx`

- [ ] **Step 1: Create the GoogleLocationSearch component**

```tsx
// src/components/admin/GoogleLocationSearch.tsx
"use client";

import { useState, useRef, useCallback } from "react";
import { Search } from "lucide-react";
import { toast } from "sonner";
import type { Location } from "@/lib/types";

interface GoogleLocationSearchProps {
  token: string | null;
  onSelectResult: (result: { name: string; address: string; latitude: number; longitude: number }) => void;
}

interface SearchResult {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

export function GoogleLocationSearch({ token, onSelectResult }: GoogleLocationSearchProps) {
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const lastSearchRef = useRef(0);

  const search = useCallback(async () => {
    if (!query.trim() || !token) return;
    const now = Date.now();
    if (now - lastSearchRef.current < 500) return;
    lastSearchRef.current = now;
    setIsSearching(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const params = new URLSearchParams({ q: query });
      if (region.trim()) params.set("region", region.trim());
      const res = await fetch(`/api/admin/location-search?${params}`, { headers });
      const data = await res.json();
      if (res.ok) {
        setResults(data.results || []);
      } else {
        toast.error(data.error || "Location search failed");
      }
    } finally {
      setIsSearching(false);
    }
  }, [query, region, token]);

  return (
    <div className="flex-shrink-0 space-y-2">
      <div className="flex gap-1.5">
        <div className="relative flex-1">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") search(); }}
            placeholder="Search Google Maps..."
            className="h-9 w-full pl-3 pr-9 rounded-xl border text-sm"
            style={{ borderColor: "var(--color-border)", background: "var(--color-card)", color: "var(--color-text)" }}
          />
          {isSearching && (
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border-2 border-[#4285F4] border-t-transparent rounded-full animate-spin" />
          )}
        </div>
        <input
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") search(); }}
          placeholder="Region"
          className="h-9 w-20 rounded-xl border text-sm px-2.5"
          style={{ borderColor: "var(--color-border)", background: "var(--color-card)", color: "var(--color-text)" }}
        />
        <button
          onClick={search}
          disabled={isSearching || !query.trim()}
          className="h-9 px-3 rounded-xl bg-[#4285F4] text-white flex items-center gap-1.5 disabled:opacity-50 transition-colors hover:bg-[#3367d6] flex-shrink-0"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="hidden sm:inline text-xs font-medium">Search</span>
        </button>
      </div>

      {results.length > 0 && (
        <div className="max-h-40 overflow-y-auto rounded-xl border divide-y text-xs" style={{ borderColor: "var(--color-border)" }}>
          {results.map((result, i) => (
            <button
              key={`${result.latitude}-${result.longitude}-${i}`}
              onClick={() => onSelectResult(result)}
              className="w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
            >
              <p className="font-medium" style={{ color: "var(--color-text)" }}>{result.name}</p>
              <p className="text-gray-500 truncate">{result.address}</p>
              <p className="text-gray-400 text-[10px] mt-0.5">{result.latitude.toFixed(6)}, {result.longitude.toFixed(6)}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit src/components/admin/GoogleLocationSearch.tsx`
Expected: No errors (or only unrelated errors from other files)

---

### Task 3: Refactor Admin Page — Remove Inline Form, Add Dialog + Google Search

**Files:**
- Modify: `src/app/admin/page.tsx`

- [ ] **Step 1: Add new imports at the top of page.tsx**

After the existing imports, add:

```tsx
import { X, GripVertical } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
```

Note: `GripVertical` may already be imported. `DndContext`, `closestCenter`, `PointerSensor`, `useSensor`, `useSensors`, `DragEndEvent` are already imported (lines 22-27). `Dialog` is new. `X` is new.

- [ ] **Step 2: Add dynamic imports for new components**

After the existing `AdminLocationMap` dynamic import (line 38-41), add:

```tsx
const EditLocationDialog = dynamic(
  () => import("@/components/admin/EditLocationDialog").then((mod) => mod.EditLocationDialog),
  { ssr: false }
);

const GoogleLocationSearch = dynamic(
  () => import("@/components/admin/GoogleLocationSearch").then((mod) => mod.GoogleLocationSearch),
  { ssr: false }
);
```

- [ ] **Step 3: Remove unused state variables**

Remove these state declarations:
- `showSearch` (line 210)
- `showMerge` (line 201)
- `mergeSource` (line 202)
- `mergeTarget` (line 203)
- `isMerging` (line 204)

Keep: `editingLocation`, `locationFilter`, `locationSearch`, `locationSearchRegion`, `locationResults`, `isSearchingLocations`, `flyToKey`

- [ ] **Step 4: Remove the searchLocations callback**

Delete the `searchLocations` function (lines 404-424). It is now handled by `GoogleLocationSearch` component.

- [ ] **Step 5: Remove the mergeLocations callback**

Delete the `mergeLocations` function (lines 498-529). It will be replaced by a new `confirmMerge` function.

- [ ] **Step 6: Update onPick handler to support updating existing location**

Find the `onPick` handler (lines 750-753) and replace with:

```tsx
onPick={(latitude, longitude) => {
  setEditingLocation((prev) => {
    if (prev) {
      toast.success("Coordinates updated — click Update Location to save");
      return { ...prev, latitude, longitude };
    }
    return { id: "", name: "", address: null, latitude, longitude };
  });
  setFlyToKey((k) => k + 1);
}}
```

- [ ] **Step 7: Add merge confirmation state and handler**

Add after the existing state declarations:

```tsx
const [mergeSourceId, setMergeSourceId] = useState("");
const [mergeTargetId, setMergeTargetId] = useState("");
const [showMergeConfirm, setShowMergeConfirm] = useState(false);
```

Add the confirm merge handler after `deleteLocation`:

```tsx
const confirmMerge = useCallback(async () => {
  if (!mergeSourceId || !mergeTargetId) return;
  try {
    const res = await fetch("/api/admin/locations/merge", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sourceId: mergeSourceId, targetId: mergeTargetId }),
    });
    const data = await res.json();
    if (res.ok) {
      toast.success(`Merged "${data.sourceName}" → "${data.targetName}" (${data.affectedItems} items updated)`);
      setMergeSourceId("");
      setMergeTargetId("");
      setShowMergeConfirm(false);
      fetchData();
    } else {
      toast.error(data.error || "Failed to merge locations");
    }
  } catch {
    toast.error("Network error during merge");
  }
}, [mergeSourceId, mergeTargetId, token]);
```

- [ ] **Step 8: Add handleLocationDragEnd for merge**

Add after `confirmMerge`:

```tsx
const handleLocationDragEnd = useCallback(
  (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setMergeSourceId(String(active.id));
    setMergeTargetId(String(over.id));
    setShowMergeConfirm(true);
  },
  []
);
```

- [ ] **Step 9: Add sensors for location drag**

Add a separate sensor for location cards (after the existing `sensors` declaration):

```tsx
const locationSensors = useSensors(
  useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
);
```

- [ ] **Step 10: Replace the entire right panel content (lines 766-985)**

The current right panel section (starting at line 766 `/* Right: Main Content */`) needs to be replaced. Replace everything from line 766 to line 985 (the closing `</div>` of the right panel) with:

```tsx
              {/* Right: Main Content */}
              <div className="p-6 pl-3 min-h-0 flex flex-col gap-4">
                {/* Toolbar */}
                <div className="flex-shrink-0 flex items-center gap-3">
                  <button
                    onClick={() => setEditingLocation({ id: "", name: "", address: null, latitude: 43.0621, longitude: 141.3544 })}
                    className="h-10 px-4 rounded-xl text-sm font-semibold text-white flex items-center gap-2 transition-colors hover:opacity-90"
                    style={{ background: "var(--color-accent)" }}
                  >
                    <Plus className="w-4 h-4" />
                    Add Location
                  </button>
                  <div className="relative flex-1 max-w-xs">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      value={locationFilter}
                      onChange={(e) => setLocationFilter(e.target.value)}
                      placeholder="Filter locations..."
                      className="h-10 w-full pl-9 pr-4 rounded-xl border text-sm"
                      style={{ borderColor: "var(--color-border)", background: "var(--color-card)", color: "var(--color-text)" }}
                    />
                  </div>
                </div>

                {/* Google Maps Search */}
                <GoogleLocationSearch
                  token={token}
                  onSelectResult={(result) => {
                    setEditingLocation({ id: "", name: result.name, address: result.address, latitude: result.latitude, longitude: result.longitude });
                  }}
                />

                {/* Location Cards with Drag-and-Drop */}
                <div className="flex-1 min-h-0">
                  {locations.length === 0 ? (
                    <div className="flex items-center justify-center py-20">
                      <div className="text-center">
                        <MapPin className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                        <p className="text-sm font-medium" style={{ color: "var(--color-text)" }}>No locations yet</p>
                        <p className="text-xs mt-1" style={{ color: "var(--color-muted)" }}>Click the map or "Add Location" to create one</p>
                      </div>
                    </div>
                  ) : (
                    <DndContext
                      sensors={locationSensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleLocationDragEnd}
                    >
                      <div className="space-y-1">
                        {locations.filter((loc) => !locationFilter || loc.name.toLowerCase().includes(locationFilter.toLowerCase())).map((loc) => (
                          <div
                            key={loc.id}
                            data-dnd-id={loc.id}
                            onClick={() => { setEditingLocation(loc); setFlyToKey((k) => k + 1); }}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all border ${
                              editingLocation?.id === loc.id
                                ? "bg-[#4285F4]/5 border-[#4285F4]/30"
                                : "hover:bg-gray-50 dark:hover:bg-gray-800/30 border-transparent"
                            }`}
                          >
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 cursor-grab active:cursor-grabbing touch-none flex-shrink-0"
                              aria-label="Drag to merge"
                            >
                              <GripVertical className="w-4 h-4 text-gray-400" />
                            </div>
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "var(--color-accent-muted)" }}>
                              <MapPin className="w-4 h-4" style={{ color: "var(--color-accent)" }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold truncate" style={{ color: "var(--color-text)" }}>{loc.name}</p>
                              <p className="text-xs truncate" style={{ color: "var(--color-muted)" }}>{loc.address || `${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}`}</p>
                            </div>
                            <div className="flex-shrink-0">
                              {loc.item_count ? (
                                <span className={`inline-flex items-center justify-center h-5 min-w-[22px] px-1.5 rounded-full text-[11px] font-semibold ${
                                  loc.item_count >= 10 ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                                  : loc.item_count >= 5 ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                                  : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
                                }`}>{loc.item_count}</span>
                              ) : <span className="text-xs" style={{ color: "var(--color-muted)" }}>—</span>}
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <button
                                onClick={(e) => { e.stopPropagation(); setEditingLocation(loc); setFlyToKey((k) => k + 1); }}
                                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                aria-label="Edit"
                              >
                                <Pencil className="w-3.5 h-3.5" style={{ color: "var(--color-muted)" }} />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); deleteLocation(loc.id); }}
                                className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors"
                                aria-label="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </DndContext>
                  )}
                </div>
              </div>
```

- [ ] **Step 11: Replace the inline edit form with the Dialog component**

After the right panel `</div>` and before the closing `</div>` of the grid (after line 986), add the Dialog:

```tsx
                {/* Edit Location Dialog */}
                <EditLocationDialog
                  open={editingLocation !== null}
                  onOpenChange={(open) => { if (!open) setEditingLocation(null); }}
                  location={editingLocation}
                  onSave={saveLocation}
                  onCancel={() => setEditingLocation(null)}
                />
```

- [ ] **Step 12: Add merge confirmation dialog**

After the EditLocationDialog, add:

```tsx
                {/* Merge Confirmation Dialog */}
                <Dialog.Root open={showMergeConfirm} onOpenChange={(open) => { if (!open) { setShowMergeConfirm(false); setMergeSourceId(""); setMergeTargetId(""); } }}>
                  <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" />
                    <Dialog.Content className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-amber-300 dark:border-amber-700">
                      <div className="p-5 space-y-4">
                        <div>
                          <Dialog.Title className="text-sm font-semibold text-amber-800 dark:text-amber-300">Merge Locations</Dialog.Title>
                          <Dialog.Description className="text-xs mt-1" style={{ color: "var(--color-muted)" }}>
                            {(() => {
                              const source = locations.find((l) => l.id === mergeSourceId);
                              const target = locations.find((l) => l.id === mergeTargetId);
                              return source && target ? `Merge "${source.name}" into "${target.name}"? All items will be moved. This cannot be undone.` : "Confirm merge?";
                            })()}
                          </Dialog.Description>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={confirmMerge} className="flex-1 h-9 rounded-lg text-sm font-medium bg-amber-600 text-white hover:bg-amber-700 transition-colors">
                            Confirm Merge
                          </button>
                          <button onClick={() => { setShowMergeConfirm(false); setMergeSourceId(""); setMergeTargetId(""); }} className="flex-1 h-9 rounded-lg text-sm bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" style={{ color: "var(--color-text)" }}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    </Dialog.Content>
                  </Dialog.Portal>
                </Dialog.Root>
```

- [ ] **Step 13: Update saveLocation to read from dialog state**

The current `saveLocation` (lines 426-465) reads from `editingLocation` state. Since the dialog now manages its own internal form state, we need to update `saveLocation` to accept the location data. Replace `saveLocation` with:

```tsx
  const saveLocation = useCallback(async () => {
    if (!editingLocation || !editingLocation.name.trim()) {
      toast.error("Location name is required");
      return;
    }
    const lat = Number(editingLocation.latitude);
    const lng = Number(editingLocation.longitude);
    if (isNaN(lat) || isNaN(lng)) {
      toast.error("Invalid latitude or longitude");
      return;
    }
    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
    const method = editingLocation.id ? "PUT" : "POST";
    try {
      const res = await fetch("/api/admin/locations", {
        method,
        headers,
        body: JSON.stringify({
          id: editingLocation.id || undefined,
          name: editingLocation.name,
          address: editingLocation.address || "",
          latitude: lat,
          longitude: lng,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(editingLocation.id ? "Location updated" : "Location saved");
        setEditingLocation(null);
        fetchData();
      } else {
        toast.error(data.error || "Failed to save location");
      }
    } catch {
      toast.error("Network error — could not reach the server");
    }
  }, [editingLocation, token]);
```

This is actually the same as the current implementation — the dialog modifies `editingLocation` directly via the synthetic update in Step 1. This approach works because the dialog updates the same object reference.

However, a cleaner approach is to pass the form data from the dialog. Let me update the EditLocationDialog to call a save handler with the data. Actually, the simpler approach is to keep `saveLocation` as-is and have the dialog update `editingLocation` state before calling `onSave`. Let me revise the dialog approach.

**Revision to Step 1 (EditLocationDialog):** Instead of mutating the object, the dialog should update the parent's `editingLocation` state. Change the dialog to accept an `onChange` callback:

Replace the dialog's internal approach with:

```tsx
interface EditLocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  location: Location | null;
  onChange: (location: Location) => void;
  onSave: () => void;
}
```

And in the dialog, each input onChange calls `onChange({ ...location, name: newName })` etc.

Actually, to keep this simpler and avoid a large refactor, the dialog should just manage its own state and pass the final values back. Let me use a cleaner pattern:

The dialog manages internal state, and on save it calls a `onSave(locationData)` callback with the data. The parent's `saveLocation` then uses that data.

Let me revise both components. Replace Step 1's dialog with this revised version:

```tsx
// src/components/admin/EditLocationDialog.tsx
"use client";

import { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { Location } from "@/lib/types";

interface EditLocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  location: Location | null;
  onSave: (data: { name: string; address: string; latitude: number; longitude: number }) => void;
}

export function EditLocationDialog({
  open,
  onOpenChange,
  location,
  onSave,
}: EditLocationDialogProps) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  useEffect(() => {
    if (location && open) {
      setName(location.name);
      setAddress(location.address || "");
      setLatitude(String(location.latitude));
      setLongitude(String(location.longitude));
    }
  }, [location, open]);

  const handleSave = () => {
    if (!location) return;
    const lat = Number(latitude);
    const lng = Number(longitude);
    if (isNaN(lat) || isNaN(lng)) {
      return;
    }
    onSave({ name: name.trim(), address: address.trim(), latitude: lat, longitude: lng });
  };

  if (!location) return null;

  const isEditing = !!location.id;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" />
        <Dialog.Content className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-[var(--color-border)]">
          <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--color-border)]">
            <Dialog.Title className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
              {isEditing ? "Edit Location" : "Add Location"}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" aria-label="Close">
                <X className="w-4 h-4" style={{ color: "var(--color-muted)" }} />
              </button>
            </Dialog.Close>
          </div>

          <div className="p-5 space-y-3">
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: "var(--color-muted)" }}>Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Location name"
                className="w-full h-9 px-3 rounded-lg border text-sm"
                style={{ borderColor: "var(--color-border)", background: "var(--color-card)", color: "var(--color-text)" }}
                autoFocus
              />
            </div>

            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: "var(--color-muted)" }}>Address</label>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Address"
                className="w-full h-9 px-3 rounded-lg border text-sm"
                style={{ borderColor: "var(--color-border)", background: "var(--color-card)", color: "var(--color-text)" }}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: "var(--color-muted)" }}>Latitude</label>
                <input
                  type="number"
                  step="any"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="Latitude"
                  className="w-full h-9 px-3 rounded-lg border text-sm"
                  style={{ borderColor: "var(--color-border)", background: "var(--color-card)", color: "var(--color-text)" }}
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: "var(--color-muted)" }}>Longitude</label>
                <input
                  type="number"
                  step="any"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="Longitude"
                  className="w-full h-9 px-3 rounded-lg border text-sm"
                  style={{ borderColor: "var(--color-border)", background: "var(--color-card)", color: "var(--color-text)" }}
                />
              </div>
            </div>
          </div>

          <div className="px-5 pb-5">
            <button
              onClick={handleSave}
              disabled={!name.trim()}
              className={`w-full h-10 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 ${
                isEditing
                  ? "bg-[#4285F4] text-white hover:bg-[#3367d6]"
                  : "bg-[#1a1a1a] text-white hover:bg-[#333]"
              }`}
            >
              {isEditing ? "Update Location" : "Save Location"}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
```

And update Step 11's Dialog usage to:

```tsx
                {/* Edit Location Dialog */}
                <EditLocationDialog
                  open={editingLocation !== null}
                  onOpenChange={(open) => { if (!open) setEditingLocation(null); }}
                  location={editingLocation}
                  onSave={(data) => {
                    if (!editingLocation) return;
                    setEditingLocation({ ...editingLocation, ...data });
                    // Trigger save after state update
                    setTimeout(() => {
                      const lat = Number(data.latitude);
                      const lng = Number(data.longitude);
                      if (!data.name.trim() || isNaN(lat) || isNaN(lng)) {
                        toast.error("Invalid location data");
                        return;
                      }
                      const headers = {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                      };
                      const method = editingLocation.id ? "PUT" : "POST";
                      fetch("/api/admin/locations", {
                        method,
                        headers,
                        body: JSON.stringify({
                          id: editingLocation.id || undefined,
                          name: data.name,
                          address: data.address || "",
                          latitude: lat,
                          longitude: lng,
                        }),
                      }).then(async (res) => {
                        const json = await res.json();
                        if (res.ok) {
                          toast.success(editingLocation.id ? "Location updated" : "Location saved");
                          setEditingLocation(null);
                          fetchData();
                        } else {
                          toast.error(json.error || "Failed to save location");
                        }
                      }).catch(() => {
                        toast.error("Network error — could not reach the server");
                      });
                    }, 0);
                  }}
                />
```

Actually, this is getting convoluted with the setTimeout hack. Let me use a cleaner approach: keep `saveLocation` but have it read from a ref that the dialog updates. Or better yet, just have the dialog update `editingLocation` state and call `saveLocation` which reads from that state.

The cleanest approach: the dialog updates `editingLocation` via a callback, then calls `onSave` which triggers `saveLocation`. But React state updates are batched, so `saveLocation` would read stale state.

**Best approach:** Move the save logic into the Dialog component itself, passing the API details as props. Or, use a `useRef` to track the latest editingLocation.

Let me go with the simplest approach that works: the dialog calls `onSave` with the data, and the parent handles the API call. Replace `saveLocation` usage entirely.

**Final revised Step 11:**

```tsx
                {/* Edit Location Dialog */}
                <EditLocationDialog
                  open={editingLocation !== null}
                  onOpenChange={(open) => { if (!open) setEditingLocation(null); }}
                  location={editingLocation}
                  onSave={(data) => {
                    if (!editingLocation) return;
                    const lat = Number(data.latitude);
                    const lng = Number(data.longitude);
                    if (!data.name.trim() || isNaN(lat) || isNaN(lng)) {
                      toast.error("Location name is required and coordinates must be valid");
                      return;
                    }
                    const headers = {
                      Authorization: `Bearer ${token}`,
                      "Content-Type": "application/json",
                    };
                    const method = editingLocation.id ? "PUT" : "POST";
                    fetch("/api/admin/locations", {
                      method,
                      headers,
                      body: JSON.stringify({
                        id: editingLocation.id || undefined,
                        name: data.name,
                        address: data.address || "",
                        latitude: lat,
                        longitude: lng,
                      }),
                    }).then(async (res) => {
                      const json = await res.json();
                      if (res.ok) {
                        toast.success(editingLocation.id ? "Location updated" : "Location saved");
                        setEditingLocation(null);
                        fetchData();
                      } else {
                        toast.error(json.error || "Failed to save location");
                      }
                    }).catch(() => {
                      toast.error("Network error — could not reach the server");
                    });
                  }}
                />
```

- [ ] **Step 14: Remove the old saveLocation function**

Since the save logic is now inline in the Dialog's `onSave` callback, remove the `saveLocation` useCallback (lines 426-465). Keep `deleteLocation` and `searchLocations` is already removed.

Actually wait — `saveLocation` is still referenced. Let me keep it but simplify it. The dialog will update `editingLocation` state and the `saveLocation` function reads from it. To handle the React batching issue, we'll use a different pattern.

**Final approach:** Keep `saveLocation` as-is. The dialog updates `editingLocation` through the parent's state setter. The dialog's save button calls a parent function that first updates state, then calls `saveLocation`. But due to batching, we need to use `useEffect` or a ref.

Simplest working solution: The dialog has its own save handler that receives data, updates `editingLocation` state, and the actual API call happens in a `useEffect` that watches `editingLocation` for a "saving" flag.

No, that's overcomplicated. Let me just inline the save logic in the page.tsx Dialog handler. The `saveLocation` function can be removed. This is the approach in Step 13 above.

- [ ] **Step 15: Verify the page compiles**

Run: `npx tsc --noEmit src/app/admin/page.tsx`
Expected: No new errors introduced

---

### Task 4: Add Drag-and-Drop to Location Cards

**Files:**
- Modify: `src/app/admin/page.tsx`

This is already covered in Task 3 Step 10. The `DndContext` wrapper and `GripVertical` drag handle are added to the location cards. The `handleLocationDragEnd` callback (Step 8) triggers the merge confirmation dialog.

- [ ] **Step 1: Verify drag-and-drop works**

The location cards should now have:
- A grip icon on the left side (drag handle)
- Dragging one card onto another opens the merge confirmation dialog
- The `data-dnd-id` attribute on each card provides the dnd-kit item ID

No additional code changes needed — already implemented in Task 3.

---

### Task 5: Verify and Test

**Files:**
- All modified files

- [ ] **Step 1: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 2: Run lint**

Run: `npm run lint`
Expected: No errors

- [ ] **Step 3: Start dev server and verify**

Run: `npm run dev`

Verify in browser at `http://localhost:1337/admin`:
1. Click "Locations" tab
2. Click "Add Location" → Dialog opens with empty form
3. Click a location card → Dialog opens with that location's data
4. Click on the map while dialog is open → lat/lng fields update
5. Click "Update Location" → saves changes
6. Search Google Maps → results appear below search bar
7. Click a search result → Dialog opens with pre-filled data
8. Drag a location card onto another → Merge confirmation dialog appears
9. Confirm merge → locations merge successfully
10. Filter locations → cards filter correctly

- [ ] **Step 4: Commit all changes**

```bash
git add src/components/admin/EditLocationDialog.tsx src/components/admin/GoogleLocationSearch.tsx src/app/admin/page.tsx
git commit -m "feat: overhaul location dashboard UI with modal editing, drag-to-merge, and standalone search"
```

---

## Self-Review

### Spec Coverage Check

| Spec Requirement | Task |
|-----------------|------|
| Edit location → Modal Dialog | Task 1, Task 3 Steps 10-13 |
| Search with location table + overlap fix | Task 2, Task 3 Step 10 |
| Merge → Drag-and-drop | Task 3 Steps 7-8, 10 |
| Google search → Standalone section | Task 2, Task 3 Step 10 |
| Map click → update form fields, manual save | Task 3 Step 6 |

All 5 requirements covered.

### Placeholder Scan
- No TBD, TODO, or incomplete sections
- All code blocks contain complete implementations
- No "similar to Task N" references
- All error handling is explicit

### Type Consistency
- `Location` type used consistently across all files
- `SearchResult` interface in GoogleLocationSearch matches `LocationSearchResult` in page.tsx
- Dialog props use `Location | null` matching `editingLocation` state type
- `DragEndEvent` type imported from `@dnd-kit/core` matches existing usage

### Potential Issues
1. The `saveLocation` function is kept but may become unused if save logic moves to Dialog's `onSave` callback. **Resolution:** Remove `saveLocation` in Task 3 Step 14 if the inline approach is used.
2. The `locationSearch`, `locationSearchRegion`, `locationResults`, `isSearchingLocations` states become unused after extracting GoogleLocationSearch. **Resolution:** These can be removed from page.tsx since the GoogleLocationSearch component manages its own state.
