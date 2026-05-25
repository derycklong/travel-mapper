"use client";

import { useRef, useEffect } from "react";
import { useItineraryStore } from "@/store/itinerary";
import { ItineraryCard } from "./ItineraryCard";
import { formatDate, getDayDuration, getDayColor } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import type { DayWithItems } from "@/lib/types";

interface DayTimelineProps {
  days?: DayWithItems[];
  onItemSelect?: () => void;
}

export function DayTimeline({ days: daysProp, onItemSelect }: DayTimelineProps = {}) {
  const storeDays = useItineraryStore((s) => s.days);
  const activeDayFilter = useItineraryStore((s) => s.activeDayFilter);
  const selectedDayId = useItineraryStore((s) => s.selectedDayId);
  const collapsedDays = useItineraryStore((s) => s.collapsedDays);
  const toggleDayCollapse = useItineraryStore((s) => s.toggleDayCollapse);
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
      <div className="flex items-center justify-center p-8 text-center" style={{ minHeight: 200 }}>
        <div>
          <p className="text-sm" style={{ color: "var(--color-muted)" }}>
            No itinerary data available.
          </p>
          <p className="text-xs mt-2" style={{ color: "var(--color-muted)", opacity: 0.7 }}>
            Select a day above to explore the route
          </p>
        </div>
      </div>
    );
  }

  if (filteredDays.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 text-center" style={{ minHeight: 200 }}>
        <p className="text-sm" style={{ color: "var(--color-muted)" }}>
          No activities match this filter
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1 px-3 py-2">
      {filteredDays.map((day, dayIndex) => {
        const isCollapsed = collapsedDays.has(day.id);
        const realDayIndex = days.findIndex((d) => d.id === day.id);
        const color = getDayColor(realDayIndex);
        const duration = getDayDuration(day.items);

        return (
          <div
            key={day.id}
            ref={(el) => {
              if (el) dayRefs.current.set(day.id, el);
            }}
            id={`day-${day.id}`}
          >
            {/* Day header — clickable to collapse */}
            <button
              onClick={() => toggleDayCollapse(day.id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors hover:bg-[var(--color-border)]/50 text-left"
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold text-white flex-shrink-0"
                style={{ background: color }}
              >
                {realDayIndex + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium leading-tight" style={{ color: "var(--color-text)" }}>
                  {day.title}
                </div>
                <div className="flex items-center gap-2 text-xs mt-0.5" style={{ color: "var(--color-muted)" }}>
                  <span>{formatDate(day.date)}</span>
                  {!isCollapsed && (
                    <>
                      <span>·</span>
                      <span>{day.items.length} activities</span>
                      {duration && (
                        <>
                          <span>·</span>
                          <span>{duration}</span>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
              <ChevronDown
                className="w-4 h-4 transition-transform duration-200 flex-shrink-0"
                style={{
                  color: "var(--color-muted)",
                  transform: isCollapsed ? "rotate(-90deg)" : "rotate(0deg)",
                }}
              />
            </button>

            {/* Collapsed summary */}
            {isCollapsed && (
              <div className="px-3 pb-2 pt-0.5">
                <p className="text-xs" style={{ color: "var(--color-muted)" }}>
                  {day.items.length} activities
                  {duration ? ` · ${duration}` : ""}
                </p>
              </div>
            )}

            {/* Expanded items */}
            {!isCollapsed && (
              <div className="relative pl-4">
                <div
                  className="absolute left-[17px] top-0 bottom-0 w-px"
                  style={{ background: "var(--color-border)" }}
                />
                <div className="space-y-0.5">
                  {day.items.map((item, itemIndex) => (
                    <ItineraryCard
                      key={item.id}
                      item={item}
                      dayIndex={realDayIndex}
                      isLast={itemIndex === day.items.length - 1}
                      onSelect={onItemSelect}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
