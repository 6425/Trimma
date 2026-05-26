"use client";

import { Heart, Loader2 } from "lucide-react";
import { useSalonFavorites } from "@/hooks/useSalonFavorites";

type SalonFavoriteButtonProps = {
  salonId: string;
  salonName?: string;
  variant?: "overlay" | "hero";
  className?: string;
};

export function SalonFavoriteButton({
  salonId,
  salonName,
  variant = "overlay",
  className = "",
}: SalonFavoriteButtonProps) {
  const { isFavorite, toggleFavorite, togglingId, loading } = useSalonFavorites();
  const favorited = isFavorite(salonId);
  const busy = loading || togglingId === salonId;

  const baseClass =
    variant === "overlay"
      ? "absolute top-4 right-4 p-2 backdrop-blur-md rounded-full border z-20 transition-colors disabled:opacity-60"
      : "inline-flex items-center justify-center p-2.5 rounded-xl border transition-colors disabled:opacity-60";

  const stateClass =
    variant === "overlay"
      ? favorited
        ? "bg-white text-red-500 border-white shadow-sm hover:bg-white"
        : "bg-white/20 text-white border-white/20 hover:bg-white hover:text-red-500"
      : favorited
        ? "bg-red-500/10 text-red-500 border-red-500/30 hover:bg-red-500/15"
        : "bg-white/5 text-white border-white/10 hover:bg-white/10 hover:text-red-400";

  return (
    <button
      type="button"
      disabled={busy}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void toggleFavorite(salonId, salonName);
      }}
      className={`${baseClass} ${stateClass} ${className}`}
      aria-label={favorited ? "Remove from favorites" : "Save to favorites"}
      aria-pressed={favorited}
    >
      {busy && togglingId === salonId ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <Heart className={`w-5 h-5 ${favorited ? "fill-current" : ""}`} />
      )}
    </button>
  );
}
