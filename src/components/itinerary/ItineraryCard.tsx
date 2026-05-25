"use client";

import { useItineraryStore } from "@/store/itinerary";
import { cn, formatTime, getActivityIcon, getDayColor } from "@/lib/utils";
import type { ItineraryItem } from "@/lib/types";
import {
  Plane,
  Train,
  Hotel,
  UtensilsCrossed,
  Mountain,
  Car,
  ShoppingBag,
  Building2,
  TreePine,
  Waves,
  Coffee,
  MapPin,
  ThermometerSun,
} from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  plane: Plane,
  train: Train,
  hotel: Hotel,
  food: UtensilsCrossed,
  hiking: Mountain,
  car: Car,
  shopping: ShoppingBag,
  museum: Building2,
  park: TreePine,
  water: Waves,
  cafe: Coffee,
  onsen: ThermometerSun,
  default: MapPin,
};

interface ItineraryCardProps {
  item: ItineraryItem;
  dayIndex: number;
  itemIndex: number;
  isLast: boolean;
  onSelect?: () => void;
}

export function ItineraryCard({
  item,
  dayIndex,
  itemIndex,
  isLast,
  onSelect,
}: ItineraryCardProps) {
  const { selectedItemId, hoveredItemId, selectItem, hoverItem } =
    useItineraryStore();
  const isSelected = selectedItemId === item.id;
  const isHovered = hoveredItemId === item.id;
  const iconType = getActivityIcon(item.activity, item.location_name);
  const Icon = iconMap[iconType] || iconMap.default;
  const color = getDayColor(dayIndex);

  return (
    <div
      id={`item-${item.id}`}
      className={cn(
        "itinerary-card relative pl-6 py-2.5 pr-3 rounded-lg cursor-pointer border border-transparent",
        isSelected && "bg-[#4285F4]/5 border-[#4285F4]/20",
        isHovered && "bg-gray-50 dark:bg-gray-800/50",
        !isSelected && !isHovered && "hover:bg-gray-50 dark:hover:bg-gray-800/30"
      )}
      onClick={() => {
        selectItem(isSelected ? null : item.id);
        if (!isSelected) onSelect?.();
      }}
      onMouseEnter={() => hoverItem(item.id)}
      onMouseLeave={() => hoverItem(null)}
    >
      {/* Timeline dot */}
      <div
        className="absolute left-[-5px] top-[18px] z-10"
        style={{ transform: "translateY(-50%)" }}
      >
        <div
          className={cn(
            "w-[11px] h-[11px] rounded-full border-2 border-white dark:border-[var(--color-background)] transition-all",
            isSelected ? "scale-125 pulse-ring" : "",
            isHovered ? "scale-110" : ""
          )}
          style={{ backgroundColor: color }}
        />
      </div>

      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ backgroundColor: `${color}10` }}
        >
          <Icon className="w-4 h-4" style={{ color }} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-[var(--color-muted-foreground)] tabular-nums">
              {formatTime(item.start_time)}
              {item.end_time && ` — ${formatTime(item.end_time)}`}
            </span>
          </div>
          <h3
            className={cn(
              "text-sm font-medium mt-0.5 leading-snug",
              isSelected && "text-[#4285F4]"
            )}
          >
            {item.activity}
          </h3>
          <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">
            {item.location_name}
          </p>
          {item.notes && (
            <p className="text-xs text-[var(--color-muted-foreground)]/70 mt-1 italic">
              {item.notes}
            </p>
          )}
        </div>

        {isSelected && (
          <div className="flex-shrink-0 w-1 rounded-full bg-[#4285F4] self-stretch" />
        )}
      </div>
    </div>
  );
}
