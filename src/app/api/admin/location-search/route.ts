import { NextResponse } from "next/server";
import { validateAdmin } from "@/lib/auth";
import { getEnv } from "@/lib/env";
import crypto from "crypto";
import db from "@/lib/db";

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

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function GET(request: Request) {
  if (!validateAdmin(request)) return unauthorized();

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  const region = searchParams.get("region")?.trim();
  if (!q) return NextResponse.json({ results: [] });

  // Check cache
  const queryHash = crypto.createHash("md5").update(`${q}||${region || ""}`).digest("hex");
  const cached = db.prepare("SELECT results_json, created_at FROM location_search_cache WHERE query_hash = ?").get(queryHash) as { results_json: string; created_at: string } | undefined;
  if (cached) {
    const age = Date.now() - new Date(cached.created_at + "Z").getTime();
    if (age < CACHE_TTL_MS) {
      console.log(`[location-search] CACHE HIT: ${q}${region ? ` (${region})` : ""}`);
      return NextResponse.json({ results: JSON.parse(cached.results_json) });
    }
  }

  const apiKey = getEnv("GOOGLE_MAPS_API_KEY");
  if (!apiKey) {
    return NextResponse.json(
      { error: "Google Maps API key not configured" },
      { status: 500 }
    );
  }

  const url = new URL("https://maps.googleapis.com/maps/api/place/textsearch/json");
  url.searchParams.set("query", region ? `${q}, ${region}` : q);
  url.searchParams.set("key", apiKey);
  url.searchParams.set("language", "en");

  let countryCode = "";
  if (region && /^[a-z]{2}$/i.test(region)) {
    countryCode = region.toLowerCase();
  } else if (region) {
    const countryMap: Record<string, string> = {
      japan: "jp", singapore: "sg", malaysia: "my", indonesia: "id",
      thailand: "th", vietnam: "vn", philippines: "ph", "south korea": "kr",
      china: "cn", taiwan: "tw", hongkong: "hk", "united states": "us",
      usa: "us", australia: "au", "new zealand": "nz", france: "fr",
      italy: "it", spain: "es", germany: "de", uk: "gb",
      "united kingdom": "gb", canada: "ca", mexico: "mx", india: "in",
      brazil: "br", argentina: "ar", egypt: "eg", "south africa": "za",
    };
    countryCode = countryMap[region.toLowerCase().replace(/\s+/g, "")] || countryMap[region.toLowerCase()] || "";
  } else {
    countryCode = "jp";
  }

  if (countryCode) url.searchParams.set("region", countryCode);

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

  // Save to cache
  console.log(`[location-search] GOOGLE FETCH: ${q}${region ? ` (${region})` : ""}`);

  db.prepare(
    "INSERT OR REPLACE INTO location_search_cache (query_hash, results_json, created_at) VALUES (?, ?, datetime('now'))"
  ).run(queryHash, JSON.stringify(results));

  return NextResponse.json({ results });
}

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
