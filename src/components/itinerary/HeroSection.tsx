"use client";

import { useItineraryStore } from "@/store/itinerary";
import { MapPin } from "lucide-react";

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
    <div className="flex items-start gap-3">
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ background: "var(--color-accent-muted)" }}
      >
        <MapPin className="w-4 h-4" style={{ color: "var(--color-accent)" }} />
      </div>
      <div className="min-w-0">
        <h1 className="text-lg font-semibold leading-tight tracking-tight" style={{ color: "var(--color-text)" }}>
          {tripTitle}
        </h1>
        {tripSubtitle && (
          <p className="text-xs mt-0.5" style={{ color: "var(--color-muted)" }}>
            {tripSubtitle}
          </p>
        )}
      </div>
    </div>
  );
}
