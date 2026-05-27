"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { supabase } from "@/config/supabase";

type SalonFavoritesContextValue = {
  favoriteIds: Set<string>;
  loading: boolean;
  togglingId: string | null;
  isFavorite: (salonId: string) => boolean;
  toggleFavorite: (salonId: string, salonName?: string) => Promise<boolean>;
  refreshFavorites: () => Promise<void>;
};

const SalonFavoritesContext = createContext<SalonFavoritesContextValue | null>(null);

export function SalonFavoritesProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const loadFavorites = useCallback(async (uid: string) => {
    const { data, error } = await supabase
      .from("customer_favorite_salons")
      .select("salon_id")
      .eq("user_id", uid);

    if (error) {
      console.error("Failed to load salon favorites:", error);
      setFavoriteIds(new Set());
      return;
    }

    setFavoriteIds(new Set((data || []).map((row) => row.salon_id)));
  }, []);

  const refreshFavorites = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await loadFavorites(session.user.id);
    } else {
      setFavoriteIds(new Set());
    }
  }, [loadFavorites]);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;

      if (session?.user) {
        await loadFavorites(session.user.id);
      } else {
        setFavoriteIds(new Set());
      }
      setLoading(false);
    };

    const timer = window.setTimeout(() => void init(), 0);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;

      if (session?.user) {
        await loadFavorites(session.user.id);
      } else {
        setFavoriteIds(new Set());
      }
    });

    return () => {
      mounted = false;
      window.clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, [loadFavorites]);

  const isFavorite = useCallback(
    (salonId: string) => favoriteIds.has(salonId),
    [favoriteIds]
  );

  const toggleFavorite = useCallback(
    async (salonId: string, salonName?: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        const redirectTo = encodeURIComponent(
          typeof window !== "undefined"
            ? window.location.pathname + window.location.search
            : "/salons"
        );
        router.push(`/login?redirectTo=${redirectTo}`);
        return false;
      }

      const uid = session.user.id;
      const wasFavorite = favoriteIds.has(salonId);

      setTogglingId(salonId);
      try {
        if (wasFavorite) {
          const { error } = await supabase
            .from("customer_favorite_salons")
            .delete()
            .eq("user_id", uid)
            .eq("salon_id", salonId);
          if (error) throw error;

          setFavoriteIds((prev) => {
            const next = new Set(prev);
            next.delete(salonId);
            return next;
          });
          toast.success(`Removed ${salonName || "salon"} from favorites`, {
            position: "top-center",
          });
        } else {
          const { error } = await supabase
            .from("customer_favorite_salons")
            .insert({ user_id: uid, salon_id: salonId });
          if (error) throw error;

          setFavoriteIds((prev) => new Set(prev).add(salonId));
          toast.success(`Saved ${salonName || "salon"} to favorites`, {
            position: "top-center",
          });
        }
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Could not update favorite.";
        toast.error(message, { position: "top-center" });
        return false;
      } finally {
        setTogglingId(null);
      }
    },
    [favoriteIds, router]
  );

  const value = useMemo(
    () => ({
      favoriteIds,
      loading,
      togglingId,
      isFavorite,
      toggleFavorite,
      refreshFavorites,
    }),
    [favoriteIds, loading, togglingId, isFavorite, toggleFavorite, refreshFavorites]
  );

  return (
    <SalonFavoritesContext.Provider value={value}>{children}</SalonFavoritesContext.Provider>
  );
}

export function useSalonFavorites() {
  const ctx = useContext(SalonFavoritesContext);
  if (!ctx) {
    throw new Error("useSalonFavorites must be used within SalonFavoritesProvider");
  }
  return ctx;
}
