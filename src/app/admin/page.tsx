"use client";

import { useEffect, useState, useCallback, useRef, createContext, useContext } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import type { DayWithItems, ItineraryDay, ItineraryItem, Location } from "@/lib/types";
import {
  Pencil,
  Trash2,
  Plus,
  Save,
  LogOut,
  MapPin,
  GripVertical,
  Search,
  Moon,
  Sun,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DraggableAttributes,
} from "@dnd-kit/core";
import type { DraggableSyntheticListeners } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const AdminLocationMap = dynamic(
  () => import("@/components/admin/AdminLocationMap").then((mod) => mod.AdminLocationMap),
  { ssr: false }
);

interface LocationSearchResult {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

function SortableRow({
  item,
  idx,
  editingItem,
  onEdit,
  onDelete,
}: {
  item: ItineraryItem;
  idx: number;
  editingItem: string | null;
  onEdit: (item: ItineraryItem) => void;
  onDelete: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  return (
    <tr
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        borderColor: "var(--color-border)",
      }}
      className={cn(
        "border-b transition-colors",
        isDragging && "opacity-40",
        editingItem === item.id && "bg-[var(--color-accent-muted)]"
      )}
    >
      <td className="px-1 sm:px-2 py-2">
        <button
          {...attributes}
          {...listeners}
          className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 cursor-grab active:cursor-grabbing touch-none min-w-[32px] min-h-[32px] flex items-center justify-center"
          aria-label="Drag to reorder"
        >
          <GripVertical className="w-3.5 h-3.5 text-gray-400" />
        </button>
      </td>
      <td className="px-0.5 sm:px-1 py-2 text-[11px] sm:text-xs text-gray-400 tabular-nums w-5 sm:w-6">
        {idx + 1}
      </td>
      <td className="px-0.5 sm:px-1 py-2 text-[11px] sm:text-xs tabular-nums whitespace-nowrap">
        {item.start_time}
        {item.end_time && `–${item.end_time}`}
      </td>
      <td className="px-0.5 sm:px-1 py-2 text-[11px] sm:text-xs font-medium truncate max-w-[100px] sm:max-w-none">
        {item.activity}
      </td>
      <td className="px-0.5 sm:px-1 py-2 text-[11px] sm:text-xs hidden sm:table-cell">
        <span className="inline-flex items-center gap-1">
          <MapPin className="w-3 h-3 text-gray-300 flex-shrink-0" />
          {item.location_name}
        </span>
      </td>
      <td className="px-0.5 sm:px-1 py-2 text-[11px] sm:text-xs text-gray-400 hidden sm:table-cell max-w-[180px] truncate">
        {item.notes || "—"}
      </td>
      <td className="px-1 sm:px-2 py-2 text-right">
        <div className="flex items-center justify-end gap-0.5">
          <button
            onClick={() => onEdit(item)}
            className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 min-w-[32px] min-h-[32px] flex items-center justify-center"
          >
            <Pencil className="w-3 h-3" />
          </button>
          <button
            onClick={() => onDelete(item.id)}
            className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 min-w-[32px] min-h-[32px] flex items-center justify-center"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </td>
    </tr>
  );
}

interface DaySortableContextType {
  attributes: DraggableAttributes;
  listeners: DraggableSyntheticListeners;
  isDragging: boolean;
}

const DaySortableContext = createContext<DaySortableContextType | null>(null);

function SortableDayCard({ day, children }: { day: DayWithItems; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: day.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <DaySortableContext.Provider value={{ attributes, listeners, isDragging }}>
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          "rounded-2xl border border-[var(--color-border)] overflow-hidden",
          isDragging && "opacity-50 shadow-lg z-10 relative"
        )}
      >
        {children}
      </div>
    </DaySortableContext.Provider>
  );
}

