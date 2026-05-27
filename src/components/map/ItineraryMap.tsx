"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  CircleMarker,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { useItineraryStore } from "@/store/itinerary";
import { getDayColor, getActivityIcon, getCategoryAccent } from "@/lib/utils";
import { Moon, Sun, Maximize2, LocateFixed } from "lucide-react";
import { toast } from "sonner";
import type { ItineraryItem } from "@/lib/types";

function isValidLatLng(v: unknown): v is number {
  return typeof v === "number" && isFinite(v);
}

function hasLocation(item: ItineraryItem): boolean {
  return !!item.location_id && isValidLatLng(item.latitude) && isValidLatLng(item.longitude);
}

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "/leaflet/marker-icon-2x.png",
  iconUrl: "/leaflet/marker-icon.png",
  shadowUrl: "/leaflet/marker-shadow.png",
});

function getActivitySvg(category: string): string {
  const icons: Record<string, string> = {
    plane: `<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>`,
    train: `<rect width="16" height="16" x="4" y="3" rx="2"/><path d="M4 11h16"/><path d="M12 3v8"/><path d="m8 19-2 3"/><path d="m18 22-2-3"/><path d="M8 15h.01"/><path d="M16 15h.01"/>`,
    hotel: `<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M10 22v-6.57"/><path d="M14 15.43V22"/><path d="M15 16a5 5 0 0 0-6 0"/><path d="M12 11h.01"/><path d="M12 7h.01"/><path d="M16 11h.01"/><path d="M16 7h.01"/><path d="M8 11h.01"/><path d="M8 7h.01"/>`,
    food: `<path d="m16 2-2.3 2.3a3 3 0 0 0 0 4.2l1.8 1.8a3 3 0 0 0 4.2 0L22 8"/><path d="M15 15 3.3 3.3a4.2 4.2 0 0 0 0 6l7.3 7.3c.7.7 2 .7 2.8 0L15 15Zm0 0 7 7"/><path d="m2.1 21.8 6.4-6.3"/><path d="m19 5-7 7"/>`,
    hiking: `<path d="m8 3 4 8 5-5 5 15H2L8 3z"/>`,
    car: `<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>`,
    shopping: `<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>`,
    museum: `<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/>`,
    park: `<path d="m17 14 3 3.3a1 1 0 0 1-.7 1.7H4.7a1 1 0 0 1-.7-1.7L7 14h-.3a1 1 0 0 1-.7-1.7L9 9h-.2A1 1 0 0 1 8 7.3L12 3l4 4.3a1 1 0 0 1-.8 1.7H15l3 3.3a1 1 0 0 1-.7 1.7H17Z"/><path d="M12 22v-3"/>`,
    water: `<path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>`,
    cafe: `<path d="M10 2v2"/><path d="M14 2v2"/><path d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1"/><path d="M6 2v2"/>`,
    onsen: `<path d="M20 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/><path d="M12 9a4 4 0 0 0-2 7.5"/><path d="M12 3v2"/><path d="m6.6 18.4-1.4 1.4"/><path d="M4 13H2"/><path d="M6.34 7.34 4.93 5.93"/>`,
    default: `<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>`,
  };
  return icons[category] || icons.default;
}

