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
import { getDayColor, getActivityIcon } from "@/lib/utils";
import { Moon, Sun, Maximize2, LocateFixed } from "lucide-react";
import { toast } from "sonner";
import type { ItineraryItem } from "@/lib/types";

// Fix default Leaflet marker icon paths — use local copies from public/leaflet/
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

function createIconMarker(color: string, isSelected: boolean, count: number, svgPath: string) {
  const size = isSelected ? 30 : count > 1 ? 26 : 22;
  const iconSize = count > 1 ? 14 : 12;
  return L.divIcon({
    html: `<div style="
      width:${size}px;height:${size}px;background:${color};
      border-radius:50%;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3);
      display:flex;align-items:center;justify-content:center;
      transform:${isSelected ? "scale(1.3)" : "scale(1)"};
      transition:transform 0.2s;
    "><svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${svgPath}</svg>${count > 1 ? `<span style="position:absolute;bottom:-6px;right:-6px;background:white;color:${color};border-radius:50%;width:16px;height:16px;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;box-shadow:0 1px 3px rgba(0,0,0,0.3);">${count}</span>` : ""}</div>`,
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

// Cooldown after a marker tap so the map click handler
// doesn't immediately close the popup on iOS.
let lastMarkerTap = 0;

function findNearestItem(
  latlng: L.LatLng,
  map: L.Map,
  items: ItineraryItem[],
): ItineraryItem | null {
  let best: ItineraryItem | null = null;
  let bestDist = Infinity;
  const tapPoint = map.latLngToContainerPoint(latlng);

  for (const item of items) {
    const markerPoint = map.latLngToContainerPoint([
      item.latitude,
      item.longitude,
    ]);
    const d = tapPoint.distanceTo(markerPoint);
    if (d < bestDist) {
      bestDist = d;
      best = item;
    }
  }

  return bestDist <= 36 ? best : null;
}

function MapController({
  selectedItemId,
  allItems,
  fitBoundsFlag,
  onMapClick,
  onMarkerTap,
  userLocation,
  userLocationFocusRequest,
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
        if (disposed || !container.isConnected || !map.getPane("mapPane")) {
          return;
        }

        try {
          map.invalidateSize({ pan: false });
        } catch {
          // Leaflet can briefly remove its map pane during mobile dev reloads.
        }
      });
    };

    const observer = new ResizeObserver(() => {
      refreshMapSize();
    });
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

  // Close popup on map background click (not on markers)
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handler = (e: any) => {
      if (Date.now() - lastMarkerTap < 400) return;

      const oe = e.originalEvent;
      const target =
        (oe?.target as HTMLElement | undefined) ??
        (oe?.changedTouches?.[0]?.target as HTMLElement | undefined);
      if (target?.closest(".leaflet-popup")) return;

      // On iOS the marker click sometimes doesn't fire at all —
      // fall back to proximity check against marker coordinates.
      const nearest = findNearestItem(e.latlng, map, allItems);
      if (nearest) {
        lastMarkerTap = Date.now();
        onMarkerTap(nearest);
        return;
      }

      onMapClick();
    };
    map.on("click", handler);
    return () => { map.off("click", handler); };
  }, [map, onMapClick, allItems, onMarkerTap]);

  useEffect(() => {
    const container = map.getContainer();
    let startPoint: L.Point | null = null;

    const getTouchPoint = (event: TouchEvent | PointerEvent) => {
      const touch =
        "changedTouches" in event ? event.changedTouches[0] : event;
      if (!touch) return null;

      const rect = container.getBoundingClientRect();
      return L.point(touch.clientX - rect.left, touch.clientY - rect.top);
    };

    const handleTouchStart = (event: TouchEvent | PointerEvent) => {
      startPoint = getTouchPoint(event);
    };

    const handleTouchEnd = (event: TouchEvent | PointerEvent) => {
      if (Date.now() - lastMarkerTap < 400) return;

      const target = event.target as HTMLElement | null;
      if (target?.closest(".leaflet-popup, button, a")) return;

      const endPoint = getTouchPoint(event);
      if (!startPoint || !endPoint || startPoint.distanceTo(endPoint) > 12) {
        startPoint = null;
        return;
      }
      startPoint = null;

      const nearest = findNearestItem(
        map.containerPointToLatLng(endPoint),
        map,
        allItems
      );

      if (!nearest) return;

      event.preventDefault();
      event.stopPropagation();
      lastMarkerTap = Date.now();
      onMarkerTap(nearest);
    };

    container.addEventListener("touchstart", handleTouchStart, {
      capture: true,
      passive: true,
    });
    container.addEventListener("touchend", handleTouchEnd, {
      capture: true,
      passive: false,
    });
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
    // Close popup on drag but NOT on zoom — programmatic flyTo
    // fires zoomstart synchronously on iOS, which would close the popup
    // before it even renders.
    map.on("dragstart", onMapClick);
    return () => { map.off("dragstart", onMapClick); };
  }, [map, onMapClick]);

  // Fit bounds on first load
  useEffect(() => {
    if (hasFitInitial.current || allItems.length === 0) return;
    hasFitInitial.current = true;
    const bounds = L.latLngBounds(
      allItems.map((i) => [i.latitude, i.longitude] as [number, number])
    );
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 9 });
  }, [allItems, map]);

  // Fit bounds when flag changes
  useEffect(() => {
    if (fitBoundsFlag === 0 || allItems.length === 0) return;
    const bounds = L.latLngBounds(
      allItems.map((i) => [i.latitude, i.longitude] as [number, number])
    );
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 9 });
  }, [fitBoundsFlag]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fly to selected item
  useEffect(() => {
    if (!selectedItemId || selectedItemId === prevSelected.current) {
      prevSelected.current = selectedItemId;
      return;
    }
    prevSelected.current = selectedItemId;

    const item = allItems.find((i) => i.id === selectedItemId);
    if (!item) return;

    map.flyTo([item.latitude, item.longitude], 13, { duration: 0.8 });
  }, [selectedItemId, allItems, map]);

  useEffect(() => {
    if (userLocationFocusRequest === 0 || !userLocation) return;
    map.flyTo([userLocation.latitude, userLocation.longitude], 15, {
      duration: 0.6,
    });
  }, [map, userLocation, userLocationFocusRequest]);

  return null;
}

