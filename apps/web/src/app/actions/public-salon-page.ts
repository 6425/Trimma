"use server";

import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { mapSalonPromotionRows, type SalonPromotionPackage } from "@/lib/deals";
import { formatPublicSalonAmenity } from "@/lib/salon-amenities";
import { isDummySalonRecord } from "@/lib/salon-list-filters";

const SALON_COLUMNS =
  "id, slug, name, city, district, province, address, phone, owner_email, place_id, map_url, latitude, longitude, location, cover_url, hero_url, featured_images, logo_url, is_verified, category, rating, review_count, is_featured, status, public_visibility, booking_enabled";

export type PublicSalonService = {
  id: string;
  name: string;
  duration: number;
  price: number;
  discount_percentage: number | null;
  discount_end_date: string | null;
  category: string;
  description: string;
  image_url: string | null;
  popular: boolean;
};

export type PublicSalonStaff = {
  id: string;
  name: string;
  role: string;
  experience: string;
  rating: number;
  completed: number;
  availableToday: boolean;
  working_hours: unknown;
};

export type PublicSalonAmenityDisplay = {
  name: string;
  icon_name: string;
  quantity: number | null;
  type: string;
};

async function findSalonBySlugOrId(supabase: ReturnType<typeof createSupabaseAdminClient>, slug: string) {
  const { data: bySlug, error: slugError } = await supabase
    .from("salons")
    .select(SALON_COLUMNS)
    .eq("slug", slug)
    .maybeSingle();

  if (slugError) throw new Error(slugError.message);
  if (bySlug) return bySlug;

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
  if (!isUuid) return null;

  const { data: byId, error: idError } = await supabase
    .from("salons")
    .select(SALON_COLUMNS)
    .eq("id", slug)
    .maybeSingle();

  if (idError) throw new Error(idError.message);
  return byId;
}

export async function fetchPublicSalonPage(slug: string): Promise<
  | {
      success: true;
      salon: Record<string, unknown>;
      services: PublicSalonService[];
      staff: PublicSalonStaff[];
      amenities: PublicSalonAmenityDisplay[];
      promotionPackages: SalonPromotionPackage[];
    }
  | { success: false; error: string }
> {
  const normalizedSlug = slug.trim();
  if (!normalizedSlug) {
    return { success: false, error: "Salon not found." };
  }

  try {
    const supabase = createSupabaseAdminClient();
    const salonData = await findSalonBySlugOrId(supabase, normalizedSlug);

    if (!salonData || isDummySalonRecord(salonData)) {
      return { success: false, error: "Salon not found." };
    }

    const salonId = String(salonData.id);

    const [servicesRes, staffRes, amenitiesRes, globalAmenitiesRes, promotionsRes] =
      await Promise.all([
        supabase.from("services").select("*").eq("salon_id", salonId).eq("status", "active"),
        supabase.from("salon_staff").select("*").eq("salon_id", salonId).eq("status", "active"),
        supabase
          .from("salon_amenities")
          .select("*")
          .eq("salon_id", salonId)
          .or("value.eq.true,value.gt.0"),
        supabase.from("global_amenities").select("*"),
        supabase
          .from("salon_promotion_packages")
          .select(
            "id, name, description, package_price, original_price, included_services, start_date, end_date, status, promotion_type"
          )
          .eq("salon_id", salonId)
          .eq("status", "active"),
      ]);

    if (servicesRes.error) throw new Error(servicesRes.error.message);
    if (staffRes.error) throw new Error(staffRes.error.message);
    if (amenitiesRes.error) throw new Error(amenitiesRes.error.message);
    if (globalAmenitiesRes.error) throw new Error(globalAmenitiesRes.error.message);
    if (promotionsRes.error) throw new Error(promotionsRes.error.message);

    const services: PublicSalonService[] = (servicesRes.data || []).map((svc) => ({
      id: svc.id,
      name: svc.name,
      duration: svc.duration_min,
      price: svc.price,
      discount_percentage: svc.discount_percentage,
      discount_end_date: svc.discount_end_date,
      category: svc.category || "Hair",
      description: svc.description || "Experience premium service.",
      image_url: svc.image_url || null,
      popular: false,
    }));

    const staff: PublicSalonStaff[] = (staffRes.data || []).map((member) => ({
      id: member.id,
      name: member.name,
      role: member.role || "Professional",
      experience: "5 yrs",
      rating: 4.8,
      completed: 100,
      availableToday: true,
      working_hours: member.working_hours,
    }));

    const globalMap = Object.fromEntries((globalAmenitiesRes.data || []).map((row) => [row.id, row]));
    const amenities = (amenitiesRes.data || [])
      .map((row) => {
        const globalAmenity = globalMap[row.amenity_id];
        if (!globalAmenity) return null;
        return formatPublicSalonAmenity(globalAmenity, row);
      })
      .filter((item): item is PublicSalonAmenityDisplay => Boolean(item));

    const promotionPackages = mapSalonPromotionRows(promotionsRes.data || []);

    return {
      success: true,
      salon: salonData as Record<string, unknown>,
      services,
      staff,
      amenities,
      promotionPackages,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not load salon.";
    return { success: false, error: message };
  }
}
