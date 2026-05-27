import db from "@/lib/db";
import { ItineraryApp } from "@/components/itinerary/ItineraryApp";

export const dynamic = "force-dynamic";

interface DayRow {
  id: string;
  title: string;
  date: string;
  sort_order: number;
}

interface ItemRow {
  id: string;
  day_id: string;
  location_id?: string | null;
  start_time: string;
  end_time: string | null;
  activity: string;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  location_name: string;
  notes: string | null;
  google_route_url: string | null;
  sort_order: number;
}

interface SettingRow {
  key: string;
  value: string;
}

export default function Home() {
  let initialDays: DayRow[] = [];
  let initialItems: ItemRow[] = [];
  let tripTitle = "Hokkaido Autumn Road Trip";
  let tripSubtitle = "10 Days in Hokkaido";

  try {
    const days = db
      .prepare("SELECT * FROM itinerary_days ORDER BY sort_order ASC")
      .all() as DayRow[];

    const items = db
      .prepare(
        `SELECT
          itinerary_items.*,
          COALESCE(locations.name, itinerary_items.location_name) as location_name,
          COALESCE(locations.latitude, itinerary_items.latitude) as latitude,
          COALESCE(locations.longitude, itinerary_items.longitude) as longitude
         FROM itinerary_items
         LEFT JOIN locations ON locations.id = itinerary_items.location_id
         ORDER BY itinerary_items.sort_order ASC`
      )
      .all() as ItemRow[];

    initialDays = days;
    initialItems = items;

    const titleRow = db
      .prepare("SELECT value FROM settings WHERE key = ?")
      .get("trip_title") as SettingRow | undefined;
    const subtitleRow = db
      .prepare("SELECT value FROM settings WHERE key = ?")
      .get("trip_subtitle") as SettingRow | undefined;

    if (titleRow) tripTitle = titleRow.value;
    if (subtitleRow) tripSubtitle = subtitleRow.value;
  } catch (e) {
    console.error("Failed to read itinerary data:", e);
  }

  // Nest items into their parent days
  const daysWithItems = initialDays.map((day) => ({
    ...day,
    items: initialItems.filter((item) => item.day_id === day.id),
  }));

  return (
    <ItineraryApp
      initialDays={daysWithItems}
      tripTitle={tripTitle}
      tripSubtitle={tripSubtitle}
    />
  );
}
