"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { DistrictDetailTemplate, DistrictData } from "../../../../components/marketplace/DistrictDetailTemplate";
import { supabase } from "@/config/supabase";

const districtData: DistrictData = {
  id: "colombo",
  name: "Colombo District",
  province: "Western Province",
  description: "Discover salons, spas, and beauty studios in Colombo District. The heart of premium grooming and wellness in Sri Lanka.",
  salonCount: 540,
  avgRating: 4.7,
  image: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?q=80&w=2836&auto=format&fit=crop",
  popularCategories: ["Barber", "Hair", "Spa"],
  cities: [
    { name: "Colombo 07", count: 120, top: "Barber • Luxury Grooming" },
    { name: "Colombo 03", count: 85, top: "Spa • Wellness" },
    { name: "Nugegoda", count: 64, top: "Hair • Beauty" },
    { name: "Dehiwala", count: 42, top: "Bridal • Nails" },
  ],
  trendingServices: [
    "Skin Fade Haircut",
    "Bridal Makeup",
    "Hydra Facial",
    "Beard Sculpting"
  ],
  insights: {
    avgPrice: "LKR 2,500",
    busiestDays: "Friday & Saturday",
    peakHours: "4:00 PM - 8:00 PM",
    topCategory: "Barber"
  },
  salons: []
};

export default function DistrictDetailPage() {
  const { province, district } = useParams();
  const [salons, setSalons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter salons belonging to this district
  const filteredSalons = salons.filter(s => {
    const districtParam = String(district).toLowerCase().replace(/-/g, " ");
    const salonDistrict = s.district?.toLowerCase() || "";
    const locLower = s.location?.toLowerCase() || "";
    return salonDistrict.includes(districtParam) || districtParam.includes(salonDistrict) || locLower.includes(districtParam);
  });

  useEffect(() => {
    async function fetchLiveSalons() {
      try {
        setLoading(true);
        const { data: dbSalons, error } = await supabase
          .from("salons")
          .select(`
            *,
            services (
              id,
              name,
              price,
              category
            )
          `)
          .or("status.eq.verified,status.eq.active,status.eq.pending,is_verified.eq.true");

        if (error) throw error;

        // Transform DB records into UI formats
        const formatted = (dbSalons || []).map((s: any) => {
          const prices = s.services?.map((ser: any) => Number(ser.price)) || [];
          const startingPrice = prices.length > 0 ? Math.min(...prices) : 1500;
          const popularService = s.services?.[0]?.name || "Premium Cut & Style";
          const tags = Array.from(new Set(s.services?.map((ser: any) => ser.category) || ["Salon", "Grooming"]));

          return {
            id: s.id,
            slug: s.slug,
            name: s.name,
            rating: s.rating || 4.9, 
            reviews: s.reviews_count || 142,
            location: `${s.city || 'Colombo'}, ${s.district || 'Western Province'}`,
            city: s.city || 'Colombo',
            district: s.district || 'Western Province',
            tags: tags.slice(0, 3),
            categories: tags.slice(0, 3),
            category: s.category || (tags[0] as string) || "Beauty Lounge",
            logo: s.logo_url || `https://api.dicebear.com/7.x/initials/svg?seed=${s.slug}&backgroundColor=18181b`,
            image: s.cover_url || "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=800&q=80",
            featured: s.is_featured === true,
            openNow: true,
            startingPrice,
            nextSlot: "Today 4:00 PM",
            popularService,
          };
        });

        setSalons(formatted);
      } catch (err) {
        console.error("Failed to load live salons for district page:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchLiveSalons();
  }, [district]);

  return <DistrictDetailTemplate data={{ ...districtData, salons: filteredSalons }} />;
}
