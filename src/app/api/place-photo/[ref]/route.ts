import { NextResponse } from "next/server";
import { getEnv } from "@/lib/env";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ ref: string }> }
) {
  const { ref } = await params;
  if (!ref) return NextResponse.json({ error: "Missing photo reference" }, { status: 400 });

  const apiKey = getEnv("GOOGLE_MAPS_API_KEY");
  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  const url = new URL("https://maps.googleapis.com/maps/api/place/photo");
  url.searchParams.set("maxwidth", "400");
  url.searchParams.set("photo_reference", ref);
  url.searchParams.set("key", apiKey);

  try {
    const response = await fetch(url);
    // Google Places Photo API returns a 302 redirect to the actual image
    const imageUrl = response.url;
    if (!imageUrl || imageUrl.includes("maps.googleapis.com")) {
      return NextResponse.json({ error: "Failed to get photo" }, { status: 502 });
    }
    const imageRes = await fetch(imageUrl);
    const blob = await imageRes.blob();
    return new NextResponse(blob, {
      headers: {
        "Content-Type": imageRes.headers.get("content-type") || "image/jpeg",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch photo" }, { status: 502 });
  }
}
