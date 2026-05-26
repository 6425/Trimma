"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { MapPin, Search } from "lucide-react";
import {
  getDealLocationKey,
  getDealLocationLabel,
  groupDealsByLocation,
  type CategoryOption,
  type SalonDealRow,
} from "@/lib/deals";
import { formatDisplayDate } from "@/lib/promotion-package-dates";

type Props = {
  deals: SalonDealRow[];
  categories: CategoryOption[];
  locations: string[];
};

export default function DealsClient({ deals, categories, locations }: Props) {
  const [locationFilter, setLocationFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredDeals = useMemo(() => {
    return deals.filter((deal) => {
      const locationKey = getDealLocationKey(deal.salon);
      const salonCategory = (deal.salon?.category || "").trim();

      const matchesLocation =
        locationFilter === "all" || locationKey.toLowerCase() === locationFilter.toLowerCase();

      const matchesCategory =
        categoryFilter === "all" ||
        salonCategory.toLowerCase() === categoryFilter.toLowerCase() ||
        categories.some(
          (cat) =>
            cat.slug === categoryFilter &&
            salonCategory.toLowerCase() === cat.name.toLowerCase()
        );

      const haystack = [
        deal.name,
        deal.description,
        deal.salon?.name,
        salonCategory,
        getDealLocationLabel(deal.salon),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesLocation && matchesCategory && haystack.includes(searchQuery.toLowerCase());
    });
  }, [deals, categories, locationFilter, categoryFilter, searchQuery]);

  const groupedDeals = useMemo(() => groupDealsByLocation(filteredDeals), [filteredDeals]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-16">
      <div className="border-b border-slate-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <h1 className="text-2xl md:text-3xl font-bold text-zinc-900">Deals</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Promotion packages published by salon owners, browsable by location and category.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label className="block">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Location</span>
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="mt-1 w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-zinc-900"
            >
              <option value="all">All locations</option>
              {locations.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Category</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="mt-1 w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-zinc-900"
            >
              <option value="all">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Search</span>
            <div className="mt-1 flex items-center h-10 rounded-lg border border-slate-200 bg-white px-3">
              <Search className="w-4 h-4 text-zinc-400 mr-2 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Deal or salon name"
                className="w-full bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
              />
            </div>
          </label>
        </div>

        <p className="text-sm text-zinc-500">
          {filteredDeals.length} deal{filteredDeals.length === 1 ? "" : "s"} found
        </p>

        {filteredDeals.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
            <p className="text-zinc-700 font-medium">No deals match your filters.</p>
            <p className="text-sm text-zinc-500 mt-1">
              Try another location or category, or check back when salon owners publish new packages.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedDeals).map(([location, locationDeals]) => (
              <section key={location}>
                <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-zinc-400" />
                  {location}
                </h2>

                <div className="space-y-3">
                  {locationDeals.map((deal) => {
                    const salon = deal.salon!;
                    const hasDiscount = deal.original_price > deal.package_price;

                    return (
                      <article
                        key={deal.id}
                        className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <h3 className="text-base font-semibold text-zinc-900">{deal.name}</h3>
                              {salon.category ? (
                                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600">
                                  {salon.category}
                                </span>
                              ) : null}
                            </div>

                            <p className="text-sm text-zinc-600">
                              <Link href={`/salons/${salon.slug}`} className="font-medium text-zinc-800 hover:underline">
                                {salon.name}
                              </Link>
                              {" · "}
                              {getDealLocationLabel(salon)}
                            </p>

                            {deal.description ? (
                              <p className="text-sm text-zinc-500 mt-2 line-clamp-2">{deal.description}</p>
                            ) : null}

                            {deal.included_services.length > 0 ? (
                              <p className="text-xs text-zinc-500 mt-2">
                                Includes: {deal.included_services.slice(0, 4).join(", ")}
                                {deal.included_services.length > 4 ? "…" : ""}
                              </p>
                            ) : null}

                            {(deal.start_date || deal.end_date) && (
                              <p className="text-xs text-zinc-400 mt-2">
                                Valid{" "}
                                {deal.start_date ? formatDisplayDate(deal.start_date) : "now"}
                                {deal.end_date ? ` – ${formatDisplayDate(deal.end_date)}` : ""}
                              </p>
                            )}
                          </div>

                          <div className="sm:text-right shrink-0">
                            <p className="text-lg font-bold text-zinc-900">
                              LKR {deal.package_price.toLocaleString()}
                            </p>
                            {hasDiscount ? (
                              <p className="text-xs text-zinc-400 line-through">
                                LKR {deal.original_price.toLocaleString()}
                              </p>
                            ) : null}
                            <Link
                              href={`/salons/${salon.slug}`}
                              className="inline-block mt-3 text-sm font-semibold text-brand-pink hover:underline"
                            >
                              View salon
                            </Link>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
