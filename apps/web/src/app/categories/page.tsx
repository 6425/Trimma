import { createServerSupabaseClient } from "@/config/supabase-server";
import { filterPublicSalons } from "@/lib/salon-list-filters";
import CategoriesClient, { type CategoryRow } from "./CategoriesClient";

export const revalidate = 60;

const CATEGORY_IMAGES: Record<string, string> = {
  hair: "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=600&fm=webp&fit=crop",
  barbers: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?q=80&w=600&fm=webp&fit=crop",
  "barber-salon": "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?q=80&w=600&fm=webp&fit=crop",
  nails: "https://images.unsplash.com/photo-1519014816548-bf5fe059e98b?q=80&w=600&fm=webp&fit=crop",
  "nail-studio": "https://images.unsplash.com/photo-1519014816548-bf5fe059e98b?q=80&w=600&fm=webp&fit=crop",
  spa: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=600&fm=webp&fit=crop",
  "spa-wellness": "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=600&fm=webp&fit=crop",
  skin: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=600&fm=webp&fit=crop",
  "skincare-clinics": "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=600&fm=webp&fit=crop",
  tattoo: "https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?q=80&w=600&fm=webp&fit=crop",
  "tattoo-studio": "https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?q=80&w=600&fm=webp&fit=crop",
  "bridal-beauty": "https://images.unsplash.com/photo-1509631179647-0c739a4e6dd5?q=80&w=600&fm=webp&fit=crop",
  "beauty-parlours": "https://images.unsplash.com/photo-1522337660859-02fbefca4702?q=80&w=600&fm=webp&fit=crop",
  "yoga-studio": "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=600&fm=webp&fit=crop",
  "mens-grooming": "https://images.unsplash.com/photo-1621605815971-fbc98d665033?q=80&w=600&fm=webp&fit=crop",
  "kids-family": "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?q=80&w=600&fm=webp&fit=crop",
};

const DEFAULT_IMG =
  "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=600&fm=webp&fit=crop";

export default async function CategoriesPage() {
  const supabase = createServerSupabaseClient();

  const [{ data: catData }, { data: salonData }] = await Promise.all([
    supabase.from("categories").select("id, name, slug, icon, image_url").order("name"),
    supabase.from("salons").select("category, name"),
  ]);

  const counts: Record<string, number> = {};
  filterPublicSalons(salonData || []).forEach((salon) => {
    if (salon.category) {
      counts[salon.category] = (counts[salon.category] || 0) + 1;
    }
  });

  const categories: CategoryRow[] = (catData || []).map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    icon: c.icon ?? undefined,
    image_url: c.image_url ?? undefined,
    img: c.image_url || CATEGORY_IMAGES[c.slug] || DEFAULT_IMG,
    count: counts[c.name] || 0,
  }));

  return <CategoriesClient initialCategories={categories} />;
}