function createIconMarker(color: string, accent: string, isSelected: boolean, sequenceBadges: number[] | undefined, svgPath: string) {
  const outer = isSelected ? 44 : 36;
  const inner = isSelected ? 30 : 24;
  const iconSize = 16;
  const ringWidth = 3;
  const shadow = isSelected
    ? `0 0 0 4px ${accent}22, 0 2px 8px rgba(0,0,0,0.15)`
    : `0 2px 6px rgba(0,0,0,0.12)`;
  const animation = isSelected ? "animation:bounce 0.4s cubic-bezier(0.34,1.56,0.64,1);" : "";

  const badges = sequenceBadges?.length
    ? sequenceBadges.map((seq, i) =>
        `<span style="position:absolute;top:${i * 16}px;right:-2px;background:var(--color-accent, #2563EB);color:white;border-radius:50%;width:18px;height:18px;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;box-shadow:0 1px 4px rgba(0,0,0,0.2);z-index:${sequenceBadges.length - i};">${seq}</span>`
      ).join("")
    : "";

  return L.divIcon({
    html: `<div style="
      position:relative;
      width:${outer}px;height:${outer}px;
      display:flex;align-items:center;justify-content:center;
      ${animation}
    ">
      <div style="
        width:${inner}px;height:${inner}px;
        border-radius:50%;
        background:${color};
        border:${ringWidth}px solid white;
        box-shadow:${shadow};
        display:flex;align-items:center;justify-content:center;
        transition:transform 0.2s;
      ">
        <svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${svgPath}</svg>
      </div>
      ${badges}
    </div>`,
    className: "",
    iconSize: [outer, outer],
    iconAnchor: [outer / 2, outer / 2],
  });
}

let lastMarkerTap = 0;

function findNearestItem(
  latlng: L.LatLng, map: L.Map, items: ItineraryItem[],
): ItineraryItem | null {
  let best: ItineraryItem | null = null;
  let bestDist = Infinity;
  const tapPoint = map.latLngToContainerPoint(latlng);
  for (const item of items) {
    if (!isValidLatLng(item.latitude) || !isValidLatLng(item.longitude)) continue;
    const markerPoint = map.latLngToContainerPoint([item.latitude, item.longitude]);
    const d = tapPoint.distanceTo(markerPoint);
    if (d < bestDist) { bestDist = d; best = item; }
  }
  return bestDist <= 44 ? best : null;
}

