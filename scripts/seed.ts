/**
 * Seed script for Hokkaido itinerary data.
 * Run with: npx tsx scripts/seed.ts
 * Uses SQLite (no Supabase required).
 */

import Database from "better-sqlite3";
import path from "path";
import { randomUUID } from "crypto";

const DB_PATH = path.join(process.cwd(), "data", "itinerary.db");
const db = new Database(DB_PATH);

const days = [
  { title: "Day 1 — Arrival in Sapporo", date: "2026-10-09", sort_order: 1 },
  { title: "Day 2 — Mt Moiwa & Susukino", date: "2026-10-10", sort_order: 2 },
  { title: "Day 3 — Lake Toya", date: "2026-10-11", sort_order: 3 },
  { title: "Day 4 — Furano & Tokachidake", date: "2026-10-12", sort_order: 4 },
  { title: "Day 5 — Biei Blue Pond", date: "2026-10-13", sort_order: 5 },
  { title: "Day 6 — Asahiyama Zoo & Sounkyo", date: "2026-10-14", sort_order: 6 },
  { title: "Day 7 — Kurodake & Waterfalls", date: "2026-10-15", sort_order: 7 },
  { title: "Day 8 — Otaru Day Trip", date: "2026-10-16", sort_order: 8 },
  { title: "Day 9 — Sapporo Culture", date: "2026-10-17", sort_order: 9 },
  { title: "Day 10 — Departure", date: "2026-10-18", sort_order: 10 },
];

