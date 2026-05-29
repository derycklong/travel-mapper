"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { useItineraryStore } from "@/store/itinerary";
import { HeroSection } from "./HeroSection";
import { DayTimeline } from "./DayTimeline";
import { DayFilter } from "./DayFilter";
import { Drawer } from "vaul";
import { List, X } from "lucide-react";
import type { DayWithItems } from "@/lib/types";

const ItineraryMap = dynamic(
  () => import("../map/ItineraryMap").then((mod) => mod.ItineraryMap),
  { ssr: false }
);

interface ItineraryAppProps {
  initialDays: DayWithItems[];
  tripTitle: string;
  tripSubtitle: string;
}

export function ItineraryApp({ initialDays, tripTitle, tripSubtitle }: ItineraryAppProps) {
  const [panelOpen, setPanelOpen] = useState(false);
  const prevDesktop = useRef(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;

    // Only handle horizontal swipes (dominant axis + minimum distance)
    if (Math.abs(deltaX) < Math.abs(deltaY) || Math.abs(deltaX) < 50) return;

    const { days, activeDayFilter, setDayFilter } = useItineraryStore.getState();
    const totalDays = days.length;
    if (totalDays === 0) return;

    if (deltaX < 0) {
      // Swipe left → next day
      if (activeDayFilter === null) {
        setDayFilter(0);
      } else if (activeDayFilter < totalDays - 1) {
        setDayFilter(activeDayFilter + 1);
      } else {
        setDayFilter(null); // wrap to All Days
      }
    } else {
      // Swipe right → previous day
      if (activeDayFilter === null) {
        setDayFilter(totalDays - 1); // wrap to last day
      } else if (activeDayFilter > 0) {
        setDayFilter(activeDayFilter - 1);
      } else {
        setDayFilter(null); // wrap to All Days
      }
    }
  }, []);

  useEffect(() => {
    useItineraryStore.setState({
      days: initialDays,
      tripTitle,
      tripSubtitle,
      isLoading: false,
      error: null,
    });
  }, [initialDays, tripTitle, tripSubtitle]);

  // Sync store theme from <html> data attribute (set by inline script before paint)
  useEffect(() => {
    const htmlTheme = document.documentElement.getAttribute("data-theme");
    if (htmlTheme === "dark" || htmlTheme === "light") {
      useItineraryStore.setState({ theme: htmlTheme });
    }
  }, []);

  // Close bottom sheet when resizing to desktop
  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
    const handler = (e: MediaQueryListEvent | MediaQueryList) => {
      if (e.matches && !prevDesktop.current) {
        setPanelOpen(false);
      }
      prevDesktop.current = e.matches;
    };
    handler(mql);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  // Restore drawer scroll position when reopening
  useEffect(() => {
    if (!panelOpen) return;
    const saved = sessionStorage.getItem("drawer-scroll");
    if (!saved) return;
    const scrollTo = parseInt(saved, 10);
    // Retry a few times to ensure the DOM is settled after portal mount
    let attempts = 0;
    const tryRestore = () => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = scrollTo;
      } else if (attempts < 5) {
        attempts++;
        setTimeout(tryRestore, 50);
      }
    };
    tryRestore();
  }, [panelOpen]);

  if (!Array.isArray(initialDays) || initialDays.length === 0) {
    return (
      <div className="h-full flex items-center justify-center px-4" style={{ background: "var(--color-bg)" }}>
        <div className="text-center max-w-sm">
          <div className="text-4xl mb-4">&#128506;</div>
          <h2 className="text-lg font-medium mb-2" style={{ color: "var(--color-text)" }}>No itinerary data</h2>
          <p className="text-sm mb-4" style={{ color: "var(--color-muted)" }}>
            The itinerary is empty. Add some days and items in the admin panel.
          </p>
          <a
            href="/admin"
            className="inline-flex items-center gap-2 px-4 py-2 text-white rounded-lg text-sm font-medium transition-colors"
            style={{ background: "var(--color-accent)" }}
          >
            Go to Admin
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full relative" style={{ background: "var(--color-bg)" }}>
      {/* Single fullscreen map — shared by both layouts */}
      {/* Note: top-0/left-0/right-0 + height:100dvh bypasses Vaul setting
          body.style.height='auto' on iOS Safari, which collapses height:100% to zero.
          Using 100dvh instead of inset-0 ensures the map always fills the viewport
          regardless of body height. */}
      <div className="absolute isolate" style={{ top: 0, left: 0, right: 0, height: '100dvh', transform: 'translateZ(0)' }}>
        <ItineraryMap />
      </div>

      {/* Desktop layout — hidden below lg */}
      <div className="hidden lg:block absolute inset-0 z-10 pointer-events-none">
        <aside
          className="absolute top-4 bottom-4 left-4 pointer-events-auto flex flex-col overflow-hidden rounded-2xl shadow-lg"
          style={{
            width: 400,
            background: "var(--color-card)",
            border: "1px solid var(--color-border)",
          }}
        >
          <div className="flex-shrink-0 px-5 pt-5 pb-1">
            <HeroSection title={tripTitle} subtitle={tripSubtitle} />
          </div>
          <DayFilter days={initialDays} />
          <div className="flex-1 min-h-0 overflow-y-auto px-1 pb-4">
            <DayTimeline days={initialDays} />
          </div>
        </aside>
      </div>

      {/* Mobile layout — hidden above lg */}
      <div className="block lg:hidden absolute inset-0 z-10 pointer-events-none">
        <Drawer.Root open={panelOpen} onOpenChange={setPanelOpen}>
          <Drawer.Trigger asChild>
            <button
              className="fixed right-4 z-[900] h-12 px-5 rounded-full shadow-lg flex items-center gap-2 transition-colors active:scale-95 pointer-events-auto touch-manipulation select-none"
              style={{
            background: "var(--color-card)",
                color: "var(--color-text)",
                border: "1px solid var(--color-border)",
                bottom: "max(1.5rem, calc(env(safe-area-inset-bottom) + 1rem))",
              }}
              aria-label="Open itinerary"
            >
              <List className="w-4 h-4" />
              <span className="text-sm font-medium">Itinerary</span>
            </button>
          </Drawer.Trigger>
          <Drawer.Portal>
            <Drawer.Overlay className="fixed inset-0 bg-black/40 z-40" />
            <Drawer.Content
              aria-describedby="drawer-description"
              className="fixed bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-2xl overflow-hidden"
              style={{
                background: "var(--color-bg)",
                maxHeight: "90vh",
              }}
            >
              <Drawer.Title className="sr-only">Itinerary</Drawer.Title>
              <div id="drawer-description" className="sr-only">List of itinerary items grouped by day</div>
              <div className="flex-shrink-0 flex justify-center pt-3 pb-1">
                <div
                  className="w-10 h-1 rounded-full"
                  style={{ background: "var(--color-muted)" }}
                />
              </div>
              <div className="flex-shrink-0 px-5 pt-1 pb-1">
                <HeroSection title={tripTitle} subtitle={tripSubtitle} />
              </div>
              <DayFilter days={initialDays} />
              <div
                ref={scrollContainerRef}
                onScroll={(e) => {
                  sessionStorage.setItem("drawer-scroll", String(e.currentTarget.scrollTop));
                }}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                className="flex-1 min-h-0 overflow-y-auto px-1 pb-6"
              >
                <DayTimeline days={initialDays} onItemSelect={() => setPanelOpen(false)} />
              </div>
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>
      </div>
    </div>
  );
}
