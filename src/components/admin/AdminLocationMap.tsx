"use client";

import { useEffect, useRef } from "react";
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import type { Location } from "@/lib/types";

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
  // Always use light map background regardless of app theme
  useEffect(() => {
    const style = document.createElement("style");
    style.id = "admin-leaflet-bg";
    style.textContent = `#admin-map-container .leaflet-container { background: #F0EFEC !important; } #admin-map-container .leaflet-tile { filter: saturate(0.5); }`;
    document.head.appendChild(style);
    return () => { const el = document.getElementById("admin-leaflet-bg"); if (el) el.remove(); };
  }, []);

  return (
    <div className="absolute inset-0" id="admin-map-container">
      <MapContainer
        center={[43.2, 142.5]}
        zoom={7}
        style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
        zoomSnap={1}
        zoomDelta={1}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" tileSize={256} keepBuffer={6} attribution='&copy; <a href="https://openstreetmap.org/">OpenStreetMap</a>' />

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
