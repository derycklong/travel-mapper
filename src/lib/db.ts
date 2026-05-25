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
  INSERT OR IGNORE INTO settings (key, value) VALUES ('trip_title', 'Hokkaido Autumn Road Trip');
  INSERT OR IGNORE INTO settings (key, value) VALUES ('trip_subtitle', '10 Days in Hokkaido — Sapporo, Lake Toya, Furano, Biei, Sounkyo & Otaru');
`);

const itemColumns = db
  .prepare("PRAGMA table_info(itinerary_items)")
  .all() as { name: string }[];

if (!itemColumns.some((column) => column.name === "location_id")) {
  db.prepare("ALTER TABLE itinerary_items ADD COLUMN location_id TEXT").run();
  db.prepare("CREATE INDEX IF NOT EXISTS idx_items_location_id ON itinerary_items(location_id)").run();
}

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
