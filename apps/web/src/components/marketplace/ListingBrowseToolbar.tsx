"use client";

import type { ReactNode } from "react";
import { ListingViewToggle } from "./ListingViewToggle";

type ViewMode = "grid" | "map";

type Props = {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  count: number;
  countLabel?: string;
  trailing?: ReactNode;
};

export function ListingBrowseToolbar({
  viewMode,
  onViewModeChange,
  count,
  countLabel = "businesses",
  trailing,
}: Props) {
  return (
    <div className="sticky top-16 z-40 border-b border-slate-200 bg-white/80 shadow-sm backdrop-blur-xl">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4">
        <p className="text-sm font-semibold text-zinc-800">
          <span className="font-black text-zinc-900">{count}</span> {countLabel}
        </p>
        <div className="flex items-center gap-3">
          <ListingViewToggle viewMode={viewMode} onChange={onViewModeChange} />
          {trailing}
        </div>
      </div>
    </div>
  );
}