const itemsByDay: Record<number, Array<Record<string, unknown>>> = {
  1: [
    { start_time: "19:45", end_time: null, activity: "Arrive at New Chitose Airport", description: "International arrival", latitude: 42.7752, longitude: 141.6921, location_name: "New Chitose Airport", notes: "Clear immigration and collect luggage" },
    { start_time: "20:30", end_time: "21:10", activity: "JR Airport Line to Sapporo", description: "Rapid airport express train", latitude: 43.0681, longitude: 141.3508, location_name: "Sapporo Station", notes: "~40 min ride, JR Pass accepted" },
    { start_time: "21:30", end_time: null, activity: "Check in hotel near Sapporo Station", description: "Drop bags and freshen up", latitude: 43.0675, longitude: 141.3533, location_name: "Hotel near Sapporo Station", notes: null },
    { start_time: "22:00", end_time: null, activity: "Dinner at Susukino — ramen / izakaya / soup curry", description: "Famous entertainment district dining", latitude: 43.0552, longitude: 141.3539, location_name: "Susukino", notes: "Late-night ramen and izakayas galore" },
    { start_time: "23:30", end_time: null, activity: "Rest", description: "Return to hotel", latitude: 43.0675, longitude: 141.3533, location_name: "Hotel near Sapporo Station", notes: null },
  ],
  2: [
    { start_time: "08:30", end_time: null, activity: "Travel to Mount Moiwa trailhead", description: "Take tram or bus to trailhead", latitude: 43.0267, longitude: 141.3317, location_name: "Mount Moiwa Trailhead", notes: "Short ride from central Sapporo" },
    { start_time: "09:00", end_time: "11:30", activity: "Hike Mt Moiwa", description: "Scenic hiking trail to summit", latitude: 43.0224, longitude: 141.3223, location_name: "Mount Moiwa Summit", notes: "Panoramic views of Sapporo city" },
    { start_time: "11:45", end_time: null, activity: "Ropeway down", description: "Scenic ropeway descent", latitude: 43.0275, longitude: 141.3291, location_name: "Mount Moiwa Ropeway Station", notes: null },
    { start_time: "12:30", end_time: null, activity: "Lunch nearby", description: "Local restaurant near ropeway", latitude: 43.0315, longitude: 141.3384, location_name: "Near Mount Moiwa", notes: null },
    { start_time: "14:00", end_time: null, activity: "Explore Odori Park / cafés / shopping", description: "Central Sapporo exploration", latitude: 43.0592, longitude: 141.3478, location_name: "Odori Park", notes: "Beautiful tree-lined park stretching 1.5km" },
    { start_time: "16:00", end_time: null, activity: "Optional: Sapporo Beer Museum", description: "Hokkaido's famous brewery history", latitude: 43.0717, longitude: 141.3688, location_name: "Sapporo Beer Museum", notes: "Entry free, beer tasting available" },
    { start_time: "19:45", end_time: null, activity: "Group 2 arrives", description: "Rest of group meets up", latitude: 43.0675, longitude: 141.3533, location_name: "Sapporo Station", notes: null },
    { start_time: "20:30", end_time: null, activity: "Dinner together at Susukino", description: "Group dinner celebration", latitude: 43.0552, longitude: 141.3539, location_name: "Susukino", notes: "Genghis Khan (lamb BBQ) or soup curry" },
    { start_time: "22:00", end_time: null, activity: "Rest", description: "Return to hotel", latitude: 43.0675, longitude: 141.3533, location_name: "Hotel near Sapporo Station", notes: null },
  ],
  3: [
    { start_time: "08:00", end_time: null, activity: "Pick up rental cars", description: "Get vehicles for road trip", latitude: 43.0675, longitude: 141.3533, location_name: "Rental Car Office, Sapporo", notes: "International driving permit needed" },
    { start_time: "08:30", end_time: null, activity: "Depart Sapporo", description: "Drive south toward Lake Toya", latitude: 43.0675, longitude: 141.3533, location_name: "Sapporo", notes: "~2.5 hour drive via expressway" },
    { start_time: "11:00", end_time: null, activity: "Arrive Lake Toya", description: "Arrive at the caldera lake", latitude: 42.5789, longitude: 140.8166, location_name: "Lake Toya", notes: "Beautiful volcanic caldera lake" },
    { start_time: "11:30", end_time: null, activity: "Lakeside lunch", description: "Dine with lake views", latitude: 42.5772, longitude: 140.8191, location_name: "Lake Toya lakeside restaurant", notes: "Fresh seafood options" },
    { start_time: "13:00", end_time: null, activity: "Usuzan Ropeway", description: "Active volcano observation", latitude: 42.5437, longitude: 140.8432, location_name: "Mount Usu Ropeway", notes: "Views of Showa Shinzan and Lake Toya" },
    { start_time: "14:30", end_time: null, activity: "Showa Shinzan", description: "New volcanic mountain", latitude: 42.5428, longitude: 140.8571, location_name: "Showa Shinzan", notes: "Formed during 1943-45 eruption" },
    { start_time: "16:00", end_time: null, activity: "Check in lakeside hotel", description: "Onsen hotel with lake view", latitude: 42.5734, longitude: 140.8176, location_name: "Lake Toya Onsen Hotel", notes: "Hot spring baths available" },
    { start_time: "17:00", end_time: null, activity: "Optional lakeside walk / cruise", description: "Scenic lakeside stroll", latitude: 42.5789, longitude: 140.8166, location_name: "Lake Toya lakeside", notes: "Picturesque walking paths" },
    { start_time: "19:00", end_time: null, activity: "Dinner", description: "Hotel dinner or local restaurant", latitude: 42.5734, longitude: 140.8176, location_name: "Lake Toya area", notes: null },
    { start_time: "20:45", end_time: null, activity: "Lake Toya fireworks", description: "Nightly fireworks display", latitude: 42.5789, longitude: 140.8166, location_name: "Lake Toya", notes: "Fireworks every night April–October" },
  ],
  4: [
    { start_time: "08:30", end_time: null, activity: "Breakfast & checkout", description: "Morning onsen & departure", latitude: 42.5734, longitude: 140.8176, location_name: "Lake Toya Onsen Hotel", notes: null },
    { start_time: "09:30", end_time: null, activity: "Depart Lake Toya", description: "Drive north to Furano", latitude: 42.5789, longitude: 140.8166, location_name: "Lake Toya", notes: "~4 hour scenic drive" },
    { start_time: "13:30", end_time: null, activity: "Arrive Furano", description: "Beautiful countryside town", latitude: 43.3424, longitude: 142.3833, location_name: "Furano", notes: "Famous for lavender fields (out of season)" },
    { start_time: "14:00", end_time: null, activity: "Lunch", description: "Local Furano cuisine", latitude: 43.3449, longitude: 142.3861, location_name: "Furano town", notes: "Try Furano omu-curry" },
    { start_time: "15:00", end_time: null, activity: "Scenic drive toward Tokachidake Observatory", description: "Mountain scenery drive", latitude: 43.4177, longitude: 142.6512, location_name: "Tokachidake area", notes: "Stunning autumn foliage in October" },
    { start_time: "16:00", end_time: "17:30", activity: "Tokachidake mountain scenery & viewpoints", description: "Active volcano observatory", latitude: 43.4188, longitude: 142.6838, location_name: "Tokachidake Observatory", notes: "Dramatic volcanic landscapes" },
    { start_time: "18:00", end_time: null, activity: "Furano Wine House", description: "Local Hokkaido wine", latitude: 43.3281, longitude: 142.3719, location_name: "Furano Wine House", notes: "Views of Furano basin at sunset" },
    { start_time: "19:30", end_time: null, activity: "Dinner", description: "Furano local cuisine", latitude: 43.3449, longitude: 142.3861, location_name: "Furano town", notes: null },
    { start_time: "21:00", end_time: null, activity: "Stay in Furano", description: "Check in accommodation", latitude: 43.3424, longitude: 142.3833, location_name: "Furano accommodation", notes: null },
  ],
  5: [
    { start_time: "08:00", end_time: null, activity: "Depart for Biei", description: "Short drive to Biei", latitude: 43.3424, longitude: 142.3833, location_name: "Furano", notes: "~30 min drive" },
    { start_time: "08:30", end_time: "12:00", activity: "Patchwork Road + Panorama Road", description: "Ken & Mary Tree / Seven Stars Tree / rolling hill viewpoints", latitude: 43.5857, longitude: 142.4567, location_name: "Patchwork Road, Biei", notes: "Iconic Hokkaido landscape photography spots" },
    { start_time: "12:30", end_time: null, activity: "Lunch in Biei", description: "Local Biei cuisine", latitude: 43.5885, longitude: 142.4620, location_name: "Biei town", notes: "Biei curry udon is famous" },
    { start_time: "14:00", end_time: null, activity: "Shirogane Blue Pond", description: "Mystical blue-colored pond", latitude: 43.4737, longitude: 142.6185, location_name: "Shirogane Blue Pond", notes: "Stunning blue water from aluminum hydroxide" },
    { start_time: "15:30", end_time: null, activity: "Shirahige Falls", description: "White beard waterfall", latitude: 43.4761, longitude: 142.6178, location_name: "Shirahige Falls", notes: "Beautiful blue water cascading down cliffs" },
    { start_time: "17:30", end_time: null, activity: "Blue Pond illumination", description: "Evening light-up event", latitude: 43.4737, longitude: 142.6185, location_name: "Shirogane Blue Pond", notes: "Seasonal illumination, check dates" },
    { start_time: "19:00", end_time: null, activity: "Dinner", description: "Asahikawa ramen", latitude: 43.7706, longitude: 142.3649, location_name: "Asahikawa", notes: "Asahikawa is famous for shoyu ramen" },
    { start_time: "20:30", end_time: null, activity: "Stay in Asahikawa", description: "Check in accommodation", latitude: 43.7706, longitude: 142.3649, location_name: "Asahikawa hotel", notes: "Second-largest city in Hokkaido" },
  ],
  6: [
    { start_time: "08:30", end_time: null, activity: "Visit Asahiyama Zoo", description: "Famous interactive zoo", latitude: 43.7693, longitude: 142.4725, location_name: "Asahiyama Zoo", notes: "Penguin walk and polar bear viewing tunnel" },
    { start_time: "11:30", end_time: null, activity: "Lunch in Asahikawa", description: "Last meal before heading east", latitude: 43.7706, longitude: 142.3649, location_name: "Asahikawa", notes: null },
    { start_time: "13:00", end_time: null, activity: "Depart for Sounkyo", description: "Drive to Daisetsuzan area", latitude: 43.7706, longitude: 142.3649, location_name: "Asahikawa", notes: "~1.5 hour drive" },
    { start_time: "14:30", end_time: null, activity: "Arrive Sounkyo", description: "Daisetsuzan National Park gateway", latitude: 43.7213, longitude: 142.9497, location_name: "Sounkyo Onsen", notes: "Famous hot spring gorge town" },
    { start_time: "15:00", end_time: null, activity: "Gorge scenery walk / riverside exploration", description: "Explore Sounkyo gorge", latitude: 43.7223, longitude: 142.9527, location_name: "Sounkyo Gorge", notes: "Dramatic cliffs and waterfalls" },
    { start_time: "16:00", end_time: null, activity: "Early onsen & relaxation", description: "Hot spring baths", latitude: 43.7213, longitude: 142.9497, location_name: "Sounkyo Onsen hotel", notes: "Outdoor rotenburo with gorge views" },
    { start_time: "18:00", end_time: null, activity: "Dinner at onsen hotel", description: "Kaiseki dinner", latitude: 43.7213, longitude: 142.9497, location_name: "Sounkyo Onsen hotel", notes: "Multi-course Japanese dinner" },
    { start_time: "20:00", end_time: null, activity: "Relax in Sounkyo", description: "Evening relaxation", latitude: 43.7213, longitude: 142.9497, location_name: "Sounkyo Onsen", notes: null },
  ],
  7: [
    { start_time: "08:30", end_time: null, activity: "Sounkyo Kurodake Ropeway", description: "Scenic ropeway ascent", latitude: 43.7217, longitude: 142.9473, location_name: "Kurodake Ropeway", notes: "Rises to 1,300m elevation" },
    { start_time: "09:00", end_time: null, activity: "Kurodake chairlift", description: "Continue higher toward peak", latitude: 43.7098, longitude: 142.9320, location_name: "Kurodake Chairlift", notes: "Autumn colors in October are spectacular" },
    { start_time: "10:30", end_time: null, activity: "Scenic mountain viewpoints", description: "Daisetsuzan alpine views", latitude: 43.6984, longitude: 142.9202, location_name: "Kurodake Summit Area", notes: "First snow possible in October" },
    { start_time: "11:30", end_time: null, activity: "Ryusei Waterfall", description: "Shooting star falls", latitude: 43.7258, longitude: 142.9560, location_name: "Ryusei Waterfall", notes: "One of Japan's top 100 waterfalls" },
    { start_time: "12:00", end_time: null, activity: "Ginga Waterfall", description: "Galaxy falls", latitude: 43.7265, longitude: 142.9558, location_name: "Ginga Waterfall", notes: "Paired with Ryusei, together called 'husband & wife falls'" },
    { start_time: "13:00", end_time: null, activity: "Lunch in Sounkyo", description: "Final Sounkyo meal", latitude: 43.7213, longitude: 142.9497, location_name: "Sounkyo", notes: null },
    { start_time: "14:30", end_time: null, activity: "Depart for Sapporo", description: "Return drive to Sapporo", latitude: 43.7213, longitude: 142.9497, location_name: "Sounkyo", notes: "~3.5 hour drive back" },
    { start_time: "18:00", end_time: null, activity: "Arrive Sapporo", description: "Back in the city", latitude: 43.0675, longitude: 141.3533, location_name: "Sapporo Station", notes: null },
    { start_time: "18:30", end_time: null, activity: "Return rental cars", description: "Drop off vehicles", latitude: 43.0675, longitude: 141.3533, location_name: "Rental Car Office, Sapporo", notes: "Refuel before returning" },
    { start_time: "20:00", end_time: null, activity: "Dinner", description: "Celebration dinner in Sapporo", latitude: 43.0552, longitude: 141.3539, location_name: "Sapporo / Susukino", notes: null },
  ],
  8: [
    { start_time: "10:00", end_time: null, activity: "JR to Otaru", description: "Scenic coastal train ride", latitude: 43.1972, longitude: 140.9944, location_name: "Otaru Station", notes: "~30-40 min from Sapporo" },
    { start_time: "11:00", end_time: null, activity: "Otaru Canal", description: "Historic canal district", latitude: 43.1967, longitude: 141.0039, location_name: "Otaru Canal", notes: "Beautiful brick warehouses along canal" },
    { start_time: "12:30", end_time: null, activity: "Seafood lunch", description: "Fresh Hokkaido seafood", latitude: 43.1960, longitude: 141.0027, location_name: "Otaru sushi street", notes: "Otaru is famous for sushi" },
    { start_time: "14:00", end_time: null, activity: "Sakaimachi Street", description: "Historic merchant street", latitude: 43.1953, longitude: 140.9994, location_name: "Sakaimachi Street", notes: "Glassworks, music boxes, souvenirs" },
    { start_time: "16:00", end_time: null, activity: "Mount Tengu ropeway", description: "Panoramic Otaru views", latitude: 43.1657, longitude: 140.9711, location_name: "Mount Tengu Ropeway", notes: "Views of Otaru city and Ishikari Bay" },
    { start_time: "18:00", end_time: null, activity: "Return to Sapporo", description: "JR back to Sapporo", latitude: 43.0675, longitude: 141.3533, location_name: "Sapporo Station", notes: null },
    { start_time: "20:00", end_time: null, activity: "Dinner", description: "Dinner in Sapporo", latitude: 43.0552, longitude: 141.3539, location_name: "Sapporo / Susukino", notes: null },
  ],
  9: [
    { start_time: "09:00", end_time: null, activity: "Maruyama Park", description: "Peaceful forest park", latitude: 43.0497, longitude: 141.3109, location_name: "Maruyama Park", notes: "Beautiful autumn colors" },
    { start_time: "10:00", end_time: null, activity: "Hokkaido Shrine", description: "Major Shinto shrine", latitude: 43.0542, longitude: 141.3078, location_name: "Hokkaido Shrine", notes: "Guardian shrine of Hokkaido" },
    { start_time: "12:00", end_time: null, activity: "Lunch", description: "Near Maruyama area", latitude: 43.0507, longitude: 141.3161, location_name: "Maruyama area", notes: null },
    { start_time: "14:00", end_time: null, activity: "Shiroi Koibito Park", description: "Famous cookie factory", latitude: 43.0890, longitude: 141.2767, location_name: "Shiroi Koibito Park", notes: "Ishiya chocolate factory tour" },
    { start_time: "17:00", end_time: null, activity: "Shopping near Sapporo Station", description: "Last-minute souvenir shopping", latitude: 43.0681, longitude: 141.3508, location_name: "Sapporo Station area", notes: "Daimaru, Stellar Place, Esta" },
    { start_time: "19:00", end_time: null, activity: "Farewell dinner", description: "Final group dinner", latitude: 43.0552, longitude: 141.3539, location_name: "Susukino", notes: "Celebratory farewell meal" },
  ],
  10: [
    { start_time: "09:00", end_time: null, activity: "Relaxed morning / breakfast", description: "Final Hokkaido morning", latitude: 43.0675, longitude: 141.3533, location_name: "Hotel near Sapporo Station", notes: "Pack and prepare for departure" },
    { start_time: "10:30", end_time: null, activity: "Hotel checkout", description: "Check out and store luggage", latitude: 43.0675, longitude: 141.3533, location_name: "Hotel near Sapporo Station", notes: null },
    { start_time: "11:00", end_time: null, activity: "JR Airport Line to CTS", description: "Rapid train to airport", latitude: 42.7752, longitude: 141.6921, location_name: "New Chitose Airport (CTS)", notes: "~40 min ride" },
    { start_time: "12:00", end_time: null, activity: "Airport shopping / lunch", description: "Last shopping and meal", latitude: 42.7752, longitude: 141.6921, location_name: "New Chitose Airport", notes: "Great Hokkaido souvenir shops" },
    { start_time: "13:40", end_time: null, activity: "Departure from New Chitose Airport", description: "Flight home", latitude: 42.7752, longitude: 141.6921, location_name: "New Chitose Airport", notes: "Sayonara Hokkaido!" },
  ],
};

console.log("Clearing existing data...");
db.prepare("DELETE FROM itinerary_items").run();
db.prepare("DELETE FROM itinerary_days").run();

const insertDay = db.prepare(
  "INSERT INTO itinerary_days (id, title, date, sort_order) VALUES (?, ?, ?, ?)"
);

const insertItem = db.prepare(
  `INSERT INTO itinerary_items
   (id, day_id, start_time, end_time, activity, description, latitude, longitude, location_name, notes, sort_order)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
);

const seedAll = db.transaction(() => {
  for (const day of days) {
    const dayId = randomUUID();
    console.log(`Inserting ${day.title}...`);
    insertDay.run(dayId, day.title, day.date, day.sort_order);

    const items = itemsByDay[day.sort_order] || [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      insertItem.run(
        randomUUID(),
        dayId,
        item.start_time,
        item.end_time ?? null,
        item.activity,
        item.description ?? null,
        item.latitude,
        item.longitude,
        item.location_name,
        item.notes ?? null,
        i + 1
      );
    }
    console.log(`  ${items.length} items inserted`);
  }
});

seedAll();
console.log("Seed complete!");
