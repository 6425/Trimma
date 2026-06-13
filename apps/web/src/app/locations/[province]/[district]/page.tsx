"use client";

import { useMemo, useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { DistrictDetailTemplate, DistrictData } from "../../../../components/marketplace/DistrictDetailTemplate";
import { supabase } from "@/config/supabase";
import { mapVerifiedSalonListingStats, getSalonListingImage } from "@/lib/salons-mapper";
import {
  buildCityCards,
  getDistrictBySlugs,
  normalizeProvinceSlug,
  salonMatchesDistrict,
  SRI_LANKA_PROVINCES,
} from "@/lib/sri-lanka-locations";

export default function DistrictDetailPage() {
  const { province, district } = useParams();
  const provinceSlug = normalizeProvinceSlug(String(province || "western"));
  const districtSlug = String(district || "colombo");
  const match = getDistrictBySlugs(provinceSlug, districtSlug);
  const provinceMeta = match?.province || SRI_LANKA_PROVINCES[0];
  const districtMeta = match?.district || provinceMeta.districts[0];

  const [salons, setSalons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const districtData: DistrictData = useMemo(
    () => ({
      id: districtMeta.slug,
      name: `${districtMeta.name} District`,
      province: provinceMeta.name,
      provinceSlug: provinceMeta.slug,
      description: `Discover salons, spas, and beauty studios in ${districtMeta.name} District, ${provinceMeta.name}.`,
      salonCount: 0,
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
    [districtMeta, provinceMeta]
  );

  const filteredSalons = salons.filter((s) => salonMatchesDistrict(s, districtMeta.slug));

  useEffect(() => {
    void Promise.resolve().then(() => {
      async function fetchLiveSalons() {
      try {
      setLoading(true);
      const { data: dbSalons, error } = await supabase
      .from("salons")
      .select("id, slug, name, rating, review_count, city, district, category, logo_url, cover_url, hero_url, is_featured")
      .limit(50);
      
      if (error) throw error;
      
      const formatted = (dbSalons || []).map((s: any) => ({
      id: s.id,
      slug: s.slug,
      name: s.name,
      ...mapVerifiedSalonListingStats(s),
      location: `${s.city || districtMeta.name}, ${s.district || provinceMeta.name}`,
      city: s.city || districtMeta.name,
      district: s.district || districtMeta.name,
      tags: [s.category || "Salon", "Grooming"],
      categories: [s.category || "Salon", "Grooming"],
      category: s.category || "Beauty Lounge",
      logo: s.logo_url || `https://api.dicebear.com/7.x/initials/svg?seed=${s.slug}&backgroundColor=18181b`,
      image: getSalonListingImage(
        s,
        "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=800&q=80"
      ),
      featured: s.is_featured === true,
      openNow: true,
      startingPrice: 1500,
      nextSlot: "Today 4:00 PM",
      popularService: "Premium Cut & Style",
      }));
      
      setSalons(formatted);
      } catch (err) {
      console.error("Failed to load live salons for district page:", err);
      } finally {
      setLoading(false);
      }
      }
      
      fetchLiveSalons();
    });
  }, [districtMeta.name, districtMeta.slug, provinceMeta.name]);

  return <DistrictDetailTemplate data={{ ...districtData, salons: filteredSalons }} loading={loading} />;
}
