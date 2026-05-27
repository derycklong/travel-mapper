"use client";

import { useRef, useState, useEffect, type WheelEvent } from "react";
import { useItineraryStore } from "@/store/itinerary";
import { cn, getDayColor } from "@/lib/utils";
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
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 2);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 2);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkScroll, { passive: true });
    return () => el.removeEventListener("scroll", checkScroll);
  }, [days]);

  // Scroll active pill into view when activeDayFilter changes (e.g. via swipe)
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const childIndex = activeDayFilter === null ? 0 : activeDayFilter + 1;
    const child = el.children[childIndex] as HTMLElement | undefined;
    if (child) {
      child.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [activeDayFilter]);

  function handleWheel(e: WheelEvent<HTMLDivElement>) {
    if (!scrollRef.current) return;
    scrollRef.current.scrollLeft += e.deltaY;
  }

  return (
    <div className="relative px-4 pt-3 pb-2">
      {/* Left fade */}
      {canScrollLeft && (
        <div
          className="absolute left-0 top-0 bottom-2 w-8 z-10 pointer-events-none"
          style={{
            background: "linear-gradient(to right, var(--color-bg), transparent)",
          }}
        />
      )}

      {/* Right fade */}
      {canScrollRight && (
        <div
          className="absolute right-0 top-0 bottom-2 w-8 z-10 pointer-events-none"
          style={{
            background: "linear-gradient(to left, var(--color-bg), transparent)",
          }}
        />
      )}

      <div
        ref={scrollRef}
        onWheel={handleWheel}
        className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar"
      >
        <button
          onClick={() => setDayFilter(null)}
          className={cn(
            "flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all border whitespace-nowrap",
            activeDayFilter === null
              ? "text-white border-transparent shadow-sm"
              : "border-transparent hover:opacity-80"
          )}
          style={{
            background: activeDayFilter === null ? "var(--color-accent)" : "var(--color-card)",
            color: activeDayFilter === null ? "white" : "var(--color-text)",
            border: activeDayFilter === null ? "1px solid transparent" : "1px solid var(--color-border)",
          }}
        >
          All Days
          <span
            className="ml-1.5 inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-semibold"
            style={{
              background: activeDayFilter === null ? "rgba(255,255,255,0.25)" : "var(--color-accent-muted)",
              color: activeDayFilter === null ? "white" : "var(--color-accent)",
            }}
          >
            {days.reduce((sum, d) => sum + d.items.length, 0)}
          </span>
        </button>
        {days.map((day, i) => (
          <button
            key={day.id}
            onClick={() => setDayFilter(activeDayFilter === i ? null : i)}
            className={cn(
              "flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all border whitespace-nowrap",
              activeDayFilter === i
                ? "text-white border-transparent shadow-sm"
                : "border-transparent hover:opacity-80"
            )}
            style={{
              background: activeDayFilter === i ? getDayColor(i) : "var(--color-card)",
              color: activeDayFilter === i ? "white" : "var(--color-text)",
              border: activeDayFilter === i ? "1px solid transparent" : "1px solid var(--color-border)",
            }}
          >
            Day {i + 1}
            <span
              className="ml-1.5 inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-semibold"
              style={{
                background: activeDayFilter === i ? "rgba(255,255,255,0.25)" : "var(--color-accent-muted)",
                color: activeDayFilter === i ? "white" : "var(--color-accent)",
              }}
            >
              {day.items.length}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
