"use client";

import { useRef, useEffect } from "react";
import { useItineraryStore } from "@/store/itinerary";
import { ItineraryCard } from "./ItineraryCard";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { DayWithItems } from "@/lib/types";

interface DayTimelineProps {
  days?: DayWithItems[];
  onItemSelect?: () => void;
}

export function DayTimeline({ days: daysProp, onItemSelect }: DayTimelineProps = {}) {
  const storeDays = useItineraryStore((s) => s.days);
  const activeDayFilter = useItineraryStore((s) => s.activeDayFilter);
  const selectedDayId = useItineraryStore((s) => s.selectedDayId);
  const days = (daysProp && daysProp.length > 0) ? daysProp : storeDays;
  const dayRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const filteredDays =
    activeDayFilter !== null ? [days[activeDayFilter]].filter(Boolean) : days;

  useEffect(() => {
    if (selectedDayId) {
      const el = dayRefs.current.get(selectedDayId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }, [selectedDayId]);

  if (days.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <p className="text-sm text-[var(--color-muted-foreground)]">
          No itinerary data available.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-8">
      {filteredDays.map((day, dayIndex) => (
        <div
          key={day.id}
          ref={(el) => {
            if (el) dayRefs.current.set(day.id, el);
          }}
          id={`day-${day.id}`}
          className="relative"
        >
          {/* Day header */}
          <div className="sticky top-0 z-10 bg-[var(--color-background)] pb-3 mb-3">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0",
                  dayIndex === 0 && "bg-[#4285F4]",
                  dayIndex === 1 && "bg-[#EA4335]",
                  dayIndex === 2 && "bg-[#FBBC04] text-gray-900",
                  dayIndex === 3 && "bg-[#34A853]",
                  dayIndex === 4 && "bg-[#8E24AA]",
                  dayIndex === 5 && "bg-[#F06292]",
                  dayIndex === 6 && "bg-[#00ACC1]",
                  dayIndex === 7 && "bg-[#FF7043]",
                  dayIndex === 8 && "bg-[#7CB342]",
                  dayIndex === 9 && "bg-[#5C6BC0]"
                )}
              >
                {dayIndex + 1}
              </div>
              <div>
                <h2 className="text-base font-medium leading-tight text-[var(--color-foreground)]">
                  {day.title}
                </h2>
                <p className="text-xs text-[var(--color-muted-foreground)]">
                  {formatDate(day.date)}
                </p>
              </div>
            </div>
          </div>

          {/* Timeline line + cards */}
          <div className="relative pl-4">
            <div className="absolute left-[15px] top-0 bottom-0 w-px bg-[var(--color-border)]" />

            <div className="space-y-2">
              {day.items.map((item, itemIndex) => (
                <ItineraryCard
                  key={item.id}
                  item={item}
                  dayIndex={days.findIndex((d) => d.id === item.day_id)}
                  itemIndex={itemIndex}
                  isLast={itemIndex === day.items.length - 1}
                  onSelect={onItemSelect}
                />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
