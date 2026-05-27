# Map Tile Fade-In Design

## Problem

When zooming in/out on the map (both ItineraryMap and AdminLocationMap), white tiles flash while new tiles load from OSM/CARTO CDN. This creates a jarring visual experience.

## Root Cause

- Tiles load directly from CDN with no visual transition
- Leaflet's default `keepBuffer` of 2 doesn't retain enough tiles from previous zoom levels
- No CSS animation on tile load means tiles pop in abruptly
- Background color matching exists but isn't enough to prevent the flash during zoom

## Solution: CSS Fade-In + Keep Buffer

### 1. CSS Fade-In Animation

Add a keyframe animation to `.leaflet-tile` that fades tiles from `opacity: 0` to `opacity: 1` over 0.25s. The existing background color matching (light: `#F0EFEC`, dark: `#2B2B2F`) ensures the "from" state blends with the container background instead of showing white.

```css
.leaflet-container .leaflet-tile-pane img.leaflet-tile {
  animation: tileFadeIn 0.25s ease-out;
}

@keyframes tileFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

### 2. Increase Keep Buffer

Set `keepBuffer={6}` on the `<TileLayer>` component in both map components. Leaflet's default is 2; increasing to 6 retains more tiles from the previous zoom level while new tiles load, reducing visible white gaps.

## Files Changed

| File | Change |
|---|---|
| `src/app/globals.css` | Add `@keyframes tileFadeIn` and `animation` property to existing `.leaflet-tile` rule |
| `src/components/map/ItineraryMap.tsx` | Add `keepBuffer={6}` to `<TileLayer>` |
| `src/components/admin/AdminLocationMap.tsx` | Add `keepBuffer={6}` to `<TileLayer>` |

## Edge Cases

- **Failed tiles**: Leaflet's broken tile placeholder still appears; the fade-in applies but won't flash white first
- **Theme switching**: Existing background color logic ensures fade "from" state matches current theme
- **Existing `transform: scale(1.004)`**: Animation targets `opacity`, transform targets `scale` — no conflict since they affect different CSS properties
- **Performance**: The animation uses GPU-accelerated `opacity`; `keepBuffer={6}` uses slightly more memory but negligible for this map size

## Testing

- Zoom in/out rapidly on both light and dark themes — no white flashes
- Pan across the map — smooth tile loading
- Verify tile seam fix (scale transform) still works
- Verify both ItineraryMap and AdminLocationMap behave the same