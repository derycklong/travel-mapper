import { getEnv } from "@/lib/env";

export const TRIP_TITLE = "Hokkaido Autumn Road Trip";
export const TRIP_SUBTITLE =
  "10 Days in Hokkaido — Sapporo, Lake Toya, Furano, Biei, Sounkyo & Otaru";

export const MAP_DEFAULT_CENTER: [number, number] = [142.5, 43.2];
export const MAP_DEFAULT_ZOOM = 7;

export const ADMIN_PASSWORD = getEnv("ADMIN_PASSWORD") || "hokkaido2020";
