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

type SavedStylesContextValue = {
  savedStyleIds: Set<string>;
  loading: boolean;
  togglingId: string | null;
  isSaved: (styleId: string) => boolean;
  toggleSavedStyle: (styleId: string, styleTitle?: string) => Promise<boolean>;
  refreshSavedStyles: () => Promise<void>;
};

const SavedStylesContext = createContext<SavedStylesContextValue | null>(null);

export function SavedStylesProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [savedStyleIds, setSavedStyleIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const loadSavedStyles = useCallback(async (uid: string) => {
    const { data, error } = await supabase
      .from("customer_saved_styles")
      .select("style_id")
      .eq("user_id", uid);

    if (error) {
      console.error("Failed to load saved styles:", error);
      setSavedStyleIds(new Set());
      return;
    }

    setSavedStyleIds(new Set((data || []).map((row) => row.style_id)));
  }, []);

  const refreshSavedStyles = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await loadSavedStyles(session.user.id);
    } else {
      setSavedStyleIds(new Set());
    }
  }, [loadSavedStyles]);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;

      if (session?.user) {
        await loadSavedStyles(session.user.id);
      } else {
        setSavedStyleIds(new Set());
      }
      setLoading(false);
    };

    void init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;

      if (session?.user) {
        await loadSavedStyles(session.user.id);
      } else {
        setSavedStyleIds(new Set());
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadSavedStyles]);

  const isSaved = useCallback(
    (styleId: string) => savedStyleIds.has(styleId),
    [savedStyleIds]
  );

  const toggleSavedStyle = useCallback(
    async (styleId: string, styleTitle?: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        const redirectTo = encodeURIComponent(
          typeof window !== "undefined"
            ? window.location.pathname + window.location.search
            : "/styles"
        );
        router.push(`/login?redirectTo=${redirectTo}`);
        return false;
      }

      const uid = session.user.id;
      const wasSaved = savedStyleIds.has(styleId);

      setTogglingId(styleId);
      try {
        if (wasSaved) {
          const { error } = await supabase
            .from("customer_saved_styles")
            .delete()
            .eq("user_id", uid)
            .eq("style_id", styleId);
          if (error) throw error;

          setSavedStyleIds((prev) => {
            const next = new Set(prev);
            next.delete(styleId);
            return next;
          });
          toast.success(`Removed "${styleTitle || "style"}" from saved styles`, {
            position: "top-center",
          });
        } else {
          const { error } = await supabase
            .from("customer_saved_styles")
            .insert({ user_id: uid, style_id: styleId });
          if (error) throw error;

          setSavedStyleIds((prev) => new Set(prev).add(styleId));
          toast.success(`Saved "${styleTitle || "style"}" to your collection`, {
            position: "top-center",
          });
        }
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Could not update saved style.";
        toast.error(message, { position: "top-center" });
        return false;
      } finally {
        setTogglingId(null);
      }
    },
    [savedStyleIds, router]
  );

  const value = useMemo(
    () => ({
      savedStyleIds,
      loading,
      togglingId,
      isSaved,
      toggleSavedStyle,
      refreshSavedStyles,
    }),
    [savedStyleIds, loading, togglingId, isSaved, toggleSavedStyle, refreshSavedStyles]
  );

  return (
    <SavedStylesContext.Provider value={value}>{children}</SavedStylesContext.Provider>
  );
}

export function useSavedStyles() {
  const ctx = useContext(SavedStylesContext);
  if (!ctx) {
    throw new Error("useSavedStyles must be used within SavedStylesProvider");
  }
  return ctx;
}
