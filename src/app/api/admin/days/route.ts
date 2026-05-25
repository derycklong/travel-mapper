import { NextResponse } from "next/server";
import db from "@/lib/db";
import { validateAdmin } from "@/lib/auth";
import { randomUUID } from "crypto";

export async function GET(request: Request) {
  if (!validateAdmin(request)) return unauthorized();

  const days = db
    .prepare("SELECT * FROM itinerary_days ORDER BY sort_order ASC")
    .all();

  return NextResponse.json({ days });
}

export async function POST(request: Request) {
  if (!validateAdmin(request)) return unauthorized();

  const body = await request.json();
  const id = body.id || randomUUID();

  db.prepare(
    `INSERT INTO itinerary_days (id, title, date, sort_order)
     VALUES (?, ?, ?, ?)`
  ).run(id, body.title, body.date, body.sort_order ?? 0);

  const day = db.prepare("SELECT * FROM itinerary_days WHERE id = ?").get(id);
  return NextResponse.json({ day });
}

export async function PUT(request: Request) {
  if (!validateAdmin(request)) return unauthorized();

  const { id, ...updates } = await request.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const fields: string[] = [];
  const values: unknown[] = [];

  if (updates.title !== undefined) { fields.push("title = ?"); values.push(updates.title); }
  if (updates.date !== undefined) { fields.push("date = ?"); values.push(updates.date); }
  if (updates.sort_order !== undefined) { fields.push("sort_order = ?"); values.push(updates.sort_order); }

  if (fields.length > 0) {
    values.push(id);
    db.prepare(`UPDATE itinerary_days SET ${fields.join(", ")} WHERE id = ?`).run(...values);
  }

  const day = db.prepare("SELECT * FROM itinerary_days WHERE id = ?").get(id);
  return NextResponse.json({ day });
}

export async function DELETE(request: Request) {
  if (!validateAdmin(request)) return unauthorized();

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  db.prepare("DELETE FROM itinerary_items WHERE day_id = ?").run(id);
  db.prepare("DELETE FROM itinerary_days WHERE id = ?").run(id);

  return NextResponse.json({ success: true });
}

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
