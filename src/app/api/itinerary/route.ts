import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  try {
    const days = db
      .prepare("SELECT * FROM itinerary_days ORDER BY sort_order ASC")
      .all() as Record<string, unknown>[];

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
      .all() as Record<string, unknown>[];

    const daysWithItems = days.map((day) => ({
      ...day,
      items: items.filter(
        (item) => item.day_id === day.id
      ),
    }));

    return NextResponse.json({ days: daysWithItems });
  } catch (error) {
    console.error("Error fetching itinerary:", error);
    return NextResponse.json(
      { error: "Failed to fetch itinerary data" },
      { status: 500 }
    );
  }
}
