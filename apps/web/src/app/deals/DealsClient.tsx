"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Gift, LayoutGrid, MapPin, Search, Sparkles, Tag } from "lucide-react";
import {
  getDealLocationKey,
  getDealLocationLabel,
  groupDealsByLocation,
  type CategoryOption,
  type SalonDealRow,
} from "@/lib/deals";
import { formatDisplayDate } from "@/lib/promotion-package-dates";
import { GlobalServiceIconPreview } from "../../components/admin/GlobalServiceIconUpload";
import { PromotionPackageIncludes } from "../../components/marketplace/PromotionPackageIncludes";

const dealIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutGrid,
  Gift,
  Tag,
};

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
    <div className="bg-white text-zinc-900 min-h-screen">
      {/* Hero */}
      <section className="page-hero-shell home-hero home-hero-split relative min-h-[500px]">
        <img
          src="/assets/deals-hero.webp"
          alt=""
          width={1920}
          height={500}
          decoding="async"
          fetchPriority="high"
          className="home-hero-bg-image absolute inset-0 w-full h-full object-cover pointer-events-none"
        />
        <div className="home-hero-left-overlay absolute inset-0 hidden lg:block pointer-events-none" aria-hidden="true" />
        <div className="home-hero-mobile-overlay lg:hidden absolute inset-0 pointer-events-none" aria-hidden="true" />

        <div className="container relative z-10 mx-auto max-w-7xl">
          <div className="home-hero-content-col home-hero-content hero-ink text-left w-full lg:w-1/2 flex flex-col justify-center p-[3%]">
            <div className="home-hero-top">
              <div className="hero-badge hero-eyebrow inline-flex items-center gap-2 px-4 py-1.5 mb-6">
                <Gift className="w-3.5 h-3.5" />
                Salon Deals &amp; Packages
              </div>

              <h1 className="home-hero-title text-3xl sm:text-4xl md:text-5xl xl:text-5xl font-black tracking-tight">
                <span className="home-hero-title-line">Salon</span>
                <span className="home-hero-title-accent underline decoration-[#ffde5a] decoration-4 underline-offset-4">
                  Deals
                </span>
              </h1>

              <p className="text-sm sm:text-base md:text-lg font-medium max-w-lg leading-relaxed">
                Promotion packages published by salon owners, browsable by location and category.
              </p>
            </div>

            <div className="home-hero-middle">
              <div className="flex flex-col sm:flex-row gap-4">
                <a href="#deals-results" className="hero-btn-primary px-8 py-4 rounded-2xl">
                  Browse Deals
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filters + Results */}
      <section id="deals-results" className="pb-24 pt-16 lg:pt-20 scroll-mt-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 space-y-8">
          {/* Filter bar */}
          <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-4">
            <label className="block">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Location</span>
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="mt-2 w-full h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition appearance-none cursor-pointer"
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
                className="mt-2 w-full h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition appearance-none cursor-pointer"
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
              <div className="mt-2 flex items-center h-11 rounded-xl border border-zinc-200 bg-white px-3 focus-within:ring-2 focus-within:ring-amber-400 focus-within:border-transparent transition">
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

          {/* Count */}
          <p className="text-sm font-semibold text-zinc-600">
            <span className="text-amber-600 font-black text-lg mr-1">{filteredDeals.length}</span>
            deal{filteredDeals.length === 1 ? "" : "s"} found
          </p>

          {filteredDeals.length === 0 ? (
            <div className="bg-zinc-50 border border-zinc-200 rounded-3xl p-14 text-center">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-5">
                <Sparkles className="w-7 h-7 text-amber-500" />
              </div>
              <p className="text-zinc-800 font-bold text-lg">No deals match your filters.</p>
              <p className="text-sm text-zinc-500 mt-2 max-w-md mx-auto leading-relaxed">
                Try another location or category, or check back when salon owners publish new packages.
              </p>
            </div>
          ) : (
            <div className="space-y-12">
              {Object.entries(groupedDeals).map(([location, locationDeals]) => (
                <section key={location}>
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                      <MapPin className="w-4 h-4 text-amber-600" />
                    </div>
                    <h2 className="text-xl font-extrabold text-zinc-950">{location}</h2>
                    <span className="text-xs font-semibold text-zinc-400 bg-zinc-100 px-2.5 py-1 rounded-full">
                      {locationDeals.length} deal{locationDeals.length === 1 ? "" : "s"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {locationDeals.map((deal) => {
                      const salon = deal.salon!;
                      const hasDiscount = deal.original_price > deal.package_price;

                      return (
                        <article
                          key={deal.id}
                          className="group bg-[#ffde5a] border border-amber-500/50 rounded-3xl p-6 shadow-md shadow-amber-200/60 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                        >
                          <div className="flex flex-col gap-4">
                            <div className="flex items-start gap-4 min-w-0">
                              <GlobalServiceIconPreview
                                iconImageUrl={deal.image_url}
                                iconMap={dealIconMap}
                                iconName="Gift"
                                className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border border-black/10"
                              />
                              <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                <h3 className="text-base font-bold text-zinc-950 group-hover:text-black transition-colors">
                                  {deal.name}
                                </h3>
                                {salon.category ? (
                                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-black/10 border border-black/15 text-zinc-900">
                                    {salon.category}
                                  </span>
                                ) : null}
                              </div>

                              <p className="text-sm text-zinc-800">
                                <Link
                                  href={`/salons/${salon.slug}`}
                                  className="font-semibold text-zinc-950 hover:text-black transition-colors underline-offset-2 hover:underline"
                                >
                                  {salon.name}
                                </Link>
                                {" · "}
                                <span className="text-zinc-700">{getDealLocationLabel(salon)}</span>
                              </p>

                              {deal.description ? (
                                <p className="text-sm text-zinc-800 mt-3 leading-relaxed">
                                  {deal.description}
                                </p>
                              ) : null}

                              <PromotionPackageIncludes
                                services={deal.included_services}
                                className="mt-3"
                              />

                              {(deal.start_date || deal.end_date) && (
                                <p className="text-xs text-zinc-700 mt-2 font-medium">
                                  Valid{" "}
                                  {deal.start_date ? formatDisplayDate(deal.start_date) : "now"}
                                  {deal.end_date ? ` – ${formatDisplayDate(deal.end_date)}` : ""}
                                </p>
                              )}
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-black/10">
                              <div>
                                <p className="text-xl font-black text-zinc-950">
                                  LKR {deal.package_price.toLocaleString()}
                                </p>
                                {hasDiscount ? (
                                  <p className="text-xs text-zinc-700 line-through font-medium">
                                    LKR {deal.original_price.toLocaleString()}
                                  </p>
                                ) : null}
                              </div>
                              <Link
                                href={`/salons/${salon.slug}`}
                                className="inline-flex items-center gap-1.5 bg-zinc-950 hover:bg-black text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-all hover:scale-[1.02] shadow-sm"
                              >
                                View salon
                                <ArrowRight className="w-3.5 h-3.5" />
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
      </section>
    </div>
  );
}
