# Map Tile Fade-In Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate white tile flashing during map zoom by adding CSS fade-in animation and increasing Leaflet's keepBuffer.

**Architecture:** Add a CSS `@keyframes tileFadeIn` animation and apply it to the existing `.leaflet-tile` rule in globals.css. Increase `keepBuffer` on `<TileLayer>` in both ItineraryMap and AdminLocationMap to retain more tiles from previous zoom levels during transitions.

**Tech Stack:** CSS animations, Leaflet TileLayer props, React/Next.js

---

### Task 1: Add CSS fade-in animation

**Files:**
- Modify: `src/app/globals.css:142-150`

- [ ] **Step 1: Add the `@keyframes tileFadeIn` rule and `animation` property to the existing tile rule**

In `src/app/globals.css`, add the keyframe definition before the `.leaflet-container .leaflet-tile-pane img.leaflet-tile` rule (around line 141), and add the `animation` property inside that rule.

Add this new rule block before line 141:

```css
@keyframes tileFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

Then modify the existing `.leaflet-container .leaflet-tile-pane img.leaflet-tile` rule (lines 142-150) to include the animation property. The full rule should become:

```css
/* Eliminate tile seam lines + add fade-in */
.leaflet-container .leaflet-tile-pane img.leaflet-tile {
  display: block;
  image-rendering: auto;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  transform: scale(1.004);
  -webkit-transform: scale(1.004);
  will-change: transform;
  animation: tileFadeIn 0.25s ease-out;
}
```

- [ ] **Step 2: Verify the CSS changes compile**

Run: `npm run build` (or `npx next build`)
Expected: Build succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "feat: add tile fade-in animation to eliminate white flash on zoom"
```

---

### Task 2: Increase keepBuffer on ItineraryMap TileLayer

**Files:**
- Modify: `src/components/map/ItineraryMap.tsx:719`

- [ ] **Step 1: Add `keepBuffer={6}` prop to the TileLayer component**

In `src/components/map/ItineraryMap.tsx`, change line 719 from:

```tsx
        <TileLayer key={tileLayer.key} attribution={tileLayer.attribution} url={tileLayer.url} tileSize={256} />
```

to:

```tsx
        <TileLayer key={tileLayer.key} attribution={tileLayer.attribution} url={tileLayer.url} tileSize={256} keepBuffer={6} />
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit` or `npm run build`
Expected: No type errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/map/ItineraryMap.tsx
git commit -m "feat: increase keepBuffer on ItineraryMap TileLayer for smoother zoom"
```

---

### Task 3: Increase keepBuffer on AdminLocationMap TileLayer

**Files:**
- Modify: `src/components/admin/AdminLocationMap.tsx:157`

- [ ] **Step 1: Add `keepBuffer={6}` prop to the TileLayer component**

In `src/components/admin/AdminLocationMap.tsx`, change line 157 from:

```tsx
        <TileLayer url="https://a.tile.openstreetmap.org/{z}/{x}/{y}.png" tileSize={256} />
```

to:

```tsx
        <TileLayer url="https://a.tile.openstreetmap.org/{z}/{x}/{y}.png" tileSize={256} keepBuffer={6} />
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit` or `npm run build`
Expected: No type errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/AdminLocationMap.tsx
git commit -m "feat: increase keepBuffer on AdminLocationMap TileLayer for smoother zoom"
```