function DayDragHandle() {
  const ctx = useContext(DaySortableContext);
  if (!ctx) return null;
  return (
    <button
      {...ctx.attributes}
      {...(ctx.listeners as React.DOMAttributes<HTMLButtonElement>)}
      className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 cursor-grab active:cursor-grabbing touch-none min-w-[32px] min-h-[32px] flex items-center justify-center flex-shrink-0"
      aria-label="Drag to reorder day"
    >
      <GripVertical className="w-3.5 h-3.5 text-gray-400" />
    </button>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const [days, setDays] = useState<DayWithItems[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [activeScreen, setActiveScreen] = useState<"itinerary" | "locations">("itinerary");
  const [isLoading, setIsLoading] = useState(true);
  const [editingDay, setEditingDay] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [newItemDayId, setNewItemDayId] = useState<string | null>(null);
  const [editDayForm, setEditDayForm] = useState({ title: "", date: "" });
  const [editItemForm, setEditItemForm] = useState({
    start_time: "",
    end_time: "",
    activity: "",
    location_id: "",
    description: "",
    notes: "",
    sort_order: 0,
  });

  const [locationForm, setLocationForm] = useState({
    id: "",
    name: "",
    address: "",
    latitude: 43.0621,
    longitude: 141.3544,
  });
  const [locationSearch, setLocationSearch] = useState("");
  const [locationSearchRegion, setLocationSearchRegion] = useState("");
  const [locationResults, setLocationResults] = useState<LocationSearchResult[]>([]);
  const [isSearchingLocations, setIsSearchingLocations] = useState(false);
  const lastSearchRef = useRef(0);
  const [locationFilter, setLocationFilter] = useState("");
  const [flyToKey, setFlyToKey] = useState(0);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [showMerge, setShowMerge] = useState(false);
  const [mergeSource, setMergeSource] = useState("");
  const [mergeTarget, setMergeTarget] = useState("");
  const [isMerging, setIsMerging] = useState(false);

  const [headerTitle, setHeaderTitle] = useState("");
  const [headerSubtitle, setHeaderSubtitle] = useState("");
  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const [newDayForm, setNewDayForm] = useState({ title: "", date: "" });
  const [showNewDay, setShowNewDay] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const token =
    typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;

  useEffect(() => {
    if (!token) {
      router.push("/admin/login");
      return;
    }
    fetchData();
  }, [token]);

  // Sync theme state with document
  useEffect(() => {
    const html = document.documentElement;
    const current = html.getAttribute("data-theme") || "light";
    setTheme(current === "dark" ? "dark" : "light");
    const observer = new MutationObserver(() => {
      const t = html.getAttribute("data-theme") || "light";
      setTheme(t === "dark" ? "dark" : "light");
    });
    observer.observe(html, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  async function fetchData() {
    const headers = { Authorization: `Bearer ${token}` };

    const [daysResult, itemsResult, locationsResult, settingsResult] = await Promise.allSettled([
      fetch("/api/admin/days", { headers }).then((r) => r.ok ? r.json() : { days: [] }),
      fetch("/api/admin/items", { headers }).then((r) => r.ok ? r.json() : { items: [] }),
      fetch("/api/admin/locations", { headers }).then((r) => r.ok ? r.json() : { locations: [] }),
      fetch("/api/settings").then((r) => r.ok ? r.json() : {}),
    ]);

    const daysData = daysResult.status === "fulfilled" ? daysResult.value : { days: [] };
    const itemsData = itemsResult.status === "fulfilled" ? itemsResult.value : { items: [] };
    const locationsData = locationsResult.status === "fulfilled" ? locationsResult.value : { locations: [] };
    const settingsData: Record<string, string> = settingsResult.status === "fulfilled" ? settingsResult.value : {};

    const daysWithItems = (daysData.days || []).map((day: ItineraryDay) => ({
      ...day,
      items: ((itemsData.items || []) as ItineraryItem[])
        .filter((item: ItineraryItem) => item.day_id === day.id)
        .sort((a, b) => a.sort_order - b.sort_order),
    }));
    setDays(daysWithItems);
    setLocations(locationsData.locations || []);

    if (settingsData.trip_title) setHeaderTitle(settingsData.trip_title);
    if (settingsData.trip_subtitle) setHeaderSubtitle(settingsData.trip_subtitle);

    setIsLoading(false);
  }

  const saveHeader = useCallback(async () => {
    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers,
      body: JSON.stringify({
        trip_title: headerTitle,
        trip_subtitle: headerSubtitle,
      }),
    });
    if (res.ok) {
      toast.success("Header updated");
      setIsEditingHeader(false);
    } else {
      toast.error("Failed to update header");
    }
  }, [token, headerTitle, headerSubtitle]);

  const addDay = useCallback(async () => {
    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
    const maxOrder = Math.max(0, ...days.map((d) => d.sort_order));
    const res = await fetch("/api/admin/days", {
      method: "POST",
      headers,
      body: JSON.stringify({
        title: newDayForm.title,
        date: newDayForm.date,
        sort_order: maxOrder + 1,
      }),
    });
    if (res.ok) {
      toast.success("Day added");
      setNewDayForm({ title: "", date: "" });
      setShowNewDay(false);
      fetchData();
    } else {
      toast.error("Failed to add day");
    }
  }, [token, newDayForm, days]);

  const saveDay = useCallback(
    async (day: ItineraryDay) => {
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };
      const res = await fetch("/api/admin/days", {
        method: "PUT",
        headers,
        body: JSON.stringify(day),
      });
      if (res.ok) {
        toast.success("Day updated");
        fetchData();
      } else {
        toast.error("Failed to update day");
      }
    },
    [token]
  );

  const deleteDay = useCallback(
    async (id: string) => {
      if (!confirm("Delete this day and all its items?")) return;
      const headers = { Authorization: `Bearer ${token}` };
      const res = await fetch(`/api/admin/days?id=${id}`, {
        method: "DELETE",
        headers,
      });
      if (res.ok) {
        toast.success("Day deleted");
        fetchData();
      } else {
        toast.error("Failed to delete day");
      }
    },
    [token]
  );

  const saveItem = useCallback(
    async (item: Partial<ItineraryItem> & { id?: string }) => {
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };
      const method = item.id ? "PUT" : "POST";
      const res = await fetch("/api/admin/items", {
        method,
        headers,
        body: JSON.stringify(item),
      });
      if (res.ok) {
        toast.success(item.id ? "Item updated" : "Item created");
        setEditingItem(null);
        setNewItemDayId(null);
        fetchData();
      } else {
        toast.error("Failed to save item");
      }
    },
    [token]
  );

  const searchLocations = useCallback(async () => {
    if (!locationSearch.trim()) return;
    const now = Date.now();
    if (now - lastSearchRef.current < 500) return;
    lastSearchRef.current = now;
    setIsSearchingLocations(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const params = new URLSearchParams({ q: locationSearch });
      if (locationSearchRegion.trim()) params.set("region", locationSearchRegion.trim());
      const res = await fetch(
        `/api/admin/location-search?${params}`,
        { headers }
      );
      const data = await res.json();
      if (res.ok) {
        setLocationResults(data.results || []);
      } else {
        toast.error(data.error || "Location search failed");
      }
    } finally {
      setIsSearchingLocations(false);
    }
  }, [locationSearch, locationSearchRegion, token]);

  const saveLocation = useCallback(async () => {
    if (!locationForm.name.trim()) {
      toast.error("Location name is required");
      return;
    }

    const lat = Number(locationForm.latitude);
    const lng = Number(locationForm.longitude);
    if (isNaN(lat) || isNaN(lng)) {
      toast.error("Invalid latitude or longitude");
      return;
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
    const method = locationForm.id ? "PUT" : "POST";
    let res: Response;
    try {
      res = await fetch("/api/admin/locations", {
        method,
        headers,
        body: JSON.stringify({
          id: locationForm.id || undefined,
          name: locationForm.name,
          address: locationForm.address,
          latitude: lat,
          longitude: lng,
        }),
      });
    } catch {
      toast.error("Network error — could not reach the server");
      return;
    }

    let data: { error?: string };
    try {
      data = await res.json();
    } catch {
      toast.error("Server returned an invalid response");
      return;
    }

    if (res.ok) {
      toast.success(locationForm.id ? "Location updated" : "Location saved");
      if (locationForm.id) {
        setLocations((prev) =>
          prev.map((loc) =>
            loc.id === locationForm.id
              ? { ...loc, latitude: lat, longitude: lng, name: locationForm.name.trim(), address: locationForm.address }
              : loc
          )
        );
      }
      setLocationForm({
        id: "",
        name: "",
        address: "",
        latitude: 43.0621,
        longitude: 141.3544,
      });
      setLocationResults([]);
      fetchData();
    } else {
      toast.error(data.error || "Failed to save location");
    }
  }, [locationForm, token]);

  const deleteLocation = useCallback(
    async (id: string) => {
      if (!confirm("Delete this location?")) return;
      const headers = { Authorization: `Bearer ${token}` };
      let res: Response;
      try {
        res = await fetch(`/api/admin/locations?id=${id}`, {
          method: "DELETE",
          headers,
        });
      } catch {
        toast.error("Network error — could not delete location");
        return;
      }
      let data: { error?: string };
      try {
        data = await res.json();
      } catch {
        toast.error("Server returned an invalid response");
        return;
      }
      if (res.ok) {
        toast.success("Location deleted");
        fetchData();
      } else {
        toast.error(data.error || "Failed to delete location");
      }
    },
    [token]
  );

  const mergeLocations = useCallback(async () => {
    if (!mergeSource || !mergeTarget) return;
    if (mergeSource === mergeTarget) {
      toast.error("Cannot merge a location into itself");
      return;
    }
    setIsMerging(true);
    try {
      const res = await fetch("/api/admin/locations/merge", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sourceId: mergeSource, targetId: mergeTarget }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Merged "${data.sourceName}" → "${data.targetName}" (${data.affectedItems} items updated)`);
        setShowMerge(false);
        setMergeSource("");
        setMergeTarget("");
        fetchData();
      } else {
        toast.error(data.error || "Failed to merge locations");
      }
    } catch {
      toast.error("Network error during merge");
    } finally {
      setIsMerging(false);
    }
  }, [mergeSource, mergeTarget, token]);

  const deleteItem = useCallback(
    async (id: string) => {
      if (!confirm("Delete this item?")) return;
      const headers = { Authorization: `Bearer ${token}` };
      let res: Response;
      try {
        res = await fetch(`/api/admin/items?id=${id}`, {
          method: "DELETE",
          headers,
        });
      } catch {
        toast.error("Network error — could not delete item");
        return;
      }
      let data: { error?: string } = {};
      try {
        data = await res.json();
      } catch {
        // ignore json parse errors
      }
      if (res.ok) {
        toast.success("Item deleted");
        fetchData();
      } else {
        toast.error(data.error || "Failed to delete item");
      }
    },
    [token]
  );

  const handleDragEnd = useCallback(
    async (dayId: string, event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      setDays((prev) =>
        prev.map((day) => {
          if (day.id !== dayId) return day;
          const items = [...day.items];
          const oldIndex = items.findIndex((i) => i.id === active.id);
          const newIndex = items.findIndex((i) => i.id === over.id);
          if (oldIndex === -1 || newIndex === -1) return day;
          const [moved] = items.splice(oldIndex, 1);
          items.splice(newIndex, 0, moved);
          const reordered = items.map((item, i) => ({
            ...item,
            sort_order: i + 1,
          }));
          return { ...day, items: reordered };
        })
      );

      // Persist to API
      const day = days.find((d) => d.id === dayId);
      if (!day) return;
      const items = [...day.items];
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;
      const [moved] = items.splice(oldIndex, 1);
      items.splice(newIndex, 0, moved);

      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };
      await fetch("/api/admin/items/reorder", {
        method: "PUT",
        headers,
        body: JSON.stringify({
          items: items.map((item, i) => ({ id: item.id, sort_order: i + 1 })),
        }),
      });
    },
    [days, token]
  );

  const handleDayDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      setDays((prev) => {
        const oldIndex = prev.findIndex((d) => d.id === active.id);
        const newIndex = prev.findIndex((d) => d.id === over.id);
        if (oldIndex === -1 || newIndex === -1) return prev;
        const reordered = [...prev];
        const [moved] = reordered.splice(oldIndex, 1);
        reordered.splice(newIndex, 0, moved);
        return reordered.map((day, i) => ({ ...day, sort_order: i + 1 }));
      });

      const reorderedDays = days
        .map((day) => ({ ...day }))
        .sort((a, b) => a.sort_order - b.sort_order);
      const oldIndex = reorderedDays.findIndex((d) => d.id === active.id);
      const newIndex = reorderedDays.findIndex((d) => d.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;
      const [moved] = reorderedDays.splice(oldIndex, 1);
      reorderedDays.splice(newIndex, 0, moved);

      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };
      await fetch("/api/admin/days/reorder", {
        method: "PUT",
        headers,
        body: JSON.stringify({
          days: reorderedDays.map((day, i) => ({ id: day.id, sort_order: i + 1 })),
        }),
      });
    },
    [days, token]
  );

  function logout() {
    localStorage.removeItem("admin_token");
    router.push("/admin/login");
  }

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-sm text-gray-400">Loading admin...</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col" style={{ background: "var(--color-bg)" }}>
      <header className="flex-shrink-0 z-30" style={{ background: "var(--color-panel)", backdropFilter: "blur(12px)", borderBottom: "1px solid var(--color-border)" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2">
          <h1 className="text-base sm:text-lg font-semibold tracking-tight" style={{ color: "var(--color-text)" }}>Admin Dashboard</h1>
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <button
              onClick={() => {
                const html = document.documentElement;
                const isDark = theme === "dark";
                html.setAttribute("data-theme", isDark ? "light" : "dark");
                try { localStorage.setItem("theme", isDark ? "light" : "dark"); } catch {}
                setTheme(isDark ? "light" : "dark");
              }}
              className="text-sm transition-opacity hover:opacity-70"
              style={{ color: "var(--color-muted)" }}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <a
              href="/"
              target="_blank"
              className="text-sm font-medium transition-opacity hover:opacity-70"
              style={{ color: "var(--color-accent)" }}
            >
              View Site
            </a>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 text-sm transition-opacity hover:opacity-70"
              style={{ color: "var(--color-muted)" }}
            >
              <LogOut className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-3 flex gap-2">
          <button
            onClick={() => setActiveScreen("itinerary")}
            className={cn(
              "h-9 px-4 rounded-lg text-sm font-medium transition-all",
              activeScreen === "itinerary"
                ? "text-white shadow-sm"
                : "hover:opacity-70"
            )}
            style={{
              background: activeScreen === "itinerary" ? "var(--color-accent)" : "var(--color-card)",
              color: activeScreen === "itinerary" ? "white" : "var(--color-text)",
              border: activeScreen === "itinerary" ? "none" : "1px solid var(--color-border)",
            }}
          >
            Itinerary
          </button>
          <button
            onClick={() => setActiveScreen("locations")}
            className={cn(
              "h-9 px-4 rounded-lg text-sm font-medium transition-all",
              activeScreen === "locations"
                ? "text-white shadow-sm"
                : "hover:opacity-70"
            )}
            style={{
              background: activeScreen === "locations" ? "var(--color-accent)" : "var(--color-card)",
              color: activeScreen === "locations" ? "white" : "var(--color-text)",
              border: activeScreen === "locations" ? "none" : "1px solid var(--color-border)",
            }}
          >
            Locations
          </button>
        </div>
      </header>

      <div className={`flex-1 w-full min-h-0 ${activeScreen !== "locations" ? "overflow-y-auto px-4 sm:px-6 py-6 max-w-6xl mx-auto space-y-5" : "overflow-hidden"}`}>
        {activeScreen === "locations" ? (
          <div className="grid h-full grid-cols-[minmax(0,1fr)_minmax(360px,520px)] gap-6 p-6">
            {/* Map */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-[var(--color-border)] overflow-hidden flex-1 min-w-0 flex flex-col min-h-0">
              <div className="px-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 flex-shrink-0">
                <h2 className="font-medium text-xs">Map  <span className="text-gray-400 font-normal">· Click to set coordinates</span></h2>
              </div>
              <div className="relative flex-1 min-h-0">
                <AdminLocationMap
                  latitude={locationForm.latitude}
                  locations={locations}
                  longitude={locationForm.longitude}
                  onPick={(latitude, longitude) =>
                    setLocationForm((current) => ({
                      ...current,
                      latitude,
                      longitude,
                    }))
                  }
                  onSelectLocation={(location) => {
                    setLocationForm({
                      id: location.id,
                      name: location.name,
                      address: location.address || "",
                      latitude: location.latitude,
                      longitude: location.longitude,
                    });
                    setFlyToKey((k) => k + 1);
                  }}
                  selectedLocationId={locationForm.id}
                  flyToKey={flyToKey}
                />
              </div>
            </div>

            {/* Right panel: single scrollable column */}
            <div className="flex flex-col min-w-0 min-h-0">
              <div className={`bg-white dark:bg-gray-900 rounded-2xl border overflow-hidden flex flex-col flex-1 min-h-0 ${
                locationForm.id
                  ? "border-[#4285F4]/40 ring-1 ring-[#4285F4]/20"
                  : "border-[var(--color-border)]"
              }`}>
                {/* Header */}
                <div className={`px-4 py-2.5 border-b flex items-center justify-between ${
                  locationForm.id
                    ? "bg-[#4285F4]/5 border-[#4285F4]/20"
                    : "bg-gray-50 dark:bg-gray-800/50 border-[var(--color-border)]"
                }`}>
                  <h2 className="text-xs font-medium">
                    {locationForm.id ? (
                      <span className="flex items-center gap-1.5">
                        <Pencil className="w-3 h-3 text-[#4285F4]" />
                        Edit Location
                      </span>
                    ) : "New Location"}
                  </h2>
                  {locationForm.id && (
                    <button
                      onClick={() =>
                        setLocationForm({
                          id: "", name: "", address: "",
                          latitude: 43.0621, longitude: 141.3544,
                        })
                      }
                      className="text-[11px] text-gray-500 hover:text-gray-700 underline"
                    >
                      Cancel
                    </button>
                  )}
                </div>

                <div className="flex flex-col flex-1 min-h-0">
                  {/* Fixed: search + form */}
                  <div className="flex-shrink-0 p-3 space-y-3">
                    {/* Search */}
                    <div className="flex gap-1.5">
                      <div className="relative flex-1">
                        <input
                          value={locationSearch}
                          onChange={(e) => setLocationSearch(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") searchLocations(); }}
                          placeholder="Search Google Maps..."
                          className="h-8 w-full pl-2.5 pr-7 rounded-lg border text-xs"
                        />
                        {isSearchingLocations && (
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 border-2 border-[#4285F4] border-t-transparent rounded-full animate-spin" />
                        )}
                      </div>
                      <input
                        value={locationSearchRegion}
                        onChange={(e) => setLocationSearchRegion(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") searchLocations(); }}
                        placeholder="Region (e.g. Japan or JP)"
                        className="h-8 w-24 rounded-lg border text-xs px-2.5"
                      />
                      <button
                        onClick={searchLocations}
                        disabled={isSearchingLocations}
                        className="h-8 w-8 rounded-lg bg-[#4285F4] text-white flex items-center justify-center disabled:opacity-50 flex-shrink-0"
                        aria-label="Search"
                      >
                        <Search className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {locationResults.length > 0 && (
                      <div className="max-h-32 overflow-y-auto rounded-lg border divide-y text-xs">
                        {locationResults.map((result, i) => (
                          <button
                            key={`${result.latitude}-${result.longitude}-${i}`}
                            onClick={() =>
                              setLocationForm((current) => ({
                                ...current,
                                name: result.name,
                                address: result.address,
                                latitude: result.latitude,
                                longitude: result.longitude,
                              }))
                            }
                            className="w-full px-3 py-1.5 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                          >
                            <p className="font-medium">{result.name}</p>
                            <p className="text-gray-500 truncate">{result.address}</p>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Form fields */}
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-1.5">
                        <input
                          value={locationForm.name}
                          onChange={(e) => setLocationForm({ ...locationForm, name: e.target.value })}
                          placeholder="Location name"
                          className="h-8 px-2.5 rounded-lg border text-xs"
                        />
                        <input
                          value={locationForm.address}
                          onChange={(e) => setLocationForm({ ...locationForm, address: e.target.value })}
                          placeholder="Address"
                          className="h-8 px-2.5 rounded-lg border text-xs"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        <input
                          type="number" step="any"
                          value={locationForm.latitude}
                          onChange={(e) => setLocationForm({ ...locationForm, latitude: Number(e.target.value) })}
                          placeholder="Latitude"
                          className="h-8 px-2.5 rounded-lg border text-[11px]"
                        />
                        <input
                          type="number" step="any"
                          value={locationForm.longitude}
                          onChange={(e) => setLocationForm({ ...locationForm, longitude: Number(e.target.value) })}
                          placeholder="Longitude"
                          className="h-8 px-2.5 rounded-lg border text-[11px]"
                        />
                      </div>
                      <button
                        onClick={saveLocation}
                        disabled={!locationForm.name.trim()}
                        className={`w-full h-8 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
                          locationForm.id
                            ? "bg-[#4285F4] text-white hover:bg-[#3367d6]"
                            : "bg-[#1a1a1a] text-white hover:bg-[#333]"
                        }`}
                      >
                        {locationForm.id ? "Update Location" : "Save Location"}
                      </button>
                    </div>
                  </div>

                  <div className="h-px bg-[var(--color-border)] mx-3" />

                  {/* Scrollable: saved locations list */}
                  <div className="flex-1 overflow-y-auto px-3 pb-3">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <h3 className="text-xs font-medium text-gray-500">Saved ({locations.length})</h3>
                          {locations.length >= 2 && (
                            <button
                              onClick={() => { setShowMerge(!showMerge); setMergeSource(""); setMergeTarget(""); }}
                              className={`text-[11px] underline ${showMerge ? "text-amber-700" : "text-amber-600 hover:text-amber-700"}`}
                            >
                              Merge
                            </button>
                          )}
                        </div>
                        <div className="relative w-36">
                          <input
                            value={locationFilter}
                            onChange={(e) => setLocationFilter(e.target.value)}
                            placeholder="Filter..."
                            className="h-6 w-full pl-5 pr-2 rounded border text-[10px]"
                          />
                          <Search className="w-2.5 h-2.5 absolute left-1.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        </div>
                      </div>

                      {showMerge && (
                        <div className="mb-3 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 space-y-2">
                          <p className="text-xs font-medium text-amber-800 dark:text-amber-300">Merge locations</p>
                          <div className="flex items-center gap-1.5">
                            <select
                              value={mergeSource}
                              onChange={(e) => setMergeSource(e.target.value)}
                              className="flex-1 h-8 px-2 rounded border text-xs bg-white dark:bg-gray-800"
                            >
                              <option value="">Merge this location...</option>
                              {locations.map((loc) => (
                                <option key={loc.id} value={loc.id}>{loc.name}</option>
                              ))}
                            </select>
                            <span className="text-xs text-amber-600 font-medium">→</span>
                            <select
                              value={mergeTarget}
                              onChange={(e) => setMergeTarget(e.target.value)}
                              className="flex-1 h-8 px-2 rounded border text-xs bg-white dark:bg-gray-800"
                            >
                              <option value="">Into this location...</option>
                              {locations.map((loc) => (
                                <option key={loc.id} value={loc.id}>{loc.name}</option>
                              ))}
                            </select>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={mergeLocations}
                              disabled={!mergeSource || !mergeTarget || mergeSource === mergeTarget || isMerging}
                              className="h-7 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-medium disabled:opacity-50 transition-colors"
                            >
                              {isMerging ? "Merging..." : "Merge"}
                            </button>
                            <button
                              onClick={() => { setShowMerge(false); setMergeSource(""); setMergeTarget(""); }}
                              className="h-7 px-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="space-y-px">
                        {locations
                          .filter((loc) =>
                            !locationFilter || loc.name.toLowerCase().includes(locationFilter.toLowerCase())
                          )
                          .map((location) => (
                          <div
                            key={location.id}
                            className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg transition-colors ${
                              locationForm.id === location.id
                                ? "bg-[#4285F4]/5"
                                : "hover:bg-gray-50 dark:hover:bg-gray-800/30"
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium truncate flex items-center gap-1.5">
                                {location.name}
                                {!!location.item_count && (
                                  <span className={`inline-flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full text-[9px] font-medium ${
                                    location.item_count >= 10
                                      ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                                      : location.item_count >= 5
                                      ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                                      : location.item_count >= 2
                                      ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
                                      : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                                  }`}>
                                    {location.item_count}
                                  </span>
                                )}
                              </p>
                              <p className="text-[10px] text-gray-500 truncate leading-tight">
                                {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                                {location.address ? ` · ${location.address}` : ""}
                              </p>
                            </div>
                            <div className="flex gap-0.5 flex-shrink-0">
                              <button
                                onClick={() => {
                                  setLocationForm({
                                    id: location.id, name: location.name,
                                    address: location.address || "",
                                    latitude: location.latitude, longitude: location.longitude,
                                  });
                                  setFlyToKey((k) => k + 1);
                                }}
                                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                                aria-label="Edit"
                              >
                                <Pencil className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => deleteLocation(location.id)}
                                className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"
                                aria-label="Delete"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                        {locations.length === 0 && (
                          <p className="py-6 text-xs text-gray-400 text-center">No saved locations yet.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
        {/* Header Info Section */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-[var(--color-border)] overflow-hidden">
          <div className="px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 border-b border-[var(--color-border)]">
            <h2 className="font-medium text-xs sm:text-sm">Page Header</h2>
            <button
              onClick={() => setIsEditingHeader(!isEditingHeader)}
              className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 min-w-[36px] min-h-[36px] flex items-center justify-center"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="px-4 sm:px-6 py-3 sm:py-4 space-y-2">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-gray-400">Title</span>
              {isEditingHeader ? (
                <input
                  value={headerTitle}
                  onChange={(e) => setHeaderTitle(e.target.value)}
                  className="w-full h-8 px-2 mt-0.5 rounded border text-sm font-medium"
                />
              ) : (
                <p className="text-sm font-medium">{headerTitle}</p>
              )}
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-gray-400">Subtitle</span>
              {isEditingHeader ? (
                <input
                  value={headerSubtitle}
                  onChange={(e) => setHeaderSubtitle(e.target.value)}
                  className="w-full h-8 px-2 mt-0.5 rounded border text-sm"
                />
              ) : (
                <p className="text-xs text-[var(--color-muted)]">{headerSubtitle}</p>
              )}
            </div>
            {isEditingHeader && (
              <div className="flex gap-2 pt-2">
                <button
                  onClick={saveHeader}
                  className="h-8 px-4 bg-[#4285F4] text-white rounded-lg text-xs font-medium"
                >
                  Save Header
                </button>
                <button
                  onClick={() => setIsEditingHeader(false)}
                  className="h-8 px-4 bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg text-xs"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDayDragEnd}
        >
        <SortableContext
          items={days.map((d) => d.id)}
          strategy={verticalListSortingStrategy}
        >
        {days.map((day) => (
          <SortableDayCard key={day.id} day={day}>
            {/* Day header */}
            <div className="px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 border-b border-[var(--color-border)] gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <DayDragHandle />
                <div className="min-w-0">
                  <h2 className="font-medium text-xs sm:text-sm truncate">{day.title}</h2>
                  <p className="text-[11px] sm:text-xs text-[var(--color-muted)]">
                    {day.date} — {day.items.length} items
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
                <button
                  onClick={() => {
                    setEditingDay(day.id);
                    setEditDayForm({ title: day.title, date: day.date });
                  }}
                  className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 min-w-[36px] min-h-[36px] flex items-center justify-center"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => deleteDay(day.id)}
                  className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 min-w-[36px] min-h-[36px] flex items-center justify-center"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Day edit form */}
            {editingDay === day.id && (
              <div className="px-4 sm:px-6 py-3 sm:py-4 bg-blue-50/30 dark:bg-blue-900/10 border-b border-[var(--color-border)] space-y-3">
                <input
                  value={editDayForm.title}
                  onChange={(e) =>
                    setEditDayForm({ ...editDayForm, title: e.target.value })
                  }
                  className="w-full h-9 px-3 rounded-lg border text-sm"
                  placeholder="Day title"
                />
                <input
                  type="date"
                  value={editDayForm.date}
                  onChange={(e) =>
                    setEditDayForm({ ...editDayForm, date: e.target.value })
                  }
                  className="w-full h-9 px-3 rounded-lg border text-sm"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      saveDay({ ...day, ...editDayForm });
                      setEditingDay(null);
                    }}
                    className="h-8 px-4 bg-[#4285F4] text-white rounded-lg text-xs font-medium"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingDay(null)}
                    className="h-8 px-4 bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Items table with drag-and-drop */}
            <div className="overflow-x-auto">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={(event) => handleDragEnd(day.id, event)}
              >
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--color-border)] text-xs text-[var(--color-muted)]">
                      <th className="text-left px-2 py-2 font-medium w-10" />
                      <th className="text-left px-1 py-2 font-medium w-6">#</th>
                      <th className="text-left px-1 py-2 font-medium">Time</th>
                      <th className="text-left px-1 py-2 font-medium">
                        Activity
                      </th>
                      <th className="text-left px-1 py-2 font-medium hidden sm:table-cell">
                        Location
                      </th>
                      <th className="text-left px-1 py-2 font-medium hidden sm:table-cell">
                        Notes
                      </th>
                      <th className="text-right px-2 py-2 font-medium w-14">
                        Edit
                      </th>
                    </tr>
                  </thead>
                  <SortableContext
                    items={day.items.map((i) => i.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <tbody>
                      {day.items.map((item, idx) => (
                        <SortableRow
                          key={item.id}
                          item={item}
                          idx={idx}
                          editingItem={editingItem}
                          onEdit={(it) => {
                            setEditingItem(it.id);
                            setEditItemForm({
                              start_time: it.start_time,
                              end_time: it.end_time || "",
                              activity: it.activity,
                              location_id: it.location_id || "",
                              description: it.description || "",
                              notes: it.notes || "",
                              sort_order: it.sort_order,
                            });
                          }}
                          onDelete={deleteItem}
                        />
                      ))}
                    </tbody>
                  </SortableContext>
                </table>
              </DndContext>
            </div>

            {/* Edit item form */}
            {(editingItem || newItemDayId === day.id) &&
              (() => {
                const item = editingItem
                  ? day.items.find((i) => i.id === editingItem)
                  : null;
                if (!item && newItemDayId !== day.id) return null;
                return (
                  <div className="px-4 sm:px-6 py-3 sm:py-4 bg-blue-50/30 dark:bg-blue-900/10 border-t border-[var(--color-border)]">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-3">
                      <input
                        value={editItemForm.start_time}
                        onChange={(e) =>
                          setEditItemForm({
                            ...editItemForm,
                            start_time: e.target.value,
                          })
                        }
                        placeholder="Start (HH:MM)"
                        className="h-9 px-3 rounded-lg border text-xs"
                      />
                      <input
                        value={editItemForm.end_time}
                        onChange={(e) =>
                          setEditItemForm({
                            ...editItemForm,
                            end_time: e.target.value,
                          })
                        }
                        placeholder="End (HH:MM)"
                        className="h-9 px-3 rounded-lg border text-xs"
                      />
                      <input
                        value={editItemForm.activity}
                        onChange={(e) =>
                          setEditItemForm({
                            ...editItemForm,
                            activity: e.target.value,
                          })
                        }
                        placeholder="Activity"
                        className="h-9 px-3 rounded-lg border text-xs"
                      />
                      <select
                        value={editItemForm.location_id}
                        onChange={(e) =>
                          setEditItemForm({
                            ...editItemForm,
                            location_id: e.target.value,
                          })
                        }
                        className="h-9 px-3 rounded-lg border text-xs"
                      >
                        <option value="">Select location</option>
                        {locations.map((location) => (
                          <option key={location.id} value={location.id}>
                            {location.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mb-3">
                      <input
                        value={editItemForm.description}
                        onChange={(e) =>
                          setEditItemForm({
                            ...editItemForm,
                            description: e.target.value,
                          })
                        }
                        placeholder="Description"
                        className="h-10 sm:h-9 px-3 rounded-lg border text-xs"
                      />
                      <input
                        value={editItemForm.notes}
                        onChange={(e) =>
                          setEditItemForm({
                            ...editItemForm,
                            notes: e.target.value,
                          })
                        }
                        placeholder="Notes"
                        className="h-10 sm:h-9 px-3 rounded-lg border text-xs"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          if (newItemDayId) {
                            saveItem({
                              ...editItemForm,
                              day_id: newItemDayId,
                            });
                          } else if (item) {
                            saveItem({
                              id: item.id,
                              day_id: item.day_id,
                              ...editItemForm,
                            });
                          }
                        }}
                        className="h-8 px-4 bg-[#4285F4] text-white rounded-lg text-xs font-medium flex items-center gap-1"
                      >
                        <Save className="w-3 h-3" /> Save Item
                      </button>
                      <button
                        onClick={() => {
                          setEditingItem(null);
                          setNewItemDayId(null);
                        }}
                        className="h-8 px-4 bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                );
              })()}

            {/* Add new item */}
            <div className="px-4 sm:px-6 py-2.5 border-t border-[var(--color-border)]">
              <button
                onClick={() => {
                  const newSort =
                    Math.max(0, ...day.items.map((i) => i.sort_order)) + 1;
                  setNewItemDayId(day.id);
                  setEditItemForm({
                    start_time: "09:00",
                    end_time: "",
                    activity: "",
                    location_id: locations[0]?.id || "",
                    description: "",
                    notes: "",
                    sort_order: newSort,
                  });
                }}
                className="text-xs text-[#4285F4] hover:text-[#3367d6] flex items-center gap-1 py-1"
              >
                <Plus className="w-3 h-3" /> Add item
              </button>
            </div>
          </SortableDayCard>
        ))}
        </SortableContext>
        </DndContext>

        {/* Add Day */}
        {showNewDay ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-[var(--color-border)] p-4 sm:p-6 space-y-3">
            <h3 className="text-sm font-medium">New Day</h3>
            <input
              value={newDayForm.title}
              onChange={(e) =>
                setNewDayForm({ ...newDayForm, title: e.target.value })
              }
              placeholder="Day title (e.g. Day 11 — Something)"
              className="w-full h-10 px-3 rounded-lg border text-sm"
            />
            <input
              type="date"
              value={newDayForm.date}
              onChange={(e) =>
                setNewDayForm({ ...newDayForm, date: e.target.value })
              }
              className="w-full h-10 px-3 rounded-lg border text-sm"
            />
            <div className="flex gap-2">
              <button
                onClick={addDay}
                disabled={!newDayForm.title || !newDayForm.date}
                className="h-10 px-5 bg-[#4285F4] text-white rounded-lg text-xs font-medium disabled:opacity-50"
              >
                Create Day
              </button>
              <button
                onClick={() => {
                  setShowNewDay(false);
                  setNewDayForm({ title: "", date: "" });
                }}
                className="h-10 px-5 bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowNewDay(true)}
            className="w-full py-4 sm:py-5 border-2 border-dashed border-gray-300 rounded-2xl text-sm text-gray-400 hover:text-gray-600 hover:border-gray-400 transition-colors min-h-[48px]"
          >
            + Add New Day
          </button>
        )}
          </>
        )}
      </div>
    </div>
  );
}
