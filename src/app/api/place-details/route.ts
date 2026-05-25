import { NextResponse } from "next/server";
import { getEnv } from "@/lib/env";
import db from "@/lib/db";

interface GooglePlaceResult {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: { location: { lat: number; lng: number } };
  photos?: { photo_reference: string; height: number; width: number }[];
  rating?: number;
  user_ratings_total?: number;
}

interface GooglePlaceDetails {
  place_id: string;
  name: string;
  formatted_address: string;
  formatted_phone_number?: string;
  website?: string;
  rating?: number;
  user_ratings_total?: number;
  reviews?: {
    author_name: string;
    author_url?: string;
    profile_photo_url?: string;
    rating: number;
    relative_time_description: string;
    text: string;
    time: number;
    language?: string;
  }[];
  photos?: { photo_reference: string; height: number; width: number }[];
  url?: string;
}

interface GoogleSearchResponse {
  status: string;
  results: GooglePlaceResult[];
  error_message?: string;
}

interface GoogleDetailsResponse {
  status: string;
  result: GooglePlaceDetails;
  error_message?: string;
}

const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const itemId = searchParams.get("itemId");
  if (!q) return NextResponse.json({ error: "Missing query" }, { status: 400 });

  const cacheKey = q.toLowerCase();

  // Check cache
  const cached = db.prepare("SELECT place_json, created_at FROM place_cache WHERE location_name = ?").get(cacheKey) as { place_json: string; created_at: string } | undefined;
  if (cached) {
    const age = Date.now() - new Date(cached.created_at + "Z").getTime();
    if (age < CACHE_TTL_MS) {
      console.log(`[place-details] CACHE HIT: ${q}`);
      const res = NextResponse.json({ place: JSON.parse(cached.place_json) });
      return res;
    }
  }

  const apiKey = getEnv("GOOGLE_MAPS_API_KEY");
  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  try {
    // Step 1: Search for the place
    const searchUrl = new URL("https://maps.googleapis.com/maps/api/place/textsearch/json");
    searchUrl.searchParams.set("query", q);
    if (lat && lng) {
      searchUrl.searchParams.set("location", `${lat},${lng}`);
      searchUrl.searchParams.set("radius", "10000");
    }
    searchUrl.searchParams.set("key", apiKey);
    searchUrl.searchParams.set("language", "en");

    const searchRes = await fetch(searchUrl);
    const searchData = (await searchRes.json()) as GoogleSearchResponse;

    if (searchData.status !== "OK" || !searchData.results?.length) {
      return NextResponse.json({ place: null });
    }

    const placeId = searchData.results[0].place_id;
    const searchRating = searchData.results[0].rating;
    const searchTotal = searchData.results[0].user_ratings_total;
    const searchPhotos = searchData.results[0].photos || [];

    // Step 2: Get place details for reviews
    const detailsUrl = new URL("https://maps.googleapis.com/maps/api/place/details/json");
    detailsUrl.searchParams.set("place_id", placeId);
    detailsUrl.searchParams.set("key", apiKey);
    detailsUrl.searchParams.set("fields", "name,formatted_address,rating,user_ratings_total,reviews,photos,url,website,formatted_phone_number");
    detailsUrl.searchParams.set("language", "en");
    detailsUrl.searchParams.set("region", "jp");

    const detailsRes = await fetch(detailsUrl);
    const detailsData = (await detailsRes.json()) as GoogleDetailsResponse;

    let placeResult: Record<string, unknown>;

    if (detailsData.status !== "OK") {
      placeResult = {
        name: searchData.results[0].name,
        address: searchData.results[0].formatted_address,
        rating: searchRating || null,
        totalRatings: searchTotal || null,
        photos: searchPhotos.slice(0, 3).map((p) => p.photo_reference),
        reviews: [],
        url: null,
      };
    } else {
      const place = detailsData.result;
      placeResult = {
        name: place.name,
        address: place.formatted_address,
        rating: place.rating || null,
        totalRatings: place.user_ratings_total || null,
        photos: (place.photos || []).slice(0, 3).map((p) => p.photo_reference),
        reviews: (place.reviews || []).slice(0, 3).map((r) => ({
          authorName: r.author_name,
          authorUrl: r.author_url || null,
          photoUrl: r.profile_photo_url || null,
          rating: r.rating,
          text: r.text,
          relativeTime: r.relative_time_description,
        })),
        url: place.url || null,
        website: place.website || null,
      };

    // Save google_maps_url to the item if we have an itemId
    if (place.url && itemId) {
      db.prepare("UPDATE itinerary_items SET google_maps_url = ? WHERE id = ?").run(place.url, itemId);
    }
  }

  console.log(`[place-details] GOOGLE FETCH: ${q}`);
  // Save to cache
  db.prepare(
    "INSERT OR REPLACE INTO place_cache (location_name, place_json, created_at) VALUES (?, ?, datetime('now'))"
  ).run(cacheKey, JSON.stringify(placeResult));

  const res = NextResponse.json({ place: placeResult });
  res.headers.set("Cache-Control", "public, max-age=86400");
  return res;
  } catch (err) {
    console.error("Place details error:", err);
    return NextResponse.json({ error: "Failed to fetch place details" }, { status: 502 });
  }
}
