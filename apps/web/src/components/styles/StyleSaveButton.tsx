"use client";

import { Bookmark, Loader2 } from "lucide-react";
import { useSavedStyles } from "@/hooks/useSavedStyles";

type StyleSaveButtonProps = {
  styleId: string;
  styleTitle?: string;
  variant?: "overlay" | "inline";
  className?: string;
};

export function StyleSaveButton({
  styleId,
  styleTitle,
  variant = "overlay",
  className = "",
}: StyleSaveButtonProps) {
  const { isSaved, toggleSavedStyle, togglingId, loading } = useSavedStyles();
  const saved = isSaved(styleId);
  const busy = loading || togglingId === styleId;

  const baseClass =
    variant === "overlay"
      ? "absolute top-3 right-3 p-2 backdrop-blur-md rounded-full border z-10 transition-colors disabled:opacity-60"
      : "inline-flex items-center justify-center p-2 rounded-lg border transition-colors disabled:opacity-60";

  const stateClass =
    variant === "overlay"
      ? saved
        ? "bg-[#ffc800] text-black border-[#ffc800] shadow-sm"
        : "bg-black/40 text-white border-white/20 hover:bg-black/60"
      : saved
        ? "bg-[#ffc800]/15 text-[#ffc800] border-[#ffc800]/30"
        : "bg-white/5 text-zinc-300 border-white/10 hover:bg-white/10";

  return (
    <button
      type="button"
      disabled={busy}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void toggleSavedStyle(styleId, styleTitle);
      }}
      className={`${baseClass} ${stateClass} ${className}`}
      aria-label={saved ? "Remove from saved styles" : "Save style"}
      aria-pressed={saved}
    >
      {busy && togglingId === styleId ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <Bookmark className={`w-5 h-5 ${saved ? "fill-current" : ""}`} />
      )}
    </button>
  );
}
