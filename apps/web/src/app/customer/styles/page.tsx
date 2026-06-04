"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Bookmark, Scissors, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import {
  fetchCustomerStylesPage,
  removeCustomerSavedStyle,
  type CustomerSavedStyleRow,
} from "@/app/actions/customer-dashboard-data";
import { withTimeout } from "@/lib/promise-timeout";
import { useSavedStyles } from "@/hooks/useSavedStyles";

function SavedStylesContent() {
  const router = useRouter();
  const { refreshSavedStyles } = useSavedStyles();
  const [saved, setSaved] = useState<CustomerSavedStyleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchSaved = useCallback(async () => {
    setLoadError(null);
    try {
      const result = await withTimeout(
        fetchCustomerStylesPage(),
        20000,
        "Loading timed out. Refresh the page."
      );

      if (result.success === false) {
        if (result.error.includes("sign in") || result.error.includes("session expired")) {
          router.replace("/login?redirectTo=/customer/styles");
          return;
        }
        setLoadError(result.error);
        setSaved([]);
        return;
      }

      setSaved(result.saved);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not load your saved styles.";
      setLoadError(message);
      setSaved([]);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void Promise.resolve().then(() => {
      void fetchSaved();
    });
  }, [fetchSaved]);

  const handleRemove = async (rowId: string, _styleId: string, title: string) => {
    setRemovingId(rowId);
    try {
      const result = await removeCustomerSavedStyle(rowId);
      if (result.success === false) throw new Error(result.error);

      setSaved((prev) => prev.filter((s) => s.id !== rowId));
      await refreshSavedStyles();
      toast.success(`Removed "${title}" from saved styles`, { position: "top-center" });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Could not remove style.";
      toast.error(message, { position: "top-center" });
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-zinc-900 tracking-tight">Saved Styles</h1>
          <p className="text-sm text-zinc-500 mt-1">Your bookmarked looks from the Trimma style gallery.</p>
        </div>

        <Link
          href="/styles"
          className="inline-flex shrink-0 items-center justify-center bg-[#F5B700] hover:bg-[#F5B700]/90 text-black rounded-xl font-bold text-xs h-10 px-4 transition-all"
        >
          <Scissors className="w-4 h-4 mr-2" />
          Browse Latest Styles
        </Link>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-[#F5B700]" />
          <p className="text-sm text-zinc-400 font-bold">Loading your saved styles...</p>
        </div>
      ) : loadError ? (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-amber-200 text-sm">Saved styles unavailable</h3>
            <p className="text-xs text-amber-100/80 mt-1 leading-relaxed">{loadError}</p>
          </div>
        </div>
      ) : saved.length === 0 ? (
        <div className="bg-white rounded-3xl border border-zinc-200 p-10 md:p-16 text-center max-w-xl mx-auto mt-8 shadow-sm">
          <Bookmark className="w-16 h-16 mx-auto mb-4 text-zinc-400 stroke-[1.5]" />
          <h3 className="text-lg font-bold text-zinc-900">No saved styles yet</h3>
          <p className="text-sm text-zinc-500 mt-2 max-w-sm mx-auto leading-relaxed">
            Explore the style lookbook and bookmark cuts you love for your next appointment.
          </p>
          <Link
            href="/styles"
            className="inline-flex mt-6 bg-[#F5B700] hover:bg-[#F5B700]/90 text-black rounded-xl font-bold px-6 py-2.5 transition-all"
          >
            Explore Styles
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
          {saved.map((row) => {
            const style = row.platform_styles;
            if (!style) return null;

            return (
              <div
                key={row.id}
                className="bg-white rounded-2xl border border-zinc-200 overflow-hidden hover:border-[#F5B700]/50 transition-all shadow-sm"
              >
                <div className="relative aspect-[3/4] bg-zinc-100">
                  <Image
                    src={style.image_url}
                    alt={style.title}
                    fill
                    sizes="(max-width: 768px) 50vw, 33vw"
                    className="object-cover"
                  />
                  <button
                    type="button"
                    disabled={removingId === row.id}
                    onClick={() => handleRemove(row.id, style.id, style.title)}
                    className="absolute top-3 right-3 p-2 rounded-full bg-white/80 backdrop-blur-md text-[#F5B700] hover:bg-white border border-white transition-colors disabled:opacity-50"
                    aria-label={`Remove ${style.title} from saved styles`}
                  >
                    <Bookmark className="w-5 h-5 fill-current" />
                  </button>
                </div>
                <div className="p-4 space-y-1">
                  <h3 className="font-extrabold text-zinc-900 text-sm line-clamp-1">{style.title}</h3>
                  {style.categories?.name && (
                    <p className="text-[10px] text-zinc-600 font-medium uppercase tracking-wide">{style.categories.name}</p>
                  )}
                  {style.description && (
                    <p className="text-xs text-zinc-500 line-clamp-2 mt-1">{style.description}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function CustomerStylesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[50vh] text-zinc-400">
          Loading saved styles...
        </div>
      }
    >
      <SavedStylesContent />
    </Suspense>
  );
}
