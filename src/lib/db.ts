import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "itinerary.db");

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const db = new Database(DB_PATH);

// Enable WAL mode for better performance
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// Create schema
db.exec(`
  CREATE TABLE IF NOT EXISTS itinerary_days (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    date TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS itinerary_items (
    id TEXT PRIMARY KEY,
    day_id TEXT NOT NULL REFERENCES itinerary_days(id) ON DELETE CASCADE,
    start_time TEXT NOT NULL,
    end_time TEXT,
    activity TEXT NOT NULL,
    description TEXT,
    latitude REAL NOT NULL DEFAULT 43.0621,
    longitude REAL NOT NULL DEFAULT 141.3544,
    location_name TEXT NOT NULL DEFAULT '',
    notes TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_items_day_id ON itinerary_items(day_id);
  CREATE INDEX IF NOT EXISTS idx_items_sort ON itinerary_items(sort_order);
  CREATE INDEX IF NOT EXISTS idx_days_sort ON itinerary_days(sort_order);

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS locations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    address TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(name, latitude, longitude)
  );

  CREATE INDEX IF NOT EXISTS idx_locations_name ON locations(name);

  -- Default settings if not set
  INSERT OR IGNORE INTO settings (key, value) VALUES ('trip_title', 'My Trip');
  INSERT OR IGNORE INTO settings (key, value) VALUES ('trip_subtitle', 'Plan your adventure');
`);

const itemColumns = db
  .prepare("PRAGMA table_info(itinerary_items)")
  .all() as { name: string; notnull: number }[];

if (!itemColumns.some((column) => column.name === "location_id")) {
  db.prepare("ALTER TABLE itinerary_items ADD COLUMN location_id TEXT").run();
  db.prepare("CREATE INDEX IF NOT EXISTS idx_items_location_id ON itinerary_items(location_id)").run();
}

if (!itemColumns.some((column) => column.name === "google_maps_url")) {
  db.prepare("ALTER TABLE itinerary_items ADD COLUMN google_maps_url TEXT").run();
}

if (!itemColumns.some((column) => column.name === "google_route_url")) {
  db.prepare("ALTER TABLE itinerary_items ADD COLUMN google_route_url TEXT").run();
}

// Make latitude/longitude nullable — SQLite can't ALTER COLUMN, so recreate table
const latCol = itemColumns.find((c) => c.name === "latitude");
const lngCol = itemColumns.find((c) => c.name === "longitude");
if (latCol?.notnull || lngCol?.notnull) {
  db.exec(`
    CREATE TABLE itinerary_items_v2 (
      id TEXT PRIMARY KEY,
      day_id TEXT NOT NULL REFERENCES itinerary_days(id) ON DELETE CASCADE,
      location_id TEXT,
      start_time TEXT NOT NULL,
      end_time TEXT,
      activity TEXT NOT NULL,
      description TEXT,
      latitude REAL,
      longitude REAL,
      location_name TEXT NOT NULL DEFAULT '',
      notes TEXT,
      google_maps_url TEXT,
      google_route_url TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );
    INSERT INTO itinerary_items_v2 (
      id, day_id, location_id, start_time, end_time, activity, description,
      latitude, longitude, location_name, notes, google_maps_url, google_route_url,
      sort_order, created_at
    )
    SELECT
      id, day_id, location_id, start_time, end_time, activity, description,
      CASE WHEN location_id IS NULL THEN NULL ELSE latitude END,
      CASE WHEN location_id IS NULL THEN NULL ELSE longitude END,
      location_name, notes, google_maps_url, google_route_url,
      sort_order, created_at
    FROM itinerary_items;
    DROP TABLE itinerary_items;
    ALTER TABLE itinerary_items_v2 RENAME TO itinerary_items;
    CREATE INDEX IF NOT EXISTS idx_items_day_id ON itinerary_items(day_id);
    CREATE INDEX IF NOT EXISTS idx_items_sort ON itinerary_items(sort_order);
    CREATE INDEX IF NOT EXISTS idx_items_location_id ON itinerary_items(location_id);
  `);
}

// Cache tables for Google Places API cost reduction
db.exec(`
  CREATE TABLE IF NOT EXISTS place_cache (
    location_name TEXT PRIMARY KEY,
    place_json TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS location_search_cache (
    query_hash TEXT PRIMARY KEY,
    results_json TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS place_photos (
    photo_ref TEXT PRIMARY KEY,
    data BLOB NOT NULL,
    mime_type TEXT NOT NULL DEFAULT 'image/jpeg',
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

db.exec(`
  INSERT OR IGNORE INTO locations (id, name, latitude, longitude, address)
  SELECT
    lower(hex(randomblob(16))),
    location_name,
    latitude,
    longitude,
    NULL
  FROM itinerary_items
  WHERE location_name IS NOT NULL
    AND trim(location_name) <> '';

  UPDATE itinerary_items
  SET location_id = (
    SELECT locations.id
    FROM locations
    WHERE locations.name = itinerary_items.location_name
      AND locations.latitude = itinerary_items.latitude
      AND locations.longitude = itinerary_items.longitude
    LIMIT 1
  )
  WHERE location_id IS NULL
    AND location_name IS NOT NULL
    AND trim(location_name) <> '';
`);

export default db;
