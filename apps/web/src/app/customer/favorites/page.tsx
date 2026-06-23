"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Heart, MapPin, Star, Scissors, Loader2, AlertTriangle } from "lucide-react";
import { VerifiedSalonBadge } from "../../../components/marketplace/VerifiedSalonBadge";
import { toast } from "sonner";
import {
  fetchCustomerFavoritesPage,
  removeCustomerFavorite,
  type CustomerFavoriteRow,
} from "@/app/actions/customer-dashboard-data";
import { withTimeout } from "@/lib/promise-timeout";
import { mapSalonRowToUI } from "@/lib/salons-mapper";
import { useSalonFavorites } from "@/hooks/useSalonFavorites";
import { customerBtnClass } from "@/lib/customer-dashboard-ui";

function FavoritesContent() {
  const router = useRouter();
  const { refreshFavorites } = useSalonFavorites();
  const [favorites, setFavorites] = useState<CustomerFavoriteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchFavorites = useCallback(async () => {
    setLoadError(null);
    try {
      const result = await withTimeout(
        fetchCustomerFavoritesPage(),
        20000,
        "Loading timed out. Refresh the page."
      );

      if (result.success === false) {
        if (result.error.includes("sign in") || result.error.includes("session expired")) {
          router.replace("/login?redirectTo=/customer/favorites");
          return;
        }
        setLoadError(result.error);
        setFavorites([]);
        return;
      }

      setFavorites(result.favorites);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not load your favorite salons.";
      setLoadError(message);
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void Promise.resolve().then(() => {
      void fetchFavorites();
    });
  }, [fetchFavorites]);

  const handleRemove = async (favoriteId: string, salonName: string) => {
    setRemovingId(favoriteId);
    try {
      const result = await removeCustomerFavorite(favoriteId);
      if (result.success === false) throw new Error(result.error);

      setFavorites((prev) => prev.filter((f) => f.id !== favoriteId));
      await refreshFavorites();
      toast.success(`Removed ${salonName} from favorites`, { position: "top-center" });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Could not remove favorite.";
      toast.error(message, { position: "top-center" });
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-zinc-900 tracking-tight">Favorite Salons</h1>
          <p className="text-sm text-zinc-500 mt-1">Your saved go-to salons for quick booking.</p>
        </div>

        <Link
          href="/"
          className={`${customerBtnClass} text-xs h-10 px-4 gap-2`}
        >
          <Scissors className="w-4 h-4 mr-2" />
          Discover Salons
        </Link>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-[#ffc800]" />
          <p className="text-sm text-zinc-400 font-bold">Loading your favorites...</p>
        </div>
      ) : loadError ? (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-amber-200 text-sm">Favorites unavailable</h3>
            <p className="text-xs text-amber-100/80 mt-1 leading-relaxed">{loadError}</p>
          </div>
        </div>
      ) : favorites.length === 0 ? (
        <div className="bg-white rounded-3xl border border-zinc-200 p-10 md:p-16 text-center max-w-xl mx-auto mt-8 shadow-sm">
          <Heart className="w-16 h-16 mx-auto mb-4 text-zinc-400 stroke-[1.5]" />
          <h3 className="text-lg font-bold text-zinc-900">No favorite salons yet</h3>
          <p className="text-sm text-zinc-500 mt-2 max-w-sm mx-auto leading-relaxed">
            Browse salons and save your favourites here for faster rebooking.
          </p>
          <Link
            href="/"
            className={`${customerBtnClass} mt-6 px-6 py-2.5`}
          >
            Explore Salons
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {favorites.map((favorite, idx) => {
            const salon = favorite.salons;
            if (!salon) return null;

            const ui = mapSalonRowToUI(salon, idx);
            const linkTarget = `/salons/${salon.slug || salon.id}`;

            return (
              <div
                key={favorite.id}
                className="bg-white rounded-2xl border border-zinc-200 overflow-hidden hover:border-[#ffc800]/50 transition-all shadow-sm"
              >
                <div className="relative h-44 bg-zinc-100">
                  <Image
                    src={ui.image}
                    alt={ui.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/60 to-transparent" />
                  <button
                    type="button"
                    disabled={removingId === favorite.id}
                    onClick={() => handleRemove(favorite.id, ui.name)}
                    className="absolute top-3 right-3 p-2 rounded-full bg-white/80 backdrop-blur-md text-red-500 hover:bg-white border border-white transition-colors disabled:opacity-50"
                    aria-label={`Remove ${ui.name} from favorites`}
                  >
                    <Heart className="w-5 h-5 fill-current" />
                  </button>
                  {ui.isVerified && (
                    <div className="absolute top-3 left-3">
                      <VerifiedSalonBadge size="xs" />
                    </div>
                  )}
                </div>

                <div className="p-5 space-y-3">
                  <div>
                    <Link href={linkTarget} className="font-extrabold text-zinc-900 text-lg hover:text-[#ffc800] transition-colors">
                      {ui.name}
                    </Link>
                    <div className="flex items-center gap-3 text-xs text-zinc-500 mt-1.5">
                      <span className="inline-flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-[#ffc800] fill-[#ffc800]" />
                        <span className="font-bold text-zinc-700">{ui.rating}</span>
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#ffc800]/80" />
                        {ui.location}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-zinc-200">
                    <div className="text-xs text-zinc-500">
                      From <span className="text-zinc-900 font-bold">LKR {ui.startingPrice.toLocaleString()}</span>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        href={linkTarget}
                        className={`${customerBtnClass} rounded-lg text-xs h-9 px-3`}
                      >
                        View
                      </Link>
                      <Link
                        href={`${linkTarget}?action=book`}
                        className={`${customerBtnClass} rounded-lg text-xs h-9 px-4`}
                      >
                        Book
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function CustomerFavoritesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[50vh] text-zinc-400">
          Loading favorites...
        </div>
      }
    >
      <FavoritesContent />
    </Suspense>
  );
}
