import { NextResponse } from "next/server";
import db from "@/lib/db";
import { validateAdmin } from "@/lib/auth";

export async function PUT(request: Request) {
  if (!validateAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  const upsert = db.prepare(
    "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
  );

  const updateAll = db.transaction(() => {
    for (const [key, value] of Object.entries(body)) {
      if (typeof value === "string") {
        upsert.run(key, value);
      }
    }
  });

  updateAll();

  return NextResponse.json({ success: true });
}
