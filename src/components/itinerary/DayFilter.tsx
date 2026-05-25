"use client";

import { useRef, type WheelEvent } from "react";
import { useItineraryStore } from "@/store/itinerary";
import { cn } from "@/lib/utils";
import type { DayWithItems } from "@/lib/types";

interface DayFilterProps {
  days?: DayWithItems[];
}

export function DayFilter({ days: daysProp }: DayFilterProps = {}) {
  const storeDays = useItineraryStore((s) => s.days);
  const activeDayFilter = useItineraryStore((s) => s.activeDayFilter);
  const setDayFilter = useItineraryStore((s) => s.setDayFilter);
  const days = (daysProp && daysProp.length > 0) ? daysProp : storeDays;
  const scrollRef = useRef<HTMLDivElement>(null);

  function handleWheel(e: WheelEvent<HTMLDivElement>) {
    if (!scrollRef.current) return;
    // Convert vertical scroll to horizontal
    scrollRef.current.scrollLeft += e.deltaY;
  }

  return (
    <div className="px-4 sm:px-6 pt-4 pb-2">
      <div
        ref={scrollRef}
        onWheel={handleWheel}
        className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 hide-scrollbar"
      >
        <button
          onClick={() => setDayFilter(null)}
          className={cn(
            "flex-shrink-0 px-3 py-2 rounded-full text-xs font-medium transition-colors border whitespace-nowrap",
            activeDayFilter === null
              ? "bg-[#4285F4] text-white border-[#4285F4]"
              : "bg-white dark:bg-gray-900 text-[var(--color-muted-foreground)] border-[var(--color-border)] hover:border-gray-300"
          )}
        >
          All Days ({days.reduce((sum, d) => sum + d.items.length, 0)})
        </button>
        {days.map((day, i) => (
          <button
            key={day.id}
            onClick={() => setDayFilter(activeDayFilter === i ? null : i)}
            className={cn(
              "flex-shrink-0 px-3 py-2 rounded-full text-xs font-medium transition-colors border whitespace-nowrap",
              activeDayFilter === i
                ? "bg-[#4285F4] text-white border-[#4285F4]"
                : "bg-white dark:bg-gray-900 text-[var(--color-muted-foreground)] border-[var(--color-border)] hover:border-gray-300"
            )}
          >
            Day {i + 1} ({day.items.length})
          </button>
        ))}
      </div>
    </div>
  );
}