function MapController({
  selectedItemId, allItems, fitBoundsFlag, onMapClick, onMarkerTap, userLocation, userLocationFocusRequest,
}: {
  selectedItemId: string | null;
  allItems: ItineraryItem[];
  fitBoundsFlag: number;
  onMapClick: () => void;
  onMarkerTap: (item: ItineraryItem) => void;
  userLocation: { latitude: number; longitude: number } | null;
  userLocationFocusRequest: number;
}) {
  const map = useMap();
  const prevSelected = useRef<string | null>(null);
  const hasFitInitial = useRef(false);

  useEffect(() => {
    const container = map.getContainer();
    let disposed = false;
    const refreshMapSize = () => {
      requestAnimationFrame(() => {
        if (disposed || !container.isConnected || !map.getPane("mapPane")) return;
        try { map.invalidateSize({ pan: false }); } catch {}
      });
    };
    const observer = new ResizeObserver(() => refreshMapSize());
    observer.observe(container);
    refreshMapSize();
    const settleTimer = window.setTimeout(refreshMapSize, 300);
    window.addEventListener("orientationchange", refreshMapSize);
    window.addEventListener("resize", refreshMapSize);
    return () => {
      disposed = true;
      observer.disconnect();
      window.clearTimeout(settleTimer);
      window.removeEventListener("orientationchange", refreshMapSize);
      window.removeEventListener("resize", refreshMapSize);
    };
  }, [map]);

  useEffect(() => {
    const handler = (e: any) => {
      try {
        if (Date.now() - lastMarkerTap < 400) return;
        if (!e.latlng || !isFinite(e.latlng.lat) || !isFinite(e.latlng.lng)) return;
        const oe = e.originalEvent;
        const target = (oe?.target as HTMLElement | undefined) ?? (oe?.changedTouches?.[0]?.target as HTMLElement | undefined);
        if (target?.closest(".leaflet-popup")) return;
        const nearest = findNearestItem(e.latlng, map, allItems);
        if (nearest) { lastMarkerTap = Date.now(); onMarkerTap(nearest); return; }
        onMapClick();
      } catch (err) {
        console.error("[Map] click handler error:", err);
      }
    };
    map.on("click", handler);
    return () => { map.off("click", handler); };
  }, [map, onMapClick, allItems, onMarkerTap]);

  useEffect(() => {
    const container = map.getContainer();
    let startPoint: L.Point | null = null;
    const getTouchPoint = (event: TouchEvent | PointerEvent) => {
      const touch = "changedTouches" in event ? event.changedTouches[0] : event;
      if (!touch) return null;
      const rect = container.getBoundingClientRect();
      return L.point(touch.clientX - rect.left, touch.clientY - rect.top);
    };
    const handleTouchStart = (event: TouchEvent | PointerEvent) => { startPoint = getTouchPoint(event); };
    const handleTouchEnd = (event: TouchEvent | PointerEvent) => {
      if (Date.now() - lastMarkerTap < 400) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest(".leaflet-popup, button, a")) return;
      const endPoint = getTouchPoint(event);
      if (!startPoint || !endPoint || startPoint.distanceTo(endPoint) > 12) { startPoint = null; return; }
      startPoint = null;
      const nearest = findNearestItem(map.containerPointToLatLng(endPoint), map, allItems);
      if (!nearest) return;
      event.preventDefault();
      event.stopPropagation();
      lastMarkerTap = Date.now();
      onMarkerTap(nearest);
    };
    container.addEventListener("touchstart", handleTouchStart, { capture: true, passive: true });
    container.addEventListener("touchend", handleTouchEnd, { capture: true, passive: false });
    container.addEventListener("pointerdown", handleTouchStart, true);
    container.addEventListener("pointerup", handleTouchEnd, true);
    return () => {
      container.removeEventListener("touchstart", handleTouchStart, true);
      container.removeEventListener("touchend", handleTouchEnd, true);
      container.removeEventListener("pointerdown", handleTouchStart, true);
      container.removeEventListener("pointerup", handleTouchEnd, true);
    };
  }, [allItems, map, onMarkerTap]);

  useEffect(() => {
    map.on("dragstart", onMapClick);
    return () => { map.off("dragstart", onMapClick); };
  }, [map, onMapClick]);

  const validItems = useMemo(() => allItems.filter((i) => hasLocation(i)), [allItems]);

  useEffect(() => {
    if (hasFitInitial.current || validItems.length === 0) return;
    hasFitInitial.current = true;
    try {
      const bounds = L.latLngBounds(validItems.map((i) => [i.latitude, i.longitude] as [number, number]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 9 });
    } catch (err) {
      console.error("[Map] initial fitBounds error:", err);
    }
  }, [validItems, map]);

  useEffect(() => {
    if (fitBoundsFlag === 0 || allItems.length === 0) return;
    try {
      const bounds = L.latLngBounds(allItems
        .filter((i) => isValidLatLng(i.latitude) && isValidLatLng(i.longitude))
        .map((i) => [i.latitude, i.longitude] as [number, number]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    } catch (err) {
      console.error("[Map] fitBounds error:", err);
    }
  }, [fitBoundsFlag, allItems, map]);

  useEffect(() => {
    if (!selectedItemId || selectedItemId === prevSelected.current) {
      prevSelected.current = selectedItemId;
      return;
    }
    prevSelected.current = selectedItemId;
    const item = allItems.find((i) => i.id === selectedItemId);
    if (!item) return;
    if (!hasLocation(item)) return;
    const target = L.latLng(item.latitude, item.longitude);
    const center = map.getCenter();
    const pixelDist = map.latLngToContainerPoint(center).distanceTo(
      map.latLngToContainerPoint(target)
    );
    // On mobile, delay to let Vaul drawer close animation finish before centering
    const delay = window.innerWidth < 1024 ? 300 : 0;
    const timer = setTimeout(() => {
      try {
        map.invalidateSize({ pan: false });
        if (pixelDist < 10) {
          // Already very close — skip animation to avoid vibration
          map.setView(target, 16, { animate: false });
        } else {
          map.flyTo(target, 16, { duration: 1 });
        }
      } catch {}
    }, delay);
    return () => { clearTimeout(timer); };
  }, [selectedItemId, allItems, map]);

  useEffect(() => {
    if (userLocationFocusRequest === 0 || !userLocation) return;
    if (!isValidLatLng(userLocation.latitude) || !isValidLatLng(userLocation.longitude)) return;
    map.setView([userLocation.latitude, userLocation.longitude], 15);
  }, [map, userLocation, userLocationFocusRequest]);

  return null;
}

interface PlaceDetails {
  name: string;
  address: string;
  rating: number | null;
  totalRatings: number | null;
  photos: string[];
  url: string | null;
  website: string | null;
}

function PlacePopupContent({ popupItem, displayDayIndex, item, group, allItems, onNextStop, onPrevStop }: {
  popupItem: ItineraryItem;
  displayDayIndex: number;
  item: ItineraryItem;
  group: { items: ItineraryItem[] };
  allItems: ItineraryItem[];
  onNextStop: (item: ItineraryItem) => void;
  onPrevStop: (item: ItineraryItem) => void;
}) {
  const [place, setPlace] = useState<PlaceDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);
  const fetchedRef = useRef<string | null>(null);

  useEffect(() => {
    const query = popupItem.location_name;
    if (!query || fetchedRef.current === query) return;
    fetchedRef.current = query;
    setLoading(true);
    const params = new URLSearchParams({ q: query, itemId: popupItem.id });
    if (popupItem.latitude && popupItem.longitude) {
      params.set("lat", String(popupItem.latitude));
      params.set("lng", String(popupItem.longitude));
    }
    fetch(`/api/place-details?${params}`)
      .then((r) => r.json())
      .then((data) => { if (data.place) setPlace(data.place); })
      .finally(() => setLoading(false));
  }, [popupItem.location_name, popupItem.id]);

  const iconType = getActivityIcon(popupItem.activity, popupItem.location_name);
  const accent = getCategoryAccent(iconType);

  return (
    <div style={{ fontFamily: "inherit", width: 300, fontSize: 13, lineHeight: 1.4 }}>
      {/* Photo with gradient overlay */}
      {place?.photos?.length ? (
        <div style={{ position: "relative", height: 140, overflow: "hidden", background: "var(--color-card)" }}>
          <img
            src={`/api/place-photo/${place.photos[photoIndex]}`}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0, height: "50%",
            background: "linear-gradient(transparent, rgba(0,0,0,0.5))",
          }} />
          {/* Dot navigation */}
          {place.photos.length > 1 && (
            <div style={{ position: "absolute", bottom: 8, right: 8, display: "flex", gap: 5 }}>
              {place.photos.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); setPhotoIndex(i); }}
                  style={{
                    width: 10, height: 10, borderRadius: "50%", border: "none",
                    background: i === photoIndex ? "white" : "rgba(255,255,255,0.4)",
                    cursor: "pointer", padding: 0, transition: "background 0.15s",
                  }}
                />
              ))}
            </div>
          )}
          {/* Prev/next arrows */}
          {place.photos.length > 1 && (
            <>
              {photoIndex > 0 && (
                <button
                  onClick={(e) => { e.stopPropagation(); setPhotoIndex(photoIndex - 1); }}
                  style={{
                    position: "absolute", left: 4, top: "50%", transform: "translateY(-50%)",
                    width: 24, height: 24, borderRadius: "50%", border: "none",
                    background: "rgba(255,255,255,0.7)", cursor: "pointer", padding: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 14, lineHeight: 1, color: "#333",
                  }}
                >‹</button>
              )}
              {photoIndex < place.photos.length - 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); setPhotoIndex(photoIndex + 1); }}
                  style={{
                    position: "absolute", right: 4, top: "50%", transform: "translateY(-50%)",
                    width: 24, height: 24, borderRadius: "50%", border: "none",
                    background: "rgba(255,255,255,0.7)", cursor: "pointer", padding: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 14, lineHeight: 1, color: "#333",
                  }}
                >›</button>
              )}
            </>
          )}
        </div>
      ) : (
        <div style={{ height: 80, background: "var(--color-card)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "var(--color-muted)" }}>
          {loading ? "Loading…" : "No photo available"}
        </div>
      )}

      {/* Content */}
      <div style={{ padding: "10px 14px 12px" }}>
        {/* Rating */}
        {place?.rating ? (
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 6 }}>
            <span style={{ color: "#EAB308", fontSize: 13, letterSpacing: 1 }}>
              {"★".repeat(Math.round(place.rating))}{"☆".repeat(5 - Math.round(place.rating))}
            </span>
            <span style={{ fontSize: 11, color: "var(--color-muted)" }}>
              {place.rating.toFixed(1)}
              {place.totalRatings ? ` (${place.totalRatings})` : ""}
            </span>
          </div>
        ) : null}

        {/* Day label */}
        <span style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: getDayColor(displayDayIndex), marginBottom: 2, display: "block" }}>
          Day {displayDayIndex + 1}
        </span>

        {/* Activity title */}
        <p style={{ fontWeight: 600, margin: "0 0 2px", fontSize: 14, color: "var(--color-text)" }}>
          {popupItem.activity}
        </p>

        {/* Location */}
        <p style={{ color: "var(--color-muted)", margin: "0 0 4px", fontSize: 12 }}>
          {popupItem.location_name}
        </p>

        {/* Address */}
        {place?.address && place.address !== popupItem.location_name && (
          <p style={{ fontSize: 11, color: "var(--color-muted)", margin: "0 0 8px", opacity: 0.7 }}>
            {place.address}
          </p>
        )}

        {/* Links */}
        <div style={{ display: "flex", gap: 12, marginTop: 6 }}>
          <a
            href={place?.url || `https://www.google.com/maps?q=${item.latitude},${item.longitude}`}
            target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 11, fontWeight: 500, color: "var(--color-accent)", textDecoration: "none" }}
          >
            Google Maps
          </a>
          {place?.website && (
            <a
              href={place.website} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 11, fontWeight: 500, color: "var(--color-accent)", textDecoration: "none" }}
            >
              Website
            </a>
          )}
        </div>

        {group.items.length > 1 && (
          <p style={{ fontSize: 11, color: "var(--color-accent)", margin: "6px 0 0", fontWeight: 500 }}>
            +{group.items.length - 1} more stops
          </p>
        )}

        {/* Prev / Next stop */}
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <button
            onClick={(e) => { e.stopPropagation(); onPrevStop(popupItem); }}
            style={{
              flex: 1, padding: "6px 0", borderRadius: 8, border: "1px solid var(--color-border)",
              background: "transparent", color: "var(--color-text)", fontSize: 12, fontWeight: 500, cursor: "pointer",
            }}
          >
            ← Previous Stop
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onNextStop(popupItem); }}
            style={{
              flex: 1, padding: "6px 0", borderRadius: 8, border: "1px solid var(--color-border)",
              background: "transparent", color: "var(--color-text)", fontSize: 12, fontWeight: 500, cursor: "pointer",
            }}
          >
            Next Stop →
          </button>
        </div>
      </div>
    </div>
  );
}

