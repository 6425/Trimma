"use client";

import { Loader2, Navigation2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TravelEstimate, TravelLeg } from "@/lib/google-travel";
import type { TravelMode } from "@/lib/salon-map";

const MODE_LABEL: Record<TravelMode, string> = {
  driving: "car",
  walking: "walk",
  transit: "transit",
};

function formatLeg(leg: TravelLeg): string {
  return `${leg.distanceText} · ${leg.durationText} by ${MODE_LABEL[leg.mode]}`;
}

type Props = {
  status: "idle" | "requesting" | "granted" | "denied" | "unavailable";
  estimate: TravelEstimate | null;
  loadingTravel: boolean;
  error: string | null;
  onRequestLocation: () => void;
  compact?: boolean;
};

export function MapTravelPanel({
  status,
  estimate,
  loadingTravel,
  error,
  onRequestLocation,
  compact = false,
}: Props) {
  if (status === "idle" || status === "denied" || status === "unavailable") {
    return (
      <div className={compact ? "mt-2" : "mt-3"}>
        <Button
          type="button"
          variant="dark"
          size="sm"
          className="h-auto min-h-11 w-full whitespace-normal rounded-lg px-3 py-2 text-left text-xs font-bold leading-snug sm:min-h-9 sm:w-auto sm:py-1.5"
          onClick={onRequestLocation}
        >
          <Navigation2 className="mr-1.5 h-3.5 w-3.5 shrink-0" />
          Enable location for accurate distance
        </Button>
        {error && <p className="mt-1 text-[11px] font-medium text-zinc-500">{error}</p>}
      </div>
    );
  }

  if (status === "requesting" || loadingTravel) {
    return (
      <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-zinc-600">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Finding the fastest route from your location…
      </p>
    );
  }

  if (!estimate?.fastest) {
    return error ? <p className="mt-2 text-[11px] font-medium text-zinc-500">{error}</p> : null;
  }

  const others = estimate.options.filter((option) => option.mode !== estimate.fastest.mode);

  return (
    <div className="mt-2 space-y-1">
      <p className="text-sm font-bold text-zinc-900">
        {formatLeg(estimate.fastest)}
        <span className="ml-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">fastest</span>
      </p>
      {others.length > 0 && (
        <p className="text-xs text-zinc-600">
          {others.map((option) => formatLeg(option)).join(" · ")}
        </p>
      )}
    </div>
  );
}
