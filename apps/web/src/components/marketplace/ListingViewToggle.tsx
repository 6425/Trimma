"use client";

import { Grid, Map as MapIcon } from "lucide-react";

type ViewMode = "grid" | "map";

type Props = {
  viewMode: ViewMode;
  onChange: (mode: ViewMode) => void;
  className?: string;
};

export function ListingViewToggle({ viewMode, onChange, className = "" }: Props) {
  return (
    <div className={`flex items-center rounded-lg bg-slate-100 p-1 ${className}`}>
      <button
        type="button"
        onClick={() => onChange("grid")}
        aria-pressed={viewMode === "grid"}
        aria-label="Grid view"
        className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition-colors ${
          viewMode === "grid" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-900"
        }`}
      >
        <Grid className="h-4 w-4" />
        Grid
      </button>
      <button
        type="button"
        onClick={() => onChange("map")}
        aria-pressed={viewMode === "map"}
        aria-label="Map view"
        className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition-colors ${
          viewMode === "map" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-900"
        }`}
      >
        <MapIcon className="h-4 w-4" />
        Map
      </button>
    </div>
  );
}
