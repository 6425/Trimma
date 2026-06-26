import Link from "next/link";
import { Clock, Gift, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CatalogShareMeta } from "@/lib/salon-catalog-share-meta";

type Props = {
  meta: CatalogShareMeta;
  salonName: string;
  salonPageUrl: string;
  kind: "service" | "promo";
  durationMinutes?: number | null;
  category?: string | null;
};

export function SalonCatalogShareCard({
  meta,
  salonName,
  salonPageUrl,
  kind,
  durationMinutes,
  category,
}: Props) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {meta.imageUrl ? (
          <div className="relative aspect-[1.91/1] bg-slate-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={meta.imageUrl} alt={meta.title} className="w-full h-full object-cover" />
          </div>
        ) : null}

        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            {kind === "service" ? <Tag className="w-3.5 h-3.5" /> : <Gift className="w-3.5 h-3.5" />}
            {kind === "service" ? "Salon service" : "Promotion package"}
            <span className="text-slate-300">•</span>
            <span>{salonName}</span>
          </div>

          <div>
            <h1 className="text-2xl font-black text-zinc-900 tracking-tight">{meta.title}</h1>
            {meta.priceLabel ? <p className="text-sm font-bold text-brand mt-1">{meta.priceLabel}</p> : null}
          </div>

          <p className="text-sm text-zinc-600 leading-relaxed">{meta.description}</p>

          {kind === "service" && (durationMinutes || category) ? (
            <div className="flex flex-wrap gap-3 text-xs font-medium text-zinc-500">
              {durationMinutes ? (
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {durationMinutes} mins
                </span>
              ) : null}
              {category ? <span>{category}</span> : null}
            </div>
          ) : null}

          <Link href={salonPageUrl} className="block">
            <Button className="w-full h-11 rounded-xl bg-black text-white hover:bg-zinc-800 font-bold">
              View on Trimma &amp; book
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
