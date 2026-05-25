# travel-mapper

Interactive travel itinerary web app with a public timeline + map view, and an admin dashboard for managing content. Supports any trip — add days, activities, locations with photos and ratings from Google Places.

## Tech Stack

- **Frontend:** Next.js 16 + TypeScript + Tailwind CSS v4
- **Map:** React Leaflet (Leaflet) with OpenStreetMap tiles
- **Database:** SQLite via better-sqlite3 (local, zero setup)
- **State:** Zustand
- **Icons:** Lucide (core package for raw SVG data)
- **Toasts:** Sonner
- **Places:** Google Places API (photos, ratings, reviews, location search)
- **Container:** Docker with multi-stage build

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Get a Google Maps API key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable the **Places API** (Text Search, Place Details, Place Photos)
3. Create an API key and restrict it to your app

### 3. Configure environment

Create `data/.env.local`:

```env
ADMIN_PASSWORD=changeme
GOOGLE_MAPS_API_KEY=your_key_here
```

The app auto-creates this file with defaults on first run if it doesn't exist.

### 4. Seed the database (optional)

```bash
npx tsx scripts/seed.ts
```

This populates `data/itinerary.db` with sample data. You can skip this and build your itinerary from scratch in the admin panel.

### 5. Run locally

```bash
npm run dev -p 1337
```

Open [http://localhost:1337](http://localhost:1337).

## Admin Access

Navigate to `/admin` and sign in with the password set in `ADMIN_PASSWORD` (default: `changeme`).

From the admin dashboard you can:
- Add, edit, or delete itinerary days and items
- Edit coordinates with a live map picker
- Drag-and-drop reorder days and items
- Merge duplicate locations
- Update trip title and subtitle
- All changes save to SQLite in real time

## Docker

### Build

```bash
docker build -t travel-mapper .
```

### Run

```bash
docker run -d \
  --name travel-mapper \
  --restart unless-stopped \
  -p 1337:3000 \
  -e TZ=Asia/Singapore \
  -v /path/on/host:/app/data \
  travel-mapper
```

The `-v` volume mount provides persistent storage for the SQLite database and `.env.local` configuration. On first run with an empty volume, the app creates the database and default env file automatically.

## Project Structure

```
src/
├── app/
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Public itinerary page
│   ├── globals.css               # Global styles + Leaflet overrides
│   ├── admin/
│   │   ├── page.tsx              # Admin dashboard (CRUD, reorder, location merge)
│   │   └── login/page.tsx        # Admin login
│   └── api/
│       ├── itinerary/            # Public itinerary API (GET)
│       ├── settings/             # Trip metadata
│       ├── place-details/        # Google Places details (photos, rating, reviews)
│       ├── place-photo/[ref]/    # Google Place photo proxy
│       ├── map-tiles/[style]/... # Map tile proxy
│       └── admin/
│           ├── days/             # Days CRUD + reorder
│           ├── items/            # Items CRUD + reorder
│           ├── locations/        # Location management + merge
│           ├── location-search/  # Google Places text search
│           ├── login/            # Admin authentication
│           └── settings/         # Admin settings API
├── components/
│   ├── itinerary/                # DayFilter, DayTimeline, ItineraryCard, ItineraryApp, HeroSection
│   ├── map/                      # ItineraryMap (Leaflet with activity-icon markers)
│   ├── admin/                    # AdminLocationMap
│   └── ui/                       # Reusable UI components (button)
├── lib/
│   ├── db.ts                    # SQLite database init + schema
│   ├── env.ts                   # Env loader from data/.env.local
│   ├── auth.ts                  # Admin auth utilities
│   ├── types.ts                 # TypeScript types
│   ├── utils.ts                 # Helpers (day colors, activity icons, time format)
│   └── constants.ts             # Trip title, map defaults
├── store/
│   └── itinerary.ts             # Zustand store (days, selection, theme, filters)
├── scripts/
│   └── seed.ts                  # Seed script with sample Hokkaido data
data/
├── itinerary.db                 # SQLite database (auto-created, gitignored)
└── .env.local                   # Environment config (auto-created, gitignored)
```

## Customization

- **Trip title & subtitle** — edit from the admin settings page, or change defaults in `src/lib/constants.ts`
- **Map center & zoom** — change `MAP_DEFAULT_CENTER` and `MAP_DEFAULT_ZOOM` in `src/lib/constants.ts`
- **Sample data** — modify `scripts/seed.ts` to seed your own itinerary
- **Activity icons** — add or change SVG paths in `src/components/map/ItineraryMap.tsx` (`getActivitySvg` function)
