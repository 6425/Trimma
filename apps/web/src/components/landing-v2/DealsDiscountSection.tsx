"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Gift, Loader2, Percent } from "lucide-react";
import { supabase } from "../../config/supabase";
import {
  getDealDiscountPercent,
  getDealLocationLabel,
  normalizeDealRows,
  pickTopDiscountDeals,
  type DealSalon,
  type SalonDealRow,
} from "@/lib/deals";

export function DealsDiscountSection() {
  const [deals, setDeals] = useState<SalonDealRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadTopDeals() {
      try {
        const { data: packages, error } = await supabase
          .from("salon_promotion_packages")
          .select(
            "id, salon_id, name, description, package_price, original_price, included_services, start_date, end_date, status, promotion_type, promotion_type_id"
          )
          .eq("status", "active")
          .order("created_at", { ascending: false });

        if (error || !packages?.length) {
          if (!cancelled) setDeals([]);
          return;
        }

        const salonIds = [...new Set(packages.map((pkg) => pkg.salon_id).filter(Boolean))];
        let salonsById = new Map<string, DealSalon>();

        if (salonIds.length > 0) {
          const { data: salonRows } = await supabase
            .from("salons")
            .select(
              "id, name, slug, city, district, province, category, logo_url, status, is_verified, public_visibility"
            )
            .in("id", salonIds)
            .or("status.eq.verified,status.eq.active,is_verified.eq.true");

          salonsById = new Map((salonRows || []).map((salon) => [salon.id, salon as DealSalon]));
        }

        const normalized = normalizeDealRows(packages, salonsById);
        if (!cancelled) {
          setDeals(pickTopDiscountDeals(normalized, 4));
        }
      } catch {
        if (!cancelled) setDeals([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadTopDeals();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section id="deals-discount" className="py-12 bg-zinc-50 scroll-mt-24">
      <div className="max-w-7xl mx-auto px-8 lg:px-12">
        <div className="mb-8">
          <div className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200 font-extrabold text-[10px] tracking-wider uppercase px-3 py-1 rounded-full mb-2">
            <Gift className="w-3.5 h-3.5" />
            Exclusive Special Deals
          </div>
          <h2>
            Deals &amp; Discounts
          </h2>
          <p className="text-zinc-500 text-sm font-medium mt-1">
            Top savings on salon services — tap a deal to view the salon and book.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-zinc-500">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            Loading best deals…
          </div>
        ) : deals.length === 0 ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center">
            <p className="text-zinc-700 font-medium">Fresh deals are on the way.</p>
            <p className="text-sm text-zinc-500 mt-1">
              Check the full deals page for promotions from salon partners.
            </p>
            <Link
              href="/deals"
              className="inline-block mt-4 text-sm font-semibold text-[#f9e000] hover:underline"
            >
              Browse all deals
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {deals.map((deal) => {
              const salon = deal.salon;
              if (!salon?.slug) return null;

              const discount = getDealDiscountPercent(deal);
              const serviceLabel =
                deal.included_services[0] ||
                deal.name;

              return (
                <Link
                  key={deal.id}
                  href={`/salons/${salon.slug}`}
                  className="bg-[#f9e000] rounded-3xl border border-amber-500/50 shadow-md shadow-amber-200/60 overflow-hidden flex flex-col group hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="p-6 relative min-h-[140px]">
                    <div className="absolute top-4 right-4 bg-black/10 backdrop-blur-sm px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 text-zinc-950">
                      <Percent className="w-3 h-3" />
                      {discount > 0 ? `${discount}% OFF` : "Deal"}
                    </div>
                    <h3 className="text-lg font-black leading-tight pr-16 text-zinc-950">{deal.name}</h3>
                    <p className="text-zinc-800 text-xs font-bold mt-2">{salon.name}</p>
                  </div>

                  <div className="px-5 pb-5 flex flex-col flex-1">
                    <p className="text-zinc-800 text-xs leading-relaxed mb-3 font-medium line-clamp-2">
                      {deal.description || serviceLabel}
                    </p>
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
      </div>
    </section>
  );
}
