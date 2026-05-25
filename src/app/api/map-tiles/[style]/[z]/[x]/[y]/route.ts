const TILE_PROVIDERS = {
  light: "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
  dark:
    "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
  osm:
    "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
} as const;

type TileStyle = keyof typeof TILE_PROVIDERS;

function parseTileParam(value: string) {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
}

export async function GET(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{ style: string; z: string; x: string; y: string }>;
  }
) {
  const { style, z, x, y } = await params;
  const tileStyle = style as TileStyle;
  const zoom = parseTileParam(z);
  const tileX = parseTileParam(x);
  const tileY = parseTileParam(y);

  if (
    !TILE_PROVIDERS[tileStyle] ||
    zoom === null ||
    tileX === null ||
    tileY === null ||
    zoom < 0 ||
    zoom > 19 ||
    tileX < 0 ||
    tileY < 0 ||
    tileX >= 2 ** zoom ||
    tileY >= 2 ** zoom
  ) {
    return new Response("Invalid tile", { status: 400 });
  }

  const upstreamUrl = TILE_PROVIDERS[tileStyle]
    .replace("{z}", String(zoom))
    .replace("{x}", String(tileX))
    .replace("{y}", String(tileY));

  const upstream = await fetch(upstreamUrl, {
    headers: {
      "User-Agent": "Hokkaido Itinerary Map/1.0",
    },
    next: { revalidate: 60 * 60 * 24 * 7 },
  });

  if (!upstream.ok || !upstream.body) {
    return new Response("Tile unavailable", { status: 502 });
  }

  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      "Content-Type": upstream.headers.get("content-type") || "image/png",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}
