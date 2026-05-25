"use client";

import { useItineraryStore } from "@/store/itinerary";
import { cn, formatTime, getActivityIcon, getCategoryAccent } from "@/lib/utils";
import type { ItineraryItem } from "@/lib/types";
import { Plane, Train, Hotel, UtensilsCrossed, Mountain, Car, ShoppingBag, Building2, TreePine, Waves, Coffee, MapPin, ThermometerSun } from "lucide-react";

type IconProps = { className?: string; style?: React.CSSProperties };
const iconMap: Record<string, React.ComponentType<IconProps>> = {
  plane: Plane, train: Train, hotel: Hotel, food: UtensilsCrossed,
  hiking: Mountain, car: Car, shopping: ShoppingBag, museum: Building2,
  park: TreePine, water: Waves, cafe: Coffee, onsen: ThermometerSun,
  default: MapPin,
};

interface ItineraryCardProps {
  item: ItineraryItem;
  dayIndex: number;
  isLast: boolean;
  onSelect?: () => void;
}

export function ItineraryCard({ item, isLast, onSelect }: ItineraryCardProps) {
  const { selectedItemId, hoveredItemId, selectItem, hoverItem } = useItineraryStore();
  const isSelected = selectedItemId === item.id;
  const isHovered = hoveredItemId === item.id;
  const iconType = getActivityIcon(item.activity, item.location_name);
  const Icon = iconMap[iconType] || iconMap.default;
  const accent = getCategoryAccent(iconType);

  return (
    <div
      id={`item-${item.id}`}
      className={cn(
        "relative pl-4 py-3 pr-4 rounded-r-xl cursor-pointer transition-all duration-200",
        isSelected && "bg-[var(--color-accent-muted)]",
        isHovered && !isSelected && "bg-[var(--color-border)]/50",
        !isSelected && !isHovered && "hover:bg-[var(--color-border)]/30"
      )}
      onClick={() => {
        selectItem(isSelected ? null : item.id);
        if (!isSelected) onSelect?.();
      }}
      onMouseEnter={() => hoverItem(item.id)}
      onMouseLeave={() => hoverItem(null)}
    >
      <div className="flex items-start gap-3">
        {/* Category accent bar */}
        {isSelected && (
          <div
            className="absolute left-0 top-2 bottom-2 w-[3px] flex-shrink-0"
            style={{ background: accent }}
          />
        )}

        {/* Icon */}
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ background: `${accent}18` }}
        >
          <Icon className="w-3.5 h-3.5" style={{ color: accent }} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Time */}
          <div className="text-xs font-medium tabular-nums" style={{ color: "var(--color-muted)" }}>
            {formatTime(item.start_time)}
            {item.end_time && <span className="opacity-50"> — {formatTime(item.end_time)}</span>}
          </div>

          {/* Activity title */}
          <h3
            className={cn(
              "text-sm font-medium mt-0.5 leading-snug transition-colors",
              isSelected && "text-[var(--color-accent)]"
            )}
            style={{ color: "var(--color-text)" }}
          >
            {item.activity}
          </h3>

          {/* Location */}
          <p className="text-xs mt-0.5" style={{ color: "var(--color-muted)" }}>
            {item.location_name}
          </p>

          {/* Notes — short preview */}
          {item.notes && (
            <p className="text-xs mt-1.5 opacity-60 leading-relaxed" style={{ color: "var(--color-muted)" }}>
              {item.notes.length > 60 ? `${item.notes.slice(0, 60)}…` : item.notes}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
