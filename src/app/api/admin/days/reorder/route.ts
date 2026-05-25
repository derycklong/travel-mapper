import { NextResponse } from "next/server";
import db from "@/lib/db";
import { validateAdmin } from "@/lib/auth";

export async function PUT(request: Request) {
  if (!validateAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const days: { id: string; sort_order: number }[] = body.days;

  if (!Array.isArray(days)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const updateStmt = db.prepare(
    "UPDATE itinerary_days SET sort_order = ? WHERE id = ?"
  );

  const reorder = db.transaction(() => {
    for (const day of days) {
      updateStmt.run(day.sort_order, day.id);
    }
  });

  reorder();

  return NextResponse.json({ success: true });
}
