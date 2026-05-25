import { create } from "zustand";
import type { DayWithItems, ItineraryItem } from "@/lib/types";

interface ItineraryState {
  days: DayWithItems[];
  selectedDayId: string | null;
  selectedItemId: string | null;
  hoveredItemId: string | null;
  activeDayFilter: number | null;
  isLoading: boolean;
  error: string | null;
  theme: "light" | "dark";
  tripTitle: string;
  tripSubtitle: string;

  setDays: (days: DayWithItems[]) => void;
  selectDay: (dayId: string | null) => void;
  selectItem: (itemId: string | null) => void;
  hoverItem: (itemId: string | null) => void;
  setDayFilter: (dayIndex: number | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  toggleTheme: () => void;
  getAllItems: () => ItineraryItem[];
  setTripInfo: (title: string, subtitle: string) => void;
}

export const useItineraryStore = create<ItineraryState>((set, get) => ({
  days: [],
  selectedDayId: null,
  selectedItemId: null,
  hoveredItemId: null,
  activeDayFilter: null,
  isLoading: false,
  error: null,
  theme: "light",
  tripTitle: "Hokkaido Autumn Road Trip",
  tripSubtitle:
    "10 Days in Hokkaido — Sapporo, Lake Toya, Furano, Biei, Sounkyo & Otaru",

  setDays: (days) => set({ days, isLoading: false }),
  selectDay: (dayId) =>
    set({ selectedDayId: dayId, selectedItemId: null }),
  selectItem: (itemId) => set({ selectedItemId: itemId }),
  hoverItem: (itemId) => set({ hoveredItemId: itemId }),
  setDayFilter: (dayIndex) => set({ activeDayFilter: dayIndex }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error, isLoading: false }),
  toggleTheme: () =>
    set((s) => ({ theme: s.theme === "light" ? "dark" : "light" })),
  getAllItems: () => get().days.flatMap((d) => d.items),
  setTripInfo: (title, subtitle) => set({ tripTitle: title, tripSubtitle: subtitle }),
}));
