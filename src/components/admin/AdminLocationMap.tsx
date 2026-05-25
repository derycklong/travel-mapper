"use client";

import { useEffect, useRef } from "react";
import {
  MapContainer,
  Marker,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import type { Location } from "@/lib/types";

// ── Canvas-backed tile layer ──────────────────────────────────────
// Renders OSM tiles onto a <canvas> with 1 px edge bleed so there
// are no white seams between adjacent tiles.
class CanvasTileLayer extends L.GridLayer {
  private _url: string;

  constructor(options: L.GridLayerOptions & { url: string }) {
    super(options);
    this._url = options.url;
  }

  createTile(coords: L.Coords): HTMLCanvasElement {
    const size = this.getTileSize();
    const canvas = document.createElement("canvas");
    canvas.width = size.x;
    canvas.height = size.y;

    const ctx = canvas.getContext("2d")!;
    const img = new Image();
    img.crossOrigin = "anonymous";

    const url = this._url
      .replace("{z}", String(coords.z))
      .replace("{x}", String(coords.x))
      .replace("{y}", String(coords.y));

    img.onload = () => {
      // Draw 1 px larger on each side to cover anti-aliasing gaps
      ctx.drawImage(img, -1, -1, size.x + 2, size.y + 2);
    };
    img.onerror = () => {
      ctx.fillStyle = "#e5e5e5";
      ctx.fillRect(0, 0, size.x, size.y);
    };
    img.src = url;
    return canvas;
  }
}

function CanvasTileLayerComponent({ url }: { url: string }) {
  const map = useMap();
  useEffect(() => {
    const layer = new CanvasTileLayer({ url });
    layer.addTo(map);
    return () => { map.removeLayer(layer); };
  }, [map, url]);
  return null;
}

interface AdminLocationMapProps {
  latitude: number;
  locations: Location[];
  longitude: number;
  onPick: (latitude: number, longitude: number) => void;
  onSelectLocation: (location: Location) => void;
  selectedLocationId: string;
  flyToKey?: number;
}

function MapClickHandler({ onPick }: Pick<AdminLocationMapProps, "onPick">) {
  useMapEvents({
    click(event) {
      onPick(event.latlng.lat, event.latlng.lng);
    },
  });

  return null;
}

function MapController({
  latitude,
  locations,
  longitude,
  selectedLocationId,
  flyToKey,
}: {
  latitude: number;
  locations: Location[];
  longitude: number;
  selectedLocationId: string;
  flyToKey?: number;
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

  useEffect(() => {
    if (hasFitInitial.current || locations.length === 0) return;
    hasFitInitial.current = true;

    if (locations.length === 1) {
      map.setView(
        [locations[0].latitude, locations[0].longitude],
        13,
        { animate: false }
      );
      return;
    }

    const bounds = L.latLngBounds(
      locations.map((l) => [l.latitude, l.longitude] as [number, number])
    );
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 9, animate: false });
  }, [locations, map]);

  useEffect(() => {
    if (!selectedLocationId || selectedLocationId === prevSelected.current) {
      prevSelected.current = selectedLocationId;
      return;
    }

    prevSelected.current = selectedLocationId;

    const location = locations.find((l) => l.id === selectedLocationId);
    if (!location) return;

    map.flyTo([location.latitude, location.longitude], 13, { duration: 0.8 });
  }, [selectedLocationId, locations, map]);

  useEffect(() => {
    if (flyToKey === undefined || flyToKey === 0) return;
    map.flyTo([latitude, longitude], 13, { duration: 0.8 });
  }, [flyToKey]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}

export function AdminLocationMap({
  latitude,
  locations,
  longitude,
  onPick,
  onSelectLocation,
  selectedLocationId,
  flyToKey,
}: AdminLocationMapProps) {
  return (
    <div className="absolute inset-0">
      <MapContainer
        center={[43.2, 142.5]}
        zoom={7}
        style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
        zoomControl={false}
        attributionControl={false}
      >
        <CanvasTileLayerComponent url="/api/map-tiles/light/{z}/{x}/{y}?v=osm-2" />

        <MapController
          latitude={latitude}
          locations={locations}
          longitude={longitude}
          selectedLocationId={selectedLocationId}
          flyToKey={flyToKey}
        />

        {locations.map((location) => {
          const isSelected = location.id === selectedLocationId;
          const position: [number, number] = isSelected
            ? [latitude, longitude]
            : [location.latitude, location.longitude];

          return (
            <Marker
              key={location.id}
              position={position}
              icon={L.divIcon({
                html: `<div style="
                  width:${isSelected ? 16 : 12}px;
                  height:${isSelected ? 16 : 12}px;
                  background:${isSelected ? "#4285F4" : "#111827"};
                  border:2px solid white;
                  border-radius:50%;
                  box-shadow:0 1px 3px rgba(0,0,0,0.3);
                "></div>`,
                className: "",
                iconSize: [isSelected ? 16 : 12, isSelected ? 16 : 12],
                iconAnchor: [isSelected ? 8 : 6, isSelected ? 8 : 6],
              })}
              bubblingMouseEvents={false}
              eventHandlers={{
                click: (event) => {
                  L.DomEvent.stop(event);
                  onSelectLocation(location);
                },
              }}
            />
          );
        })}

        {locations.length === 0 && (
          <Marker
            position={[latitude, longitude]}
            icon={L.divIcon({
              html: `<div style="
                width:14px;height:14px;
                background:#4285F4;
                border:2px solid white;
                border-radius:50%;
                box-shadow:0 1px 3px rgba(0,0,0,0.3);
              "></div>`,
              className: "",
              iconSize: [14, 14],
              iconAnchor: [7, 7],
            })}
          />
        )}

        <MapClickHandler onPick={onPick} />
      </MapContainer>
    </div>
  );
}
