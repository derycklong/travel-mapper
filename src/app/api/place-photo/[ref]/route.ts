import { NextResponse } from "next/server";
import { getEnv } from "@/lib/env";
import db from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ ref: string }> }
) {
  const { ref } = await params;
  if (!ref) return NextResponse.json({ error: "Missing photo reference" }, { status: 400 });

  // Check DB cache first
  const cached = db.prepare("SELECT data, mime_type FROM place_photos WHERE photo_ref = ?").get(ref) as { data: Buffer; mime_type: string } | undefined;
  if (cached) {
    console.log(`[place-photo] CACHE HIT: ${ref.slice(0, 16)}…`);
    return new NextResponse(new Uint8Array(cached.data), {
      status: 200,
      headers: {
        "Content-Type": cached.mime_type,
        "Cache-Control": "public, max-age=86400",
      },
    });
  }

  // Not cached — fetch, store, and serve
  const apiKey = getEnv("GOOGLE_MAPS_API_KEY");
  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  const url = new URL("https://maps.googleapis.com/maps/api/place/photo");
  url.searchParams.set("maxwidth", "400");
  url.searchParams.set("photo_reference", ref);
  url.searchParams.set("key", apiKey);

  try {
    const redirectResp = await fetch(url, { redirect: "manual" });
    if (redirectResp.status !== 302 && redirectResp.status !== 303) {
      return NextResponse.json({ error: "Failed to get photo" }, { status: 502 });
    }

    const location = redirectResp.headers.get("location");
    if (!location) {
      return NextResponse.json({ error: "Missing photo redirect" }, { status: 502 });
    }

    const imgResp = await fetch(location);
    if (!imgResp.ok) {
      return NextResponse.redirect(location, 302);
    }

    console.log(`[place-photo] GOOGLE FETCH: ${ref.slice(0, 16)}…`);
    const buffer = Buffer.from(await imgResp.arrayBuffer());
    const mime = imgResp.headers.get("content-type") || "image/jpeg";

    // Store in DB (fire-and-forget style within the handler)
    try {
      db.prepare(
        "INSERT OR REPLACE INTO place_photos (photo_ref, data, mime_type, created_at) VALUES (?, ?, ?, datetime('now'))"
      ).run(ref, buffer, mime);
    } catch { /* storage failure is non-critical */ }

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": mime,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch photo" }, { status: 502 });
  }
}