interface PlaceDetails {
  name: string;
  address: string;
  rating: number | null;
  totalRatings: number | null;
  photos: string[];
  reviews: { authorName: string; rating: number; text: string; relativeTime: string }[];
  url: string | null;
  website: string | null;
}

function StarRating({ rating }: { rating: number }) {
  const stars = Math.round(rating);
  return (
    <span style={{ color: "#FBBC04", fontSize: 11, letterSpacing: 1 }}>
      {"★".repeat(stars)}{"☆".repeat(5 - stars)}
    </span>
  );
}

function PlacePopupContent({ popupItem, displayDayIndex, item, group, onSelectItem }: {
  popupItem: ItineraryItem;
  displayDayIndex: number;
  item: ItineraryItem;
  group: { items: ItineraryItem[] };
  onSelectItem: (id: string) => void;
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
    fetch(`/api/place-details?q=${encodeURIComponent(query)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.place) setPlace(data.place);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [popupItem.location_name]);

  return (
    <div style={{ fontFamily: "inherit", minWidth: 220, maxWidth: 280, fontSize: 12 }}>
      {/* Photo */}
      {place?.photos?.length ? (
        <div style={{ position: "relative", margin: "-12px -12px 8px", borderRadius: "8px 8px 0 0", overflow: "hidden", background: "#f5f5f5", height: 140 }}>
          <img
            src={`/api/place-photo/${place.photos[photoIndex]}`}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
          {place.photos.length > 1 && (
            <div style={{ position: "absolute", bottom: 6, right: 6, display: "flex", gap: 4 }}>
              {place.photos.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPhotoIndex(i)}
                  style={{
                    width: 8, height: 8, borderRadius: "50%", border: "none",
                    background: i === photoIndex ? "white" : "rgba(255,255,255,0.5)",
                    cursor: "pointer", padding: 0,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      ) : null}

      {/* Rating */}
      {place?.rating ? (
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
          <StarRating rating={place.rating} />
          <span style={{ fontSize: 10, color: "#888" }}>
            {place.rating.toFixed(1)}
            {place.totalRatings ? ` (${place.totalRatings})` : ""}
          </span>
        </div>
      ) : null}

      {/* Day & Activity */}
      <p style={{ fontSize: 10, color: "#888", margin: "0 0 2px" }}>
        Day {displayDayIndex + 1}
      </p>
      <p style={{ fontWeight: 500, margin: "0 0 2px", lineHeight: 1.3 }}>
        {popupItem.activity}
      </p>
      <p style={{ color: "#666", margin: "0 0 4px", lineHeight: 1.3 }}>
        {popupItem.location_name}
      </p>

      {/* Address */}
      {place?.address && place.address !== popupItem.location_name && (
        <p style={{ fontSize: 10, color: "#999", margin: "0 0 6px", lineHeight: 1.3 }}>
          {place.address}
        </p>
      )}

      {/* Links */}
      <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
        <a
          href={place?.url || `https://www.google.com/maps?q=${item.latitude},${item.longitude}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: 10, color: "#4285F4", textDecoration: "none" }}
        >
          Open in Maps
        </a>
        {place?.website && (
          <a
            href={place.website}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 10, color: "#4285F4", textDecoration: "none" }}
          >
            Website
          </a>
        )}
      </div>

      {group.items.length > 1 && (
        <p style={{ fontSize: 10, color: "#4285F4", margin: "4px 0 0" }}>
          +{group.items.length - 1} more stops
        </p>
      )}

      {loading && (
        <p style={{ fontSize: 9, color: "#ccc", margin: "4px 0 0" }}>Loading details…</p>
      )}
    </div>
  );
}

