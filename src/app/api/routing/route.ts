import { NextRequest, NextResponse } from "next/server";

interface Waypoint {
  lat: number;
  lng: number;
}

// --- Cache ---
const CACHE_TTL = 3600 * 1000; // 1 hour
const MAX_CACHE = 200;
const cache = new Map<string, { data: [number, number][]; ts: number }>();

// --- Rate limiter ---
const RATE_WINDOW = 60_000; // 1 minute
const RATE_MAX = 30; // requests per window per IP
const rateMap = new Map<string, { count: number; resetAt: number }>();

function getClientIp(request: NextRequest): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")
    || "127.0.0.1";
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }
  if (entry.count >= RATE_MAX) return false;
  entry.count++;
  return true;
}

// Periodically evict stale rate entries
const RATE_EVICT_INTERVAL = 300_000; // 5 min
let lastRateEvict = Date.now();

function evictStaleRateEntries(): void {
  const now = Date.now();
  if (now - lastRateEvict < RATE_EVICT_INTERVAL) return;
  lastRateEvict = now;
  for (const [ip, entry] of rateMap) {
    if (now > entry.resetAt) rateMap.delete(ip);
  }
  if (rateMap.size > 1000) rateMap.clear(); // safety valve
}

function cacheSet(key: string, data: [number, number][]): void {
  if (cache.size >= MAX_CACHE) {
    // Evict oldest entry
    let oldestKey = key;
    let oldestTs = Infinity;
    for (const [k, v] of cache) {
      if (v.ts < oldestTs) { oldestTs = v.ts; oldestKey = k; }
    }
    cache.delete(oldestKey);
  }
  cache.set(key, { data, ts: Date.now() });
}

export async function POST(request: NextRequest) {
  // Rate limit
  evictStaleRateEntries();
  const ip = getClientIp(request);
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }

  // Validate input
  let waypoints: Waypoint[];
  try {
    const body = await request.json();
    waypoints = body.waypoints;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!Array.isArray(waypoints) || waypoints.length < 2) {
    return NextResponse.json({ error: "At least 2 waypoints required" }, { status: 400 });
  }

  if (waypoints.length > 10) {
    return NextResponse.json({ error: "Maximum 10 waypoints" }, { status: 400 });
  }

  for (const w of waypoints) {
    if (typeof w.lat !== "number" || typeof w.lng !== "number" || !isFinite(w.lat) || !isFinite(w.lng)) {
      return NextResponse.json({ error: "Invalid waypoint coordinates" }, { status: 400 });
    }
    if (w.lat < -90 || w.lat > 90 || w.lng < -180 || w.lng > 180) {
      return NextResponse.json({ error: "Coordinates out of range" }, { status: 400 });
    }
  }

  // Check cache
  const cacheKey = waypoints.map((w) => `${w.lat.toFixed(5)},${w.lng.toFixed(5)}`).join("|");
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return NextResponse.json({ coordinates: cached.data });
  }

  // Fetch from OSRM
  const coords = waypoints.map((w) => `${w.lng},${w.lat}`).join(";");
  const url = `https://router.project-osrm.org/route/v1/driving/${coords}?geometries=geojson&overview=full`;

  let res: Response;
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(10000) });
  } catch {
    return NextResponse.json({ error: "Routing service unreachable" }, { status: 502 });
  }

  if (!res.ok) {
    return NextResponse.json({ error: "Routing service error" }, { status: 502 });
  }

  let data: any;
  try {
    data = await res.json();
  } catch {
    return NextResponse.json({ error: "Invalid response from routing service" }, { status: 502 });
  }

  if (!data?.routes?.[0]?.geometry?.coordinates) {
    return NextResponse.json({ error: "No route found between waypoints" }, { status: 404 });
  }

  const coordinates: [number, number][] = data.routes[0].geometry.coordinates.map(
    ([lng, lat]: number[]) => [lat, lng] as [number, number],
  );

  cacheSet(cacheKey, coordinates);

  return NextResponse.json({ coordinates });
}
