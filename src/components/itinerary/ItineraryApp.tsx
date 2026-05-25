"use client";

import { useEffect, useSyncExternalStore, useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { useItineraryStore } from "@/store/itinerary";
import { HeroSection } from "./HeroSection";
import { DayTimeline } from "./DayTimeline";
import { DayFilter } from "./DayFilter";
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

const desktopQuery = "(min-width: 1024px)";

function subscribeToDesktopQuery(onStoreChange: () => void) {
  const mql = window.matchMedia(desktopQuery);
  mql.addEventListener("change", onStoreChange);
  return () => mql.removeEventListener("change", onStoreChange);
}

function getDesktopSnapshot() {
  return window.matchMedia(desktopQuery).matches;
}

function getServerDesktopSnapshot() {
  return false;
}

export function ItineraryApp({ initialDays, tripTitle, tripSubtitle }: ItineraryAppProps) {
  const isDesktop = useSyncExternalStore(
    subscribeToDesktopQuery,
    getDesktopSnapshot,
    getServerDesktopSnapshot
  );

  const [panelOpen, setPanelOpen] = useState(false);
  const panelTouchStartY = useRef<number | null>(null);
  const closePanel = useCallback(() => setPanelOpen(false), []);

  useEffect(() => {
    if (isDesktop) setPanelOpen(false);
  }, [isDesktop]);

  useEffect(() => {
    useItineraryStore.setState({
      days: initialDays,
      tripTitle,
      tripSubtitle,
      isLoading: false,
      error: null,
    });
  }, [initialDays, tripTitle, tripSubtitle]);

  if (!Array.isArray(initialDays) || initialDays.length === 0) {
    return (
      <div className="h-full flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="text-4xl mb-4">&#128506;</div>
          <h2 className="text-lg font-medium mb-2">No itinerary data</h2>
          <p className="text-sm text-gray-500 mb-4">
            The itinerary is empty. Add some days and items in the admin panel.
          </p>
          <a
            href="/admin"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#4285F4] text-white rounded-lg text-sm font-medium hover:bg-[#3367d6] transition-colors"
          >
            Go to Admin
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Hero: always shown on desktop, hidden on mobile (shown inside panel) */}
      <div className="hidden lg:block flex-shrink-0">
        <HeroSection title={tripTitle} subtitle={tripSubtitle} />
      </div>

      {/* Desktop layout: timeline sidebar + map */}
      {isDesktop && (
        <div className="flex-1 flex max-w-[1440px] mx-auto w-full min-h-0">
          <aside className="w-[480px] xl:w-[560px] flex-shrink-0 border-r border-[var(--color-border)] flex flex-col min-h-0">
            <DayFilter days={initialDays} />
            <DayTimeline days={initialDays} />
          </aside>
          <main className="flex-1 min-h-0 relative">
            <ItineraryMap />
          </main>
        </div>
      )}

      {/* Mobile layout: full-screen map + floating button + slide-over panel */}
      {!isDesktop && (
        <>
          <div className="flex-1 min-h-0 relative">
            <ItineraryMap />
          </div>

          <button
            onClick={() => setPanelOpen(true)}
            className="fixed right-4 z-[900] h-14 px-5 bg-[#1a1a1a] text-white rounded-full shadow-lg flex items-center gap-2 hover:bg-[#333] transition-colors active:scale-95 touch-manipulation select-none"
            style={{ bottom: "max(1.5rem, calc(env(safe-area-inset-bottom) + 1rem))" }}
            aria-label="Open itinerary"
          >
            <List className="w-5 h-5" />
            <span className="text-sm font-medium">Itinerary</span>
          </button>

          {panelOpen && (
            <div className="fixed inset-0 z-[1000]">
              <div
                className="absolute inset-0 bg-black/50"
                onClick={closePanel}
              />
              <div
                className="absolute bottom-0 left-0 right-0 bg-[var(--color-background)] flex flex-col rounded-t-2xl overflow-hidden"
                onTouchStart={(event) => {
                  panelTouchStartY.current = event.touches[0]?.clientY ?? null;
                }}
                onTouchEnd={(event) => {
                  const startY = panelTouchStartY.current;
                  panelTouchStartY.current = null;
                  const endY = event.changedTouches[0]?.clientY;
                  if (startY !== null && endY !== undefined && endY - startY > 80) {
                    closePanel();
                  }
                }}
                style={{
                  top: "max(10vh, env(safe-area-inset-top))",
                  animation: "slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              >
                <button
                  onClick={closePanel}
                  className="absolute top-4 right-4 z-40 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm shadow-sm hover:bg-white dark:hover:bg-gray-900 transition-colors"
                  aria-label="Close itinerary"
                >
                  <X className="h-5 w-5" />
                </button>
                <HeroSection title={tripTitle} subtitle={tripSubtitle} />
                <DayFilter days={initialDays} />
                <div className="flex-1 min-h-0 overflow-y-auto">
                  <DayTimeline days={initialDays} onItemSelect={closePanel} />
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* slideUp keyframe — injected via style tag so it's always available */}
      <style jsx>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
