"use client";

import { useEffect, useState, useCallback, createContext, useContext } from "react";
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
import * as Dialog from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
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

const EditLocationDialog = dynamic(
  () => import("@/components/admin/EditLocationDialog").then((mod) => mod.EditLocationDialog),
  { ssr: false }
);

const GoogleLocationSearch = dynamic(
  () => import("@/components/admin/GoogleLocationSearch"),
  { ssr: false }
);

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

function DraggableLocationCard({
  location,
  isEditing,
  onClick,
  onEdit,
  onDelete,
}: {
  location: Location;
  isEditing: boolean;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: location.id,
  });

  const style = transform ? {
    transform: CSS.Translate.toString(transform),
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all border ${
        isDragging ? "opacity-50" : ""
      } ${
        isEditing
          ? "bg-[#4285F4]/5 border-[#4285F4]/30"
          : "hover:bg-gray-50 dark:hover:bg-gray-800/30 border-transparent"
      }`}
    >
      <div
        {...attributes}
        {...(listeners as React.DOMAttributes<HTMLDivElement>)}
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
        <p className="text-sm font-semibold truncate" style={{ color: "var(--color-text)" }}>{location.name}</p>
        <p className="text-xs truncate" style={{ color: "var(--color-muted)" }}>{location.address || `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`}</p>
      </div>
      <div className="flex-shrink-0">
        {location.item_count ? (
          <span className={`inline-flex items-center justify-center h-5 min-w-[22px] px-1.5 rounded-full text-[11px] font-semibold ${
            location.item_count >= 10 ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
            : location.item_count >= 5 ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
            : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
          }`}>{location.item_count}</span>
        ) : <span className="text-xs" style={{ color: "var(--color-muted)" }}>—</span>}
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label="Edit"
        >
          <Pencil className="w-3.5 h-3.5" style={{ color: "var(--color-muted)" }} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors"
          aria-label="Delete"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
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
    google_route_url: "",
    sort_order: 0,
  });

  const [locationFilter, setLocationFilter] = useState("");
  const [flyToKey, setFlyToKey] = useState(0);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [mergeSourceId, setMergeSourceId] = useState("");
  const [mergeTargetId, setMergeTargetId] = useState("");
  const [showMergeConfirm, setShowMergeConfirm] = useState(false);

  const [headerTitle, setHeaderTitle] = useState("");
  const [headerSubtitle, setHeaderSubtitle] = useState("");
  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const [newDayForm, setNewDayForm] = useState({ title: "", date: "" });
  const [showNewDay, setShowNewDay] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const locationSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("admin_token");
    if (stored) {
      setToken(stored);
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchData();
    }
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
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const [daysRes, itemsRes, locationsRes, settingsRes] = await Promise.all([
        fetch("/api/admin/days", { headers }),
        fetch("/api/admin/items", { headers }),
        fetch("/api/admin/locations", { headers }),
        fetch("/api/settings"),
      ]);

      if (daysRes.status === 401 || itemsRes.status === 401 || locationsRes.status === 401) {
        localStorage.removeItem("admin_token");
        document.cookie = "admin_token=; path=/; max-age=0";
        setToken(null);
        return;
      }

      const [daysData, itemsData, locationsData, settingsData] = await Promise.all([
        daysRes.ok ? daysRes.json() : { days: [] },
        itemsRes.ok ? itemsRes.json() : { items: [] },
        locationsRes.ok ? locationsRes.json() : { locations: [] },
        settingsRes.ok ? settingsRes.json() : {} as Record<string, string>,
      ]);

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
    } catch (e) {
      console.error("Failed to load admin data:", e);
    } finally {
      setIsLoading(false);
    }
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
    document.cookie = "admin_token=; path=/; max-age=0";
    setToken(null);
    router.replace("/admin/login");
  }

  if (isLoading || !token) {
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
          <>
            <div className="grid grid-cols-2 h-full">
              {/* Left: Map */}
              <div className="p-6 pr-3 min-h-0">
                <div className="h-full bg-white dark:bg-gray-900 rounded-2xl border border-[var(--color-border)] overflow-hidden flex flex-col">
                  <div className="px-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 flex-shrink-0">
                    <h2 className="font-medium text-xs">Map  <span className="text-gray-400 font-normal">· Click to set coordinates</span></h2>
                  </div>
                  <div className="relative flex-1 min-h-0">
                    <AdminLocationMap
                      latitude={editingLocation?.latitude ?? 43.0621}
                      locations={locations}
                      longitude={editingLocation?.longitude ?? 141.3544}
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
                      onSelectLocation={(location) => {
                        setEditingLocation(location);
                        setFlyToKey((k) => k + 1);
                      }}
                      selectedLocationId={editingLocation?.id || ""}
                      flyToKey={flyToKey}
                    />
                  </div>
                </div>
              </div>

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
                        <p className="text-xs mt-1" style={{ color: "var(--color-muted)" }}>Click the map or &quot;Add Location&quot; to create one</p>
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
                          <DraggableLocationCard
                            key={loc.id}
                            location={loc}
                            isEditing={editingLocation?.id === loc.id}
                            onClick={() => { setEditingLocation(loc); setFlyToKey((k) => k + 1); }}
                            onEdit={() => { setEditingLocation(loc); setFlyToKey((k) => k + 1); }}
                            onDelete={() => deleteLocation(loc.id)}
                          />
                        ))}
                      </div>
                    </DndContext>
                  )}
                </div>

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
              </div>
            </div>
          </>
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
                              google_route_url: it.google_route_url || "",
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
                        <option value="">No location</option>
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
                    <div className="mb-3">
                      <input
                        value={editItemForm.google_route_url}
                        onChange={(e) =>
                          setEditItemForm({
                            ...editItemForm,
                            google_route_url: e.target.value,
                          })
                        }
                        placeholder="Google Route URL (optional)"
                        className="h-10 sm:h-9 w-full px-3 rounded-lg border text-xs"
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
                    location_id: "",
                    description: "",
                    notes: "",
                    google_route_url: "",
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
