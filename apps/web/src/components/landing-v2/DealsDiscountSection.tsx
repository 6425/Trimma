"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Gift, Loader2, Percent } from "lucide-react";
import { supabase } from "../../config/supabase";
import {
  fetchPublicDeals,
  getDealDiscountPercent,
  getDealLocationLabel,
  pickTopDiscountDeals,
  type SalonDealRow,
} from "@/lib/deals";
import { PromotionPackageIncludes } from "../marketplace/PromotionPackageIncludes";

const LANDING_DEAL_LIMIT = 8;

type Props = {
  /** Server-fetched deals — skips client loading when provided. */
  initialDeals?: SalonDealRow[];
};

export function DealsDiscountSection({ initialDeals }: Props) {
  const [deals, setDeals] = useState<SalonDealRow[]>(initialDeals ?? []);
  const [loading, setLoading] = useState(initialDeals === undefined);

  useEffect(() => {
    if (initialDeals !== undefined) return;

    let cancelled = false;

    async function loadDeals() {
      try {
        const normalized = await fetchPublicDeals(supabase);
        if (!cancelled) setDeals(normalized);
      } catch {
        if (!cancelled) setDeals([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadDeals();
    return () => {
      cancelled = true;
    };
  }, [initialDeals]);

  const displayDeals = useMemo(
    () => pickTopDiscountDeals(deals, LANDING_DEAL_LIMIT),
    [deals]
  );

  if (!loading && displayDeals.length === 0) {
    return null;
  }

  return (
    <section id="deals-discount" className="py-12 bg-zinc-50 border-t border-zinc-200 scroll-mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200 font-extrabold text-[10px] tracking-wider uppercase px-3 py-1 rounded-full mb-2">
              <Gift className="w-3.5 h-3.5" />
              Available deals
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900">
              Deals &amp; Discounts
            </h2>
            <p className="text-zinc-500 text-sm font-medium mt-1">
              Live promotion packages from Trimma salon partners — book directly from each salon page.
            </p>
          </div>
          {deals.length > 0 ? (
            <Link
              href="/deals"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-zinc-900 hover:text-brand transition-colors shrink-0"
            >
              View all deals
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : null}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-zinc-500">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            Loading deals…
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {displayDeals.map((deal) => {
              const salon = deal.salon;
              if (!salon?.slug) return null;

              const discount = getDealDiscountPercent(deal);

              return (
                <Link
                  key={deal.id}
                  href={`/salons/${salon.slug}`}
                  className="bg-[#ffde5a] rounded-3xl border border-amber-500/50 shadow-md shadow-amber-200/60 overflow-hidden flex flex-col group hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="relative h-36 w-full bg-black/5 shrink-0">
                    {deal.image_url ? (
                      <Image
                        src={deal.image_url}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, 25vw"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Gift className="w-10 h-10 text-zinc-900/30" />
                      </div>
                    )}
                  </div>
                  <div className="p-6 relative min-h-[120px]">
                    <div className="absolute top-4 right-4 bg-black/10 backdrop-blur-sm px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 text-zinc-950">
                      <Percent className="w-3 h-3" />
                      {discount > 0 ? `${discount}% OFF` : "Deal"}
                    </div>
                    <h3 className="text-lg font-black leading-tight pr-16 text-zinc-950">{deal.name}</h3>
                    <p className="text-zinc-800 text-xs font-bold mt-2">{salon.name}</p>
                  </div>

                  <div className="px-5 pb-5 flex flex-col flex-1">
                    {deal.description ? (
                      <p className="text-zinc-800 text-xs leading-relaxed mb-3 font-medium">
                        {deal.description}
                      </p>
                    ) : null}
                    <PromotionPackageIncludes
                      services={deal.included_services}
                      variant="chips"
                      className="mb-3"
                    />
                    <p className="text-[11px] text-zinc-700 mb-3">{getDealLocationLabel(salon)}</p>
                    <div className="mt-auto flex items-end justify-between pt-3 border-t border-black/10">
                      <div>
                        <p className="text-base font-black text-zinc-950">
                          LKR {deal.package_price.toLocaleString()}
                        </p>
                        {deal.original_price > deal.package_price ? (
                          <p className="text-xs text-zinc-700 line-through">
                            LKR {deal.original_price.toLocaleString()}
                          </p>
                        ) : null}
                      </div>
                      <span className="text-[11px] font-bold text-zinc-950 bg-black/10 px-2.5 py-1 rounded-lg group-hover:bg-zinc-950 group-hover:text-white transition-colors">
                        View salon
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {!loading && deals.length > LANDING_DEAL_LIMIT ? (
          <div className="flex justify-center mt-8">
            <Link
              href="/deals"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 text-white font-bold text-sm px-6 py-3 hover:bg-zinc-800 transition-colors min-h-11"
            >
              See all {deals.length} deals
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  );
}
