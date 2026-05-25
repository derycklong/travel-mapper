import { NextResponse } from "next/server";
import db from "@/lib/db";
import { validateAdmin } from "@/lib/auth";

export async function PUT(request: Request) {
  if (!validateAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const items: { id: string; sort_order: number }[] = body.items;

  if (!Array.isArray(items)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const updateStmt = db.prepare(
    "UPDATE itinerary_items SET sort_order = ? WHERE id = ?"
  );

  const reorder = db.transaction(() => {
    for (const item of items) {
      updateStmt.run(item.sort_order, item.id);
    }
  });

  reorder();

  return NextResponse.json({ success: true });
}
