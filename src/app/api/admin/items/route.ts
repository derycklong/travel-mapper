import { NextResponse } from "next/server";
import db from "@/lib/db";
import { validateAdmin } from "@/lib/auth";
import { randomUUID } from "crypto";

export async function GET(request: Request) {
  if (!validateAdmin(request)) return unauthorized();

  const { searchParams } = new URL(request.url);
  const dayId = searchParams.get("day_id");

  let items;
  if (dayId) {
    items = db
      .prepare(
        `SELECT
          itinerary_items.*,
          COALESCE(locations.name, itinerary_items.location_name) as location_name,
          COALESCE(locations.latitude, itinerary_items.latitude) as latitude,
          COALESCE(locations.longitude, itinerary_items.longitude) as longitude
         FROM itinerary_items
         LEFT JOIN locations ON locations.id = itinerary_items.location_id
         WHERE day_id = ?
         ORDER BY sort_order ASC`
      )
      .all(dayId);
  } else {
    items = db
      .prepare(
        `SELECT
          itinerary_items.*,
          COALESCE(locations.name, itinerary_items.location_name) as location_name,
          COALESCE(locations.latitude, itinerary_items.latitude) as latitude,
          COALESCE(locations.longitude, itinerary_items.longitude) as longitude
         FROM itinerary_items
         LEFT JOIN locations ON locations.id = itinerary_items.location_id
         ORDER BY sort_order ASC`
      )
      .all();
  }

  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  if (!validateAdmin(request)) return unauthorized();

  const body = await request.json();
  const id = body.id || randomUUID();
  const location = getLocation(body.location_id);

  db.prepare(
    `INSERT INTO itinerary_items
     (id, day_id, location_id, start_time, end_time, activity, description, latitude, longitude, location_name, notes, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    body.day_id,
    location?.id || null,
    body.start_time,
    body.end_time || null,
    body.activity,
    body.description || null,
    location?.latitude ?? body.latitude ?? 43.0621,
    location?.longitude ?? body.longitude ?? 141.3544,
    location?.name ?? body.location_name ?? "",
    body.notes || null,
    body.sort_order ?? 0
  );

  const item = db
    .prepare("SELECT * FROM itinerary_items WHERE id = ?")
    .get(id);
  return NextResponse.json({ item });
}

export async function PUT(request: Request) {
  if (!validateAdmin(request)) return unauthorized();

  const { id, ...updates } = await request.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const location = getLocation(updates.location_id);
  if (updates.location_id !== undefined) {
    updates.location_name = location?.name || "";
    updates.latitude = location?.latitude ?? 43.0621;
    updates.longitude = location?.longitude ?? 141.3544;
  }

  const fieldMap: Record<string, string> = {
    location_id: "location_id",
    start_time: "start_time",
    end_time: "end_time",
    activity: "activity",
    description: "description",
    latitude: "latitude",
    longitude: "longitude",
    location_name: "location_name",
    notes: "notes",
    sort_order: "sort_order",
    day_id: "day_id",
  };

  const fields: string[] = [];
  const values: unknown[] = [];

  for (const [key, col] of Object.entries(fieldMap)) {
    if (updates[key] !== undefined) {
      fields.push(`${col} = ?`);
      values.push(updates[key]);
    }
  }

  if (fields.length > 0) {
    values.push(id);
    db.prepare(`UPDATE itinerary_items SET ${fields.join(", ")} WHERE id = ?`).run(...values);
  }

  const item = db
    .prepare("SELECT * FROM itinerary_items WHERE id = ?")
    .get(id);
  return NextResponse.json({ item });
}

export async function DELETE(request: Request) {
  if (!validateAdmin(request)) return unauthorized();

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  db.prepare("DELETE FROM itinerary_items WHERE id = ?").run(id);
  return NextResponse.json({ success: true });
}

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function getLocation(locationId: unknown) {
  if (!locationId || typeof locationId !== "string") return null;
  return db.prepare("SELECT * FROM locations WHERE id = ?").get(locationId) as
    | { id: string; name: string; latitude: number; longitude: number }
    | undefined;
}