function ItineraryMarker({
  group, selectedItemId, hoveredItemId, onPopupChange, onSelectItem, onHoverItem, allItems, onNextStop, onPrevStop,
}: {
  group: { items: ItineraryItem[]; dayIndex: number };
  selectedItemId: string | null;
  hoveredItemId: string | null;
  onPopupChange: (key: string | null) => void;
  onSelectItem: (id: string) => void;
  onHoverItem: (id: string | null) => void;
  allItems: ItineraryItem[];
  onNextStop: (item: ItineraryItem) => void;
  onPrevStop: (item: ItineraryItem) => void;
}) {
  const markerRef = useRef<L.Marker | null>(null);
  const map = useMap();
  const item = group.items[0];
  const locKey = `${item.latitude}-${item.longitude}`;
  const isSelected = group.items.some((i) => i.id === selectedItemId);
  const isHovered = group.items.some((i) => i.id === hoveredItemId);
  const popupItem = group.items.find((groupItem) => groupItem.id === selectedItemId) || item;
  const days = useItineraryStore((s) => s.days);
  const activeDayFilter = useItineraryStore((s) => s.activeDayFilter);
  const popupDayIndex = days.findIndex((d) => d.id === popupItem.day_id);
  const displayDayIndex = popupDayIndex >= 0 ? popupDayIndex : group.dayIndex;
  const color = getDayColor(displayDayIndex);
  const iconType = getActivityIcon(item.activity, item.location_name);
  const accent = getCategoryAccent(iconType);
  const svgPath = getActivitySvg(iconType);
  const sequenceBadges = activeDayFilter !== null
    ? group.items.map((gi) => {
        const locItems = allItems.filter((i) => hasLocation(i));
        return locItems.findIndex((ai) => ai.id === gi.id) + 1;
      }).filter((n) => n > 0)
    : undefined;
  const icon = createIconMarker(color, accent, isSelected || isHovered, sequenceBadges, svgPath);

  const openMarkerPopup = useCallback((event?: any) => {
    if (event) {
      L.DomEvent.stop(event);
      event.originalEvent?.preventDefault?.();
    }
    lastMarkerTap = Date.now();
    onPopupChange(locKey);
    onSelectItem(popupItem.id);
    const el = document.getElementById(`item-${popupItem.id}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [locKey, onPopupChange, onSelectItem, popupItem.id]);

  useEffect(() => {
    const marker = markerRef.current;
    if (!marker) return;
    marker.on("touchend" as keyof L.LeafletEventHandlerFnMap, openMarkerPopup);
    return () => { marker.off("touchend" as keyof L.LeafletEventHandlerFnMap, openMarkerPopup); };
  }, [openMarkerPopup]);

  // Open/close popup based on selectedItemId
  // On mobile, delay popup open until flyTo completes to avoid resize jitter
  useEffect(() => {
    if (isSelected) {
      const isMobile = window.innerWidth < 1024;
      if (isMobile) {
        if ((map as any).isMoving?.()) {
          const open = () => { markerRef.current?.openPopup(); };
          map.once("moveend", open);
          return () => { map.off("moveend", open); };
        }
        setTimeout(() => markerRef.current?.openPopup(), 300);
      } else {
        markerRef.current?.openPopup();
      }
    } else {
      markerRef.current?.closePopup();
    }
  }, [isSelected, map]);

  return (
    <Marker
      ref={markerRef}
      position={[item.latitude, item.longitude]}
      icon={icon}
      bubblingMouseEvents={false}
      eventHandlers={{
        click: openMarkerPopup,
        mouseover: () => onHoverItem(popupItem.id),
        mouseout: () => onHoverItem(null),
      }}
    >
      <Popup autoPan={false} maxWidth={300} minWidth={300} className="fixed-width-popup">
        <PlacePopupContent
          popupItem={popupItem}
          displayDayIndex={displayDayIndex}
          item={item}
          group={group}
          allItems={allItems}
          onNextStop={onNextStop}
          onPrevStop={onPrevStop}
        />
      </Popup>
    </Marker>
  );
}

export function ItineraryMap() {
  const { days, selectedItemId, hoveredItemId, selectItem, hoverItem, theme, toggleTheme, activeDayFilter, setDayFilter } = useItineraryStore();
  const [fitBoundsFlag, setFitBoundsFlag] = useState(0);
  const [poppedKey, setPoppedKey] = useState<string | null>(null);
  const [userLocationFocusRequest, setUserLocationFocusRequest] = useState(0);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const filteredDays = useMemo(
    () => activeDayFilter !== null ? days.filter((_, i) => i === activeDayFilter) : days,
    [days, activeDayFilter],
  );

  const allItems = useMemo(() => filteredDays.flatMap((d) => d.items), [filteredDays]);

  const closePopups = useCallback(() => { setPoppedKey(null); selectItem(null); }, [selectItem]);

  const handleMarkerTap = useCallback((item: ItineraryItem) => {
    setPoppedKey(`${item.latitude}-${item.longitude}`);
    selectItem(item.id);
    const el = document.getElementById(`item-${item.id}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [selectItem]);

  const navigateTo = useCallback((item: ItineraryItem) => {
    setPoppedKey(`${item.latitude}-${item.longitude}`);
    selectItem(item.id);
    const el = document.getElementById(`item-${item.id}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [selectItem]);

  const handleNextStop = useCallback((item: ItineraryItem) => {
    const startIdx = allItems.findIndex((i) => i.id === item.id);
    // Scan forward within allItems for the next item with a location
    for (let i = startIdx + 1; i < allItems.length; i++) {
      if (hasLocation(allItems[i])) { navigateTo(allItems[i]); return; }
    }
    // Cross-day when filtered
    if (activeDayFilter !== null) {
      for (let d = activeDayFilter + 1; d < days.length; d++) {
        const locItem = days[d]?.items?.find((i) => hasLocation(i));
        if (locItem) { setDayFilter(d); navigateTo(locItem); return; }
      }
    }
  }, [allItems, activeDayFilter, days, setDayFilter, navigateTo]);

  const handlePrevStop = useCallback((item: ItineraryItem) => {
    const startIdx = allItems.findIndex((i) => i.id === item.id);
    // Scan backward within allItems for the previous item with a location
    for (let i = startIdx - 1; i >= 0; i--) {
      if (hasLocation(allItems[i])) { navigateTo(allItems[i]); return; }
    }
    // Cross-day when filtered
    if (activeDayFilter !== null) {
      for (let d = activeDayFilter - 1; d >= 0; d--) {
        const dayItems = days[d]?.items ?? [];
        for (let j = dayItems.length - 1; j >= 0; j--) {
          if (hasLocation(dayItems[j])) { setDayFilter(d); navigateTo(dayItems[j]); return; }
        }
      }
    }
  }, [allItems, activeDayFilter, days, setDayFilter, navigateTo]);

  const locateUser = useCallback(() => {
    if (!("geolocation" in navigator)) { toast.error("Location is not available in this browser."); return; }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude });
        setUserLocationFocusRequest((v) => v + 1);
        setIsLocating(false);
      },
      (error) => {
        setIsLocating(false);
        if (!window.isSecureContext) { toast.error("Current location needs localhost on desktop or HTTPS on mobile/LAN."); return; }
        toast.error(error.message || "Could not get your current location.");
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 },
    );
  }, []);

  const locationGroups = useMemo(() => {
    const groups = new Map<string, { items: ItineraryItem[]; dayIndex: number }>();
    allItems.forEach((item) => {
      if (!hasLocation(item)) return;
      const key = `${item.latitude.toFixed(3)},${item.longitude.toFixed(3)}`;
      if (!groups.has(key)) groups.set(key, { items: [], dayIndex: days.findIndex((d) => d.id === item.day_id) });
      groups.get(key)!.items.push(item);
    });
    return Array.from(groups.values());
  }, [allItems, days]);

  const routes = useMemo(() => {
    return filteredDays.filter((d) => d.items.length >= 2).map((day) => {
      const origIndex = days.findIndex((dd) => dd.id === day.id);
      return {
        dayIndex: origIndex,
        positions: day.items
          .filter((i) => hasLocation(i))
          .map((item) => [item.latitude, item.longitude] as [number, number]),
        color: getDayColor(origIndex >= 0 ? origIndex : 0),
      };
    });
  }, [filteredDays, days]);

  const tileLayer = useMemo(() => {
    if (theme === "dark") {
      return { key: "dark", url: "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png", attribution: '&copy; <a href="https://openstreetmap.org/">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>' };
    }
    return { key: "light", url: "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png", attribution: '&copy; <a href="https://openstreetmap.org/">OpenStreetMap</a>' };
  }, [theme]);

  useEffect(() => {
    if (!selectedItemId) { setPoppedKey(null); return; }
    const selectedItem = allItems.find((item) => item.id === selectedItemId);
    if (selectedItem && hasLocation(selectedItem)) {
      setPoppedKey(`${selectedItem.latitude}-${selectedItem.longitude}`);
    }
  }, [allItems, selectedItemId]);

  // Match .leaflet-container + tile pane background to tile colors (hides seam lines)
  useEffect(() => {
    const bg = theme === "dark" ? "#2B2B2F" : "#F0EFEC";
    const style = document.createElement("style");
    style.id = "leaflet-bg-style";
    style.textContent = `
      .leaflet-container { background: ${bg} !important; }
      .leaflet-tile-pane { background: ${bg}; }
    `;
    document.head.appendChild(style);
    return () => { const el = document.getElementById("leaflet-bg-style"); if (el) el.remove(); };
  }, [theme]);

  return (
    <div className="absolute inset-0">
      <MapContainer
        center={[43.2, 142.5]}
        zoom={7}
        style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
        zoomSnap={1}
        zoomDelta={1}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer key={tileLayer.key} attribution={tileLayer.attribution} url={tileLayer.url} tileSize={256} keepBuffer={6} />

        <MapController
          selectedItemId={selectedItemId}
          allItems={allItems}
          fitBoundsFlag={fitBoundsFlag}
          onMapClick={closePopups}
          onMarkerTap={handleMarkerTap}
          userLocation={userLocation}
          userLocationFocusRequest={userLocationFocusRequest}
        />

        {routes.map((route) => (
          <Polyline
            key={`route-${route.dayIndex}`}
            positions={route.positions}
            pathOptions={{ color: route.color, weight: 2, opacity: 0.35, dashArray: "4 4" }}
          />
        ))}

        {locationGroups.map((group) => {
          const item = group.items[0];
          const locKey = `${item.latitude}-${item.longitude}`;
          return (
            <ItineraryMarker
              key={locKey}
              group={group}
              selectedItemId={selectedItemId}
              hoveredItemId={hoveredItemId}
              onPopupChange={setPoppedKey}
              onSelectItem={selectItem}
              onHoverItem={hoverItem}
              allItems={allItems}
              onNextStop={handleNextStop}
              onPrevStop={handlePrevStop}
            />
          );
        })}

        {userLocation && (
          <CircleMarker
            center={[userLocation.latitude, userLocation.longitude]}
            radius={8}
            pathOptions={{ color: "#ffffff", weight: 3, fillColor: "var(--color-accent)", fillOpacity: 1 }}
          >
            <Popup autoPan={false}>You are here</Popup>
          </CircleMarker>
        )}
      </MapContainer>

      {/* Map controls — separated groups */}
      <div className="absolute right-4 top-4 z-[800] flex flex-col gap-1.5">
        {/* Primary: locate + fit */}
        <div
          className="flex flex-col gap-1 rounded-xl p-1.5 shadow-sm"
          style={{ background: "var(--color-card)", border: "1px solid var(--color-border)" }}
        >
          <button
            onClick={locateUser}
            className="w-9 h-9 rounded-lg flex items-center justify-center hover:opacity-70 transition-opacity disabled:opacity-40"
            style={{ background: "transparent", color: "var(--color-text)" }}
            aria-label="Go to my current location"
            disabled={isLocating}
          >
            <LocateFixed className="w-4 h-4" />
          </button>
          <button
            onClick={() => setFitBoundsFlag((f) => f + 1)}
            className="w-9 h-9 rounded-lg flex items-center justify-center hover:opacity-70 transition-opacity"
            style={{ background: "transparent", color: "var(--color-text)" }}
            aria-label="Fit all markers"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        {/* Secondary: theme toggle */}
        <div
          className="rounded-xl p-1.5 shadow-sm"
          style={{ background: "var(--color-card)", border: "1px solid var(--color-border)" }}
        >
          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-lg flex items-center justify-center hover:opacity-70 transition-opacity"
            style={{ background: "transparent", color: "var(--color-text)" }}
            aria-label="Toggle dark/light mode"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
