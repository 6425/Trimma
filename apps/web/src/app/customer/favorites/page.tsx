"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Heart, MapPin, Star, Scissors, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "../../../config/supabase";
import { mapSalonRowToUI } from "@/lib/salons-mapper";
import { useSalonFavorites } from "@/hooks/useSalonFavorites";

type FavoriteRow = {
  id: string;
  created_at: string;
  salons: {
    id: string;
    name: string;
    slug: string;
    city: string | null;
    district: string | null;
    cover_url: string | null;
    logo_url: string | null;
    rating: number | null;
    is_verified: boolean | null;
    category: string | null;
    services?: { price: number; category?: string; name?: string }[];
  } | null;
};

function FavoritesContent() {
  const router = useRouter();
  const { refreshFavorites } = useSalonFavorites();
  const [favorites, setFavorites] = useState<FavoriteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchFavorites = async () => {
    setLoadError(null);
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      router.replace("/login?redirectTo=/customer/favorites");
      return;
    }

    const { data, error } = await supabase
      .from("customer_favorite_salons")
      .select(`
        id,
        created_at,
        salons (
          id,
          name,
          slug,
          city,
          district,
          cover_url,
          logo_url,
          rating,
          is_verified,
          category,
          services ( price, category, name )
        )
      `)
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to load favorites:", error);
      if (error.message.includes("customer_favorite_salons") || error.code === "42P01") {
        setLoadError(
          "Favorites storage is not set up yet. Ask your admin to run packages/db/CUSTOMER_FAVORITES_PATCH.sql in Supabase."
        );
      } else {
        setLoadError(error.message || "Could not load your favorite salons.");
      }
      setFavorites([]);
    } else {
      setFavorites((data as unknown as FavoriteRow[]) || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    void Promise.resolve().then(() => {
      void fetchFavorites();
    });
  }, []);

  const handleRemove = async (favoriteId: string, salonName: string) => {
    setRemovingId(favoriteId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase
        .from("customer_favorite_salons")
        .delete()
        .eq("id", favoriteId)
        .eq("user_id", session.user.id);

      if (error) throw error;

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Favorite Salons</h1>
          <p className="text-sm text-zinc-400 mt-1">Your saved go-to salons for quick booking.</p>
        </div>

        <Link
          href="/salons"
          className="inline-flex shrink-0 items-center justify-center bg-[#F5B700] hover:bg-[#F5B700]/90 text-black rounded-xl font-bold text-xs h-10 px-4 transition-all"
        >
          <Scissors className="w-4 h-4 mr-2" />
          Discover Salons
        </Link>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-[#F5B700]" />
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
        <div className="bg-zinc-900/50 rounded-3xl border border-white/10 p-10 md:p-16 text-center max-w-xl mx-auto mt-8 shadow-sm backdrop-blur-sm">
          <Heart className="w-16 h-16 mx-auto mb-4 text-zinc-600 stroke-[1.5]" />
          <h3 className="text-lg font-bold text-white">No favorite salons yet</h3>
          <p className="text-sm text-zinc-400 mt-2 max-w-sm mx-auto leading-relaxed">
            Browse salons and save your favourites here for faster rebooking.
          </p>
          <Link
            href="/salons"
            className="inline-flex mt-6 bg-[#F5B700] hover:bg-[#F5B700]/90 text-black rounded-xl font-bold px-6 py-2.5 transition-all"
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
                className="bg-zinc-900/50 rounded-2xl border border-white/10 overflow-hidden hover:border-[#F5B700]/30 transition-all backdrop-blur-sm"
              >
                <div className="relative h-44 bg-zinc-800">
                  <Image
                    src={ui.image}
                    alt={ui.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 to-transparent" />
                  <button
                    type="button"
                    disabled={removingId === favorite.id}
                    onClick={() => handleRemove(favorite.id, ui.name)}
                    className="absolute top-3 right-3 p-2 rounded-full bg-black/40 backdrop-blur-md text-[#F5B700] hover:bg-black/60 border border-white/10 transition-colors disabled:opacity-50"
                    aria-label={`Remove ${ui.name} from favorites`}
                  >
                    <Heart className="w-5 h-5 fill-current" />
                  </button>
                  {ui.isVerified && (
                    <Badge className="absolute top-3 left-3 bg-[#F5B700]/90 text-black border-none text-[10px] font-black uppercase">
                      Verified
                    </Badge>
                  )}
                </div>

                <div className="p-5 space-y-3">
                  <div>
                    <Link href={linkTarget} className="font-extrabold text-white text-lg hover:text-[#F5B700] transition-colors">
                      {ui.name}
                    </Link>
                    <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1.5">
                      <span className="inline-flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        {ui.rating}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#F5B700]/70" />
                        {ui.location}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-white/10">
                    <div className="text-xs text-zinc-400">
                      From <span className="text-white font-bold">LKR {ui.startingPrice.toLocaleString()}</span>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        href={linkTarget}
                        className="inline-flex items-center justify-center rounded-lg border border-white/15 text-zinc-200 text-xs font-bold h-9 px-3 hover:bg-white/5 transition-colors"
                      >
                        View
                      </Link>
                      <Link
                        href={`${linkTarget}?action=book`}
                        className="inline-flex items-center justify-center rounded-lg bg-[#F5B700] text-black text-xs font-bold h-9 px-4 hover:bg-[#F5B700]/90 transition-colors"
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
