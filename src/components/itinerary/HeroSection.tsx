"use client";

import { useItineraryStore } from "@/store/itinerary";
import { MapPin, CalendarDays } from "lucide-react";

interface HeroSectionProps {
  title?: string;
  subtitle?: string;
}

export function HeroSection({ title, subtitle }: HeroSectionProps = {}) {
  const storeTitle = useItineraryStore((s) => s.tripTitle);
  const storeSubtitle = useItineraryStore((s) => s.tripSubtitle);
  const tripTitle = title ?? storeTitle;
  const tripSubtitle = subtitle ?? storeSubtitle;

  return (
    <header className="sticky top-0 z-30 bg-[var(--color-background)]/80 backdrop-blur-lg border-b border-[var(--color-border)]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#4285F4]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-[#4285F4]" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-medium leading-tight tracking-tight text-[var(--color-foreground)]">
              {tripTitle}
            </h1>
            <p className="mt-1 text-sm sm:text-base text-[var(--color-muted-foreground)] flex items-center gap-1.5 flex-wrap">
              <CalendarDays className="w-4 h-4 flex-shrink-0" />
              <span>{tripSubtitle}</span>
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
