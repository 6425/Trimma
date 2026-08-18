"use client";

import { useMemo, useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { DistrictDetailTemplate, DistrictData } from "../../../../components/marketplace/DistrictDetailTemplate";
import type { BusinessListingCardData } from "@/lib/business-listing-mapper";
import {
  buildCityCards,
  getDistrictBySlugs,
  normalizeProvinceSlug,
  SRI_LANKA_PROVINCES,
} from "@/lib/sri-lanka-locations";

export default function DistrictDetailPage() {
  const { province, district } = useParams();
  const provinceSlug = normalizeProvinceSlug(String(province || "western"));
  const districtSlug = String(district || "colombo");
  const match = getDistrictBySlugs(provinceSlug, districtSlug);
  const provinceMeta = match?.province || SRI_LANKA_PROVINCES[0];
  const districtMeta = match?.district || provinceMeta.districts[0];

  const [listings, setListings] = useState<BusinessListingCardData[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

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
      salons: [],
    }),
    [districtMeta, provinceMeta, totalCount]
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          location: districtMeta.name,
          publishedOnly: "true",
          limit: "0",
        });
        const res = await fetch(`/api/business-listings/search?${params.toString()}`, { cache: "no-store" });
        const payload = (await res.json()) as {
          listings?: BusinessListingCardData[];
          totalCount?: number;
          error?: string;
        };
        if (!res.ok) throw new Error(payload.error || "Failed to load district listings.");
        if (!cancelled) {
          setListings(payload.listings || []);
          setTotalCount(
            typeof payload.totalCount === "number" ? payload.totalCount : payload.listings?.length || 0
          );
        }
      } catch (err) {
        console.error("Failed to load live salons for district page:", err);
        if (!cancelled) {
          setListings([]);
          setTotalCount(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [districtMeta.name]);

  return <DistrictDetailTemplate data={districtData} listings={listings} loading={loading} />;
}
