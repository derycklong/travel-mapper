import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { CategoryIcon, ItineraryItem } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

export function getCategoryAccent(category: CategoryIcon): string {
  const colors: Record<string, string> = {
    food: "var(--color-food)",
    nature: "var(--color-nature)",
    hotel: "var(--color-hotel)",
    transit: "var(--color-transit)",
    shopping: "var(--color-shopping)",
    water: "var(--color-water)",
    onsen: "var(--color-onsen)",
    cafe: "var(--color-cafe)",
    default: "var(--color-default)",
  };
  const map: Record<string, CategoryIcon> = {
    plane: "transit",
    train: "transit",
    car: "transit",
    hiking: "nature",
    park: "nature",
    museum: "default",
    sightseeing: "default",
  };
  return colors[map[category] || category] || colors.default;
}

export function getActivityIcon(
  activity: string,
  location_name: string
): CategoryIcon {
  const text = (activity + " " + location_name).toLowerCase();

  if (text.includes("airport") || text.includes("flight") || text.includes("departure"))
    return "plane";
  if (text.includes("jr ") || text.includes("train") || text.includes("station"))
    return "train";
  if (text.includes("hotel") || text.includes("check in") || text.includes("checkout") || text.includes("stay"))
    return "hotel";
  if (text.includes("dinner") || text.includes("lunch") || text.includes("breakfast") || text.includes("ramen") || text.includes("izakaya") || text.includes("food") || text.includes("seafood") || text.includes("wine"))
    return "food";
  if (text.includes("hike") || text.includes("mt ") || text.includes("mount ") || text.includes("trailhead"))
    return "hiking";
  if (text.includes("onsen") || text.includes("relax"))
    return "onsen";
  if (text.includes("shop") || text.includes("souvenir") || text.includes("mall"))
    return "shopping";
  if (text.includes("rental car") || text.includes("pick up car") || text.includes("depart") || text.includes("drive"))
    return "car";
  if (text.includes("museum") || text.includes("zoo") || text.includes("beer museum") || text.includes("shiroi"))
    return "museum";
  if (text.includes("park") || text.includes("shrine") || text.includes("garden"))
    return "park";
  if (text.includes("waterfall") || text.includes("pond") || text.includes("lake") || text.includes("falls") || text.includes("river"))
    return "water";
  if (text.includes("café") || text.includes("coffee") || text.includes("cafe"))
    return "cafe";

  return "default";
}

export function getDayColor(index: number): string {
  const colors = [
    "#4285F4", // Google Blue
    "#EA4335", // Google Red
    "#FBBC04", // Google Yellow
    "#34A853", // Google Green
    "#8E24AA", // Purple
    "#F06292", // Pink
    "#00ACC1", // Cyan
    "#FF7043", // Deep Orange
    "#7CB342", // Light Green
    "#5C6BC0", // Indigo
  ];
  return colors[index % colors.length];
}

export function getDayDuration(items: ItineraryItem[]): string | null {
  if (!items.length) return null;
  const first = items[0].start_time;
  const lastItem = [...items].reverse().find((i) => i.end_time);
  if (!lastItem?.end_time) return null;
  const [h1, m1] = first.split(":").map(Number);
  const [h2, m2] = lastItem.end_time.split(":").map(Number);
  const diff = h2 * 60 + m2 - h1 * 60 - m1;
  if (diff <= 0) return null;
  const hrs = Math.floor(diff / 60);
  const mins = diff % 60;
  if (hrs === 0) return `${mins}m`;
  return `${hrs}h ${mins}m`;
}

export function estimateTravelTime(
  items: ItineraryItem[],
  currentIndex: number
): string | null {
  if (currentIndex >= items.length - 1) return null;

  const current = items[currentIndex];
  const next = items[currentIndex + 1];

  const R = 6371;
  const dLat = ((next.latitude - current.latitude) * Math.PI) / 180;
  const dLon = ((next.longitude - current.longitude) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((current.latitude * Math.PI) / 180) *
      Math.cos((next.latitude * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = R * c;

  if (distanceKm < 0.5) return null;
  if (distanceKm < 5) return `${Math.round(distanceKm * 10) / 10} km (~${Math.round(distanceKm / 30 * 60)} min drive)`;
  return `${Math.round(distanceKm)} km (~${Math.round(distanceKm / 60 * 60)} min drive)`;
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}
