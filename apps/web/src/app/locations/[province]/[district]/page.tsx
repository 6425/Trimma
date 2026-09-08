"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { DistrictDetailTemplate, DistrictData } from "../../../../components/marketplace/DistrictDetailTemplate";
import type { BusinessListingCardData } from "@/lib/business-listing-mapper";
import { mergeListingSectionCards } from "../../../../components/marketplace/ListingResultsSections";
import { YOU_MAY_ALSO_LIKE_COUNT } from "@/lib/listing-marketplace-rank";
import {
  buildCityCards,
  getDistrictBySlugs,
  normalizeProvinceSlug,
  SRI_LANKA_PROVINCES,
} from "@/lib/sri-lanka-locations";

type ListingSearchResponse = {
  listings?: BusinessListingCardData[];
  featured?: BusinessListingCardData[];
  topRated?: BusinessListingCardData[];
  hasMore?: boolean;
  totalCount?: number;
  error?: string;
};

export default function DistrictDetailPage() {
  const { province, district } = useParams();
  const provinceSlug = normalizeProvinceSlug(String(province || "western"));
  const districtSlug = String(district || "colombo");

  return <DistrictListingsPage key={`${provinceSlug}/${districtSlug}`} provinceSlug={provinceSlug} districtSlug={districtSlug} />;
}

function DistrictListingsPage({ provinceSlug, districtSlug }: { provinceSlug: string; districtSlug: string }) {
  const match = getDistrictBySlugs(provinceSlug, districtSlug);
  const provinceMeta = match?.province || SRI_LANKA_PROVINCES[0];
  const districtMeta = match?.district || provinceMeta.districts[0];

  const [listings, setListings] = useState<BusinessListingCardData[]>([]);
  const [featured, setFeatured] = useState<BusinessListingCardData[]>([]);
  const [topRated, setTopRated] = useState<BusinessListingCardData[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const nextOffset = useRef(0);
  const loadMoreController = useRef<AbortController | null>(null);

  const districtData: DistrictData = useMemo(
    () => ({
      id: districtMeta.slug,
      name: `${districtMeta.name} District`,
      province: provinceMeta.name,
      provinceSlug: provinceMeta.slug,
      description: `Discover salons, spas, and beauty studios in ${districtMeta.name} District, ${provinceMeta.name}.`,
      salonCount: totalCount,
      avgRating: 4.7,
      image: provinceMeta.image,
      popularCategories: ["Barber", "Hair", "Spa"],
      cities: buildCityCards(districtMeta),
      trendingServices: ["Skin Fade Haircut", "Bridal Makeup", "Hydra Facial", "Beard Sculpting"],
      insights: {
        avgPrice: "LKR 2,500",
        busiestDays: "Friday & Saturday",
        peakHours: "4:00 PM - 8:00 PM",
        topCategory: "Barber",
      },
    }),
    [districtMeta, provinceMeta, totalCount]
  );

  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          location: districtMeta.name,
          publishedOnly: "true",
          limit: String(YOU_MAY_ALSO_LIKE_COUNT),
        });
        const res = await fetch(`/api/business-listings/search?${params.toString()}`, { cache: "no-store", signal: controller.signal });
        const payload = (await res.json()) as ListingSearchResponse;
        if (!res.ok) throw new Error(payload.error || "Failed to load district listings.");
        if (!controller.signal.aborted) {
          setListings(payload.listings || []);
          setFeatured(payload.featured || []);
          setTopRated(payload.topRated || []);
          setHasMore(Boolean(payload.hasMore));
          nextOffset.current = payload.listings?.length || 0;
          setTotalCount(
            typeof payload.totalCount === "number" ? payload.totalCount : mergeListingSectionCards(payload.topRated || [], payload.featured || [], payload.listings || []).length
          );
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error("Failed to load live salons for district page:", err);
          setError("We couldn't load the businesses in this district. Please refresh to try again.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => {
      controller.abort();
      loadMoreController.current?.abort();
    };
  }, [districtMeta.name]);

  async function loadMore() {
    if (loading || !hasMore || loadMoreController.current) return;
    const controller = new AbortController();
    loadMoreController.current = controller;
    setIsLoadingMore(true);
    setError("");
    try {
      const params = new URLSearchParams({
        location: districtMeta.name,
        publishedOnly: "true",
        limit: String(YOU_MAY_ALSO_LIKE_COUNT),
        offset: String(nextOffset.current),
      });
      const res = await fetch(`/api/business-listings/search?${params.toString()}`, { cache: "no-store", signal: controller.signal });
      const payload = (await res.json()) as ListingSearchResponse;
      if (!res.ok) throw new Error(payload.error || "Failed to load more district listings.");
      if (!controller.signal.aborted) {
        const next = payload.listings || [];
        setListings((current) => mergeListingSectionCards([], [], [...current, ...next]));
        nextOffset.current += next.length;
        setHasMore(Boolean(payload.hasMore));
        if (typeof payload.totalCount === "number") setTotalCount(payload.totalCount);
      }
    } catch (err) {
      if (!controller.signal.aborted) {
        console.error("Failed to load more district listings:", err);
        setError("We couldn't load more businesses. Please try Load more again.");
      }
    } finally {
      if (!controller.signal.aborted) {
        loadMoreController.current = null;
        setIsLoadingMore(false);
      }
    }
  }

  return <DistrictDetailTemplate data={districtData} listings={listings} featured={featured} topRated={topRated} hasMore={hasMore} isLoadingMore={isLoadingMore} onLoadMore={loadMore} loading={loading} error={error} />;
}
