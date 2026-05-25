import { NextResponse } from "next/server";
import { validateAdmin } from "@/lib/auth";
import db from "@/lib/db";

export async function POST(request: Request) {
  if (!validateAdmin(request)) return unauthorized();

  const body = await request.json();
  const { sourceId, targetId } = body;

  if (!sourceId || !targetId) {
    return NextResponse.json(
      { error: "sourceId and targetId are required" },
      { status: 400 }
    );
  }

  if (sourceId === targetId) {
    return NextResponse.json(
      { error: "Cannot merge a location into itself" },
      { status: 400 }
    );
  }

  const source = db
    .prepare("SELECT * FROM locations WHERE id = ?")
    .get(sourceId) as { id: string; name: string } | undefined;
  const target = db
    .prepare("SELECT * FROM locations WHERE id = ?")
    .get(targetId) as { id: string; name: string; latitude: number; longitude: number } | undefined;

  if (!source) {
    return NextResponse.json(
      { error: "Source location not found" },
      { status: 404 }
    );
  }
  if (!target) {
    return NextResponse.json(
      { error: "Target location not found" },
      { status: 404 }
    );
  }

  const { count } = db
    .prepare("SELECT COUNT(*) as count FROM itinerary_items WHERE location_id = ?")
    .get(sourceId) as { count: number };

  db.prepare(
    `UPDATE itinerary_items
     SET location_id = ?,
         location_name = ?,
         latitude = ?,
         longitude = ?
     WHERE location_id = ?`
  ).run(targetId, target.name, target.latitude, target.longitude, sourceId);

  db.prepare("DELETE FROM locations WHERE id = ?").run(sourceId);

  return NextResponse.json({
    success: true,
    affectedItems: count,
    sourceName: source.name,
    targetName: target.name,
  });
}

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
