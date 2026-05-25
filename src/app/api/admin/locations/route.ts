import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { validateAdmin } from "@/lib/auth";
import db from "@/lib/db";

export async function GET(request: Request) {
  if (!validateAdmin(request)) return unauthorized();

  const locations = db
    .prepare(
      `SELECT locations.*, 
              (SELECT COUNT(*) FROM itinerary_items WHERE itinerary_items.location_id = locations.id) as item_count
       FROM locations 
       ORDER BY name COLLATE NOCASE ASC`
    )
    .all();

  return NextResponse.json({ locations });
}

export async function POST(request: Request) {
  if (!validateAdmin(request)) return unauthorized();

  const body = await request.json();
  if (!body.name || body.latitude === undefined || body.longitude === undefined) {
    return NextResponse.json(
      { error: "Name, latitude, and longitude are required" },
      { status: 400 }
    );
  }

  let id = body.id || randomUUID();
  try {
    db.prepare(
      `INSERT INTO locations (id, name, latitude, longitude, address)
       VALUES (?, ?, ?, ?, ?)`
    ).run(
      id,
      String(body.name).trim(),
      Number(body.latitude),
      Number(body.longitude),
      body.address || null
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "";
    if (message.includes("UNIQUE constraint")) {
      // Try to find the existing location with matching name/coords for reuse
      const existing = db
        .prepare("SELECT id FROM locations WHERE name = ? AND latitude = ? AND longitude = ?")
        .get(String(body.name).trim(), Number(body.latitude), Number(body.longitude)) as { id: string } | undefined;
      if (existing) {
        id = existing.id;
      } else {
        return NextResponse.json(
          { error: "A location with this name and coordinates already exists" },
          { status: 409 }
        );
      }
    } else {
      return NextResponse.json(
        { error: "Database error while saving location" },
        { status: 500 }
      );
    }
  }

  const location = db.prepare("SELECT * FROM locations WHERE id = ?").get(id);
  return NextResponse.json({ location });
}

export async function PUT(request: Request) {
  if (!validateAdmin(request)) return unauthorized();

  const body = await request.json();
  if (!body.id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  db.prepare(
    `UPDATE locations
     SET name = ?, latitude = ?, longitude = ?, address = ?
     WHERE id = ?`
  ).run(
    String(body.name || "").trim(),
    Number(body.latitude),
    Number(body.longitude),
    body.address || null,
    body.id
  );

  db.prepare(
    `UPDATE itinerary_items
     SET location_name = ?, latitude = ?, longitude = ?
     WHERE location_id = ?`
  ).run(
    String(body.name || "").trim(),
    Number(body.latitude),
    Number(body.longitude),
    body.id
  );

  const location = db.prepare("SELECT * FROM locations WHERE id = ?").get(body.id);
  return NextResponse.json({ location });
}

export async function DELETE(request: Request) {
  if (!validateAdmin(request)) return unauthorized();

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const used = db
    .prepare("SELECT COUNT(*) as count FROM itinerary_items WHERE location_id = ?")
    .get(id) as { count: number };

  if (used.count > 0) {
    return NextResponse.json(
      { error: "Location is used by itinerary items" },
      { status: 409 }
    );
  }

  db.prepare("DELETE FROM locations WHERE id = ?").run(id);
  return NextResponse.json({ success: true });
}

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
