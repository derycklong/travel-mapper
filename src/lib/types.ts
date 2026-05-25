export interface ItineraryDay {
  id: string;
  title: string;
  date: string;
  sort_order: number;
  created_at?: string;
}

export interface ItineraryItem {
  id: string;
  day_id: string;
  location_id?: string | null;
  start_time: string;
  end_time: string | null;
  activity: string;
  description: string | null;
  latitude: number;
  longitude: number;
  location_name: string;
  notes: string | null;
  sort_order: number;
  created_at?: string;
}

export interface Location {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string | null;
  created_at?: string;
  item_count?: number;
}

export type CategoryIcon =
  | "plane"
  | "train"
  | "hotel"
  | "food"
  | "hiking"
  | "sightseeing"
  | "shopping"
  | "car"
  | "onsen"
  | "cafe"
  | "museum"
  | "park"
  | "water"
  | "default";

export interface ItineraryItemWithDay extends ItineraryItem {
  day_title: string;
  day_date: string;
}

export interface DayWithItems extends ItineraryDay {
  items: ItineraryItem[];
}

export type Theme = "light" | "dark";
