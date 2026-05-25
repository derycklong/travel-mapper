import { NextResponse } from "next/server";
import { validateAdmin } from "@/lib/auth";
import { getEnv } from "@/lib/env";

interface GooglePlaceResult {
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

interface GooglePlacesResponse {
  status: string;
  results: GooglePlaceResult[];
  error_message?: string;
}

export async function GET(request: Request) {
  if (!validateAdmin(request)) return unauthorized();

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  if (!q) return NextResponse.json({ results: [] });

  const apiKey = getEnv("GOOGLE_MAPS_API_KEY");
  if (!apiKey) {
    return NextResponse.json(
      { error: "Google Maps API key not configured" },
      { status: 500 }
    );
  }

  const url = new URL("https://maps.googleapis.com/maps/api/place/textsearch/json");
  url.searchParams.set("query", q);
  url.searchParams.set("key", apiKey);
  url.searchParams.set("region", "jp");
  url.searchParams.set("language", "en");

  const response = await fetch(url);

  if (!response.ok) {
    return NextResponse.json(
      { error: "Location search failed" },
      { status: 502 }
    );
  }

  const data = (await response.json()) as GooglePlacesResponse;

  if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
    return NextResponse.json(
      { error: data.error_message || "Google Places API error" },
      { status: 502 }
    );
  }

  const results = (data.results || []).slice(0, 8).map((place) => ({
    name: place.name,
    address: place.formatted_address,
    latitude: place.geometry.location.lat,
    longitude: place.geometry.location.lng,
  }));

  return NextResponse.json({ results });
}

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