function ItineraryMarker({
  group,
  selectedItemId,
  hoveredItemId,
  poppedKey,
  onPopupChange,
  onSelectItem,
  onHoverItem,
}: {
  group: { items: ItineraryItem[]; dayIndex: number };
  selectedItemId: string | null;
  hoveredItemId: string | null;
  poppedKey: string | null;
  onPopupChange: (key: string | null) => void;
  onSelectItem: (id: string) => void;
  onHoverItem: (id: string | null) => void;
}) {
  const markerRef = useRef<L.Marker | null>(null);
  const item = group.items[0];
  const locKey = `${item.latitude}-${item.longitude}`;
  const isSelected = group.items.some((i) => i.id === selectedItemId);
  const isHovered = group.items.some((i) => i.id === hoveredItemId);
  const isPopped = poppedKey === locKey;
  const popupItem =
    group.items.find((groupItem) => groupItem.id === selectedItemId) || item;
  const days = useItineraryStore((s) => s.days);
  const popupDayIndex = days.findIndex((d) => d.id === popupItem.day_id);
  const displayDayIndex = popupDayIndex >= 0 ? popupDayIndex : group.dayIndex;
  const color = getDayColor(displayDayIndex);
  const svgPath = getActivitySvg(getActivityIcon(item.activity, item.location_name));
  const icon = createIconMarker(
    color,
    isSelected || isHovered,
    group.items.length,
    svgPath
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const openMarkerPopup = useCallback((event?: any) => {
    if (event) {
      L.DomEvent.stop(event);
      event.originalEvent?.preventDefault?.();
    }

    lastMarkerTap = Date.now();
    onPopupChange(locKey);
    onSelectItem(popupItem.id);
    markerRef.current?.openPopup();

    const el = document.getElementById(`item-${popupItem.id}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [locKey, onPopupChange, onSelectItem, popupItem.id]);

  useEffect(() => {
    const marker = markerRef.current;
    if (!marker) return;

    marker.on("touchend" as keyof L.LeafletEventHandlerFnMap, openMarkerPopup);
    return () => {
      marker.off("touchend" as keyof L.LeafletEventHandlerFnMap, openMarkerPopup);
    };
  }, [openMarkerPopup]);

  useEffect(() => {
    if (isPopped) {
      markerRef.current?.openPopup();
    } else {
      markerRef.current?.closePopup();
    }
  }, [isPopped, popupItem.id]);

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
      <Popup
        autoPan={false}
        eventHandlers={{
          remove: () => {
            if (isPopped) onPopupChange(null);
          },
        }}
      >
        <PlacePopupContent
          popupItem={popupItem}
          displayDayIndex={displayDayIndex}
          item={item}
          group={group}
          onSelectItem={onSelectItem}
        />
      </Popup>
    </Marker>
  );
}

export function ItineraryMap() {
  const {
    days,
    selectedItemId,
    hoveredItemId,
    selectItem,
    hoverItem,
    theme,
  } = useItineraryStore();

  const [tileTheme, setTileTheme] = useState<"light" | "dark">(theme);
  const [fitBoundsFlag, setFitBoundsFlag] = useState(0);
  const [poppedKey, setPoppedKey] = useState<string | null>(null);
  const [userLocationFocusRequest, setUserLocationFocusRequest] = useState(0);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const closePopups = useCallback(() => setPoppedKey(null), []);

  const handleMarkerTap = useCallback(
    (item: ItineraryItem) => {
      setPoppedKey(`${item.latitude}-${item.longitude}`);
      selectItem(item.id);
      const el = document.getElementById(`item-${item.id}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    },
    [selectItem],
  );
  const locateUser = useCallback(() => {
    if (!("geolocation" in navigator)) {
      toast.error("Location is not available in this browser.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setUserLocationFocusRequest((value) => value + 1);
        setIsLocating(false);
      },
      (error) => {
        setIsLocating(false);
        if (!window.isSecureContext) {
          toast.error(
            "Current location needs localhost on desktop or HTTPS on mobile/LAN."
          );
          return;
        }
        toast.error(error.message || "Could not get your current location.");
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 30000,
      }
    );
  }, []);

  const allItems = useMemo(() => days.flatMap((d) => d.items), [days]);

  // Group items by rounded coordinates for clustering
  const locationGroups = useMemo(() => {
    const groups = new Map<
      string,
      { items: ItineraryItem[]; dayIndex: number }
    >();
    allItems.forEach((item) => {
      const key = `${item.latitude.toFixed(3)},${item.longitude.toFixed(3)}`;
      if (!groups.has(key)) {
        groups.set(key, {
          items: [],
          dayIndex: days.findIndex((d) => d.id === item.day_id),
        });
      }
      groups.get(key)!.items.push(item);
    });
    return Array.from(groups.values());
  }, [allItems, days]);

  // Route polylines per day
  const routes = useMemo(() => {
    return days
      .filter((d) => d.items.length >= 2)
      .map((day, dayIndex) => ({
        dayIndex,
        positions: day.items.map(
          (item) => [item.latitude, item.longitude] as [number, number]
        ),
        color: getDayColor(dayIndex),
      }));
  }, [days]);

  const tileLayer = useMemo(() => {
    if (tileTheme === "dark") {
      return {
        key: "dark",
        url: "/api/map-tiles/dark/{z}/{x}/{y}",
        attribution:
          '&copy; <a href="https://openstreetmap.org/">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
      };
    }

    return {
      key: "light",
      url: "/api/map-tiles/light/{z}/{x}/{y}?v=osm-2",
      attribution:
        '&copy; <a href="https://openstreetmap.org/">OpenStreetMap</a>',
    };
  }, [tileTheme]);

  useEffect(() => {
    if (!selectedItemId) {
      setPoppedKey(null);
      return;
    }

    const selectedItem = allItems.find((item) => item.id === selectedItemId);
    if (selectedItem) {
      setPoppedKey(`${selectedItem.latitude}-${selectedItem.longitude}`);
    }
  }, [allItems, selectedItemId]);

  return (
    <div className="absolute inset-0">
      <MapContainer
        center={[43.2, 142.5]}
        zoom={7}
        style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          key={tileLayer.key}
          attribution={tileLayer.attribution}
          url={tileLayer.url}
        />

        <MapController
          selectedItemId={selectedItemId}
          allItems={allItems}
          fitBoundsFlag={fitBoundsFlag}
          onMapClick={closePopups}
          onMarkerTap={handleMarkerTap}
          userLocation={userLocation}
          userLocationFocusRequest={userLocationFocusRequest}
        />

        {/* Route polylines */}
        {routes.map((route) => (
          <Polyline
            key={`route-${route.dayIndex}`}
            positions={route.positions}
            pathOptions={{
              color: route.color,
              weight: 2,
              opacity: 0.4,
              dashArray: "5 5",
            }}
          />
        ))}

        {/* Markers */}
        {locationGroups.map((group) => {
          const item = group.items[0];
          const locKey = `${item.latitude}-${item.longitude}`;
          return (
            <ItineraryMarker
              key={locKey}
              group={group}
              selectedItemId={selectedItemId}
              hoveredItemId={hoveredItemId}
              poppedKey={poppedKey}
              onPopupChange={setPoppedKey}
              onSelectItem={selectItem}
              onHoverItem={hoverItem}
            />
          );
        })}

        {userLocation && (
          <CircleMarker
            center={[userLocation.latitude, userLocation.longitude]}
            radius={8}
            pathOptions={{
              color: "#ffffff",
              weight: 3,
              fillColor: "#4285F4",
              fillOpacity: 1,
            }}
          >
            <Popup autoPan={false}>You are here</Popup>
          </CircleMarker>
        )}
      </MapContainer>

      {/* Map controls */}
      <div className="absolute right-4 top-4 z-[800] flex flex-col gap-2 lg:top-auto lg:bottom-4">
        <button
          onClick={() => {
            setTileTheme(tileTheme === "dark" ? "light" : "dark");
          }}
          className="w-11 h-11 rounded-lg bg-white border border-gray-200 shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors"
          aria-label="Toggle map style"
        >
          {tileTheme === "dark" ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </button>
        <button
          onClick={() => setFitBoundsFlag((f) => f + 1)}
          className="w-11 h-11 rounded-lg bg-white border border-gray-200 shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors"
          aria-label="Fit all markers"
        >
          <Maximize2 className="w-5 h-5" />
        </button>
        <button
          onClick={locateUser}
          className="w-11 h-11 rounded-lg bg-white border border-gray-200 shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-60"
          aria-label="Go to my current location"
          disabled={isLocating}
        >
          <LocateFixed className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
