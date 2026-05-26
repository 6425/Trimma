import { createServerSupabaseClient } from "@/config/supabase-server";
import DealsClient from "./DealsClient";
import {
  getDealLocationKey,
  normalizeDealRows,
  type CategoryOption,
  type DealSalon,
} from "@/lib/deals";

export const revalidate = 60;

async function loadDealsPageData() {
  try {
    const supabase = createServerSupabaseClient();

    const [packagesRes, categoriesRes] = await Promise.all([
      supabase
        .from("salon_promotion_packages")
        .select(
          "id, salon_id, name, description, package_price, original_price, included_services, start_date, end_date, status, promotion_type, promotion_type_id"
        )
        .eq("status", "active")
        .order("created_at", { ascending: false }),
      supabase.from("categories").select("id, name, slug").order("name"),
    ]);

    if (packagesRes.error) {
      console.error("Failed to load deals:", packagesRes.error.message);
    }
    if (categoriesRes.error) {
      console.error("Failed to load deal categories:", categoriesRes.error.message);
    }

    const packages = packagesRes.error ? [] : packagesRes.data || [];
    const salonIds = [...new Set(packages.map((pkg) => pkg.salon_id).filter(Boolean))];

    let salonsById = new Map<string, DealSalon>();

    if (salonIds.length > 0) {
      const { data: salonRows, error: salonsError } = await supabase
        .from("salons")
        .select(
          "id, name, slug, city, district, province, category, logo_url, status, is_verified, public_visibility"
        )
        .in("id", salonIds)
        .or("status.eq.verified,status.eq.active,is_verified.eq.true");

      if (salonsError) {
        console.error("Failed to load deal salons:", salonsError.message);
      } else {
        salonsById = new Map((salonRows || []).map((salon) => [salon.id, salon as DealSalon]));
      }
    }

    const deals = normalizeDealRows(packages, salonsById);
    const categories: CategoryOption[] = categoriesRes.error ? [] : categoriesRes.data || [];

    const locationSet = new Set<string>();
    for (const deal of deals) {
      const key = getDealLocationKey(deal.salon);
      if (key && key !== "Other") locationSet.add(key);
    }
    const locations = [...locationSet].sort((a, b) => a.localeCompare(b));

    return { deals, categories, locations };
  } catch (error) {
    console.error("Deals page failed:", error);
    return { deals: [], categories: [], locations: [] };
  }
}

export default async function DealsPage() {
  const { deals, categories, locations } = await loadDealsPageData();
  return <DealsClient deals={deals} categories={categories} locations={locations} />;
}
