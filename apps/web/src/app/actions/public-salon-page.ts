"use server";

import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { fetchPublishedSalonReviewsForPage, type PublicSalonReview } from "@/app/actions/reviews";
import { mapSalonPromotionRows, type SalonPromotionPackage } from "@/lib/deals";
import { formatPublicSalonAmenity } from "@/lib/salon-amenities";
import { isDummySalonRecord } from "@/lib/salon-list-filters";
import { filterServicesWithStaffCoverage } from "@/lib/staff-allocation";
import { dedupeStaffByNameRole } from "@/lib/salon-staff-service-sync";
import type { SalonReviewSummary } from "@/lib/reviews";

const SALON_COLUMNS_CORE =
  "id, slug, name, city, district, province, address, phone, owner_email, place_id, map_url, latitude, longitude, location, cover_url, hero_url, featured_images, logo_url, is_verified, category, rating, review_count, is_featured, status, public_visibility, booking_enabled";

const SALON_COLUMNS_EXTENDED = `${SALON_COLUMNS_CORE}, working_hours, description`;

const SERVICE_COLUMNS =
  "id, name, duration_min, price, discount_percentage, discount_end_date, category, description, image_url, status";

const GLOBAL_AMENITY_COLUMNS = "id, name, icon_name, type";

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
  avatar_url: string | null;
};

export type PublicSalonAmenityDisplay = {
  name: string;
  icon_name: string;
  quantity: number | null;
  type: string;
};

function isMissingColumnError(message: string) {
  const lower = message.toLowerCase();
  return lower.includes("does not exist") || lower.includes("column");
}

function normalizeFeaturedImages(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  }
  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
      }
    } catch {
      return value.trim() ? [value.trim()] : [];
    }
  }
  return [];
}

function normalizeSalonRecord(salon: Record<string, unknown>) {
  return {
    ...salon,
    featured_images: normalizeFeaturedImages(salon.featured_images),
  };
}

async function selectSalonByColumns(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  columns: string,
  slug: string
): Promise<{ data: Record<string, unknown> | null; error: { message: string } | null }> {
  const { data: bySlug, error: slugError } = await supabase
    .from("salons")
    .select(columns)
    .eq("slug", slug)
    .maybeSingle();

  if (slugError) return { data: null, error: slugError };
  if (bySlug) return { data: bySlug as unknown as Record<string, unknown>, error: null };

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
  if (!isUuid) return { data: null, error: null };

  const { data: byId, error: idError } = await supabase
    .from("salons")
    .select(columns)
    .eq("id", slug)
    .maybeSingle();

  return {
    data: byId ? (byId as unknown as Record<string, unknown>) : null,
    error: idError,
  };
}

async function findSalonBySlugOrId(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  slug: string
) {
  for (const columns of [SALON_COLUMNS_EXTENDED, SALON_COLUMNS_CORE]) {
    const { data, error } = await selectSalonByColumns(supabase, columns, slug);
    if (error) {
      if (isMissingColumnError(error.message) && columns === SALON_COLUMNS_EXTENDED) {
        continue;
      }
      throw new Error(error.message);
    }
    if (data) return data;
  }

  return null;
}

async function fetchActiveServices(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  salonId: string
) {
  const attempts = [
    () =>
      supabase
        .from("services")
        .select(SERVICE_COLUMNS)
        .eq("salon_id", salonId)
        .eq("status", "active"),
    () => supabase.from("services").select("*").eq("salon_id", salonId).eq("status", "active"),
    () =>
      supabase
        .from("services")
        .select("id, name, duration_min, price, discount_percentage, discount_end_date, category, description, status")
        .eq("salon_id", salonId)
        .eq("status", "active"),
  ];

  let lastError: string | null = null;
  for (const run of attempts) {
    const { data, error } = await run();
    if (!error) return data || [];
    lastError = error.message;
    if (!isMissingColumnError(error.message)) break;
  }

  throw new Error(lastError || "Could not load salon services.");
}

export async function fetchPublicSalonPage(slug: string): Promise<
  | {
      success: true;
      salon: Record<string, unknown>;
      services: PublicSalonService[];
      staff: PublicSalonStaff[];
      amenities: PublicSalonAmenityDisplay[];
      promotionPackages: SalonPromotionPackage[];
      reviewSummary: SalonReviewSummary;
      reviews: PublicSalonReview[];
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

    if (!salonData || isDummySalonRecord(salonData as { id?: string | null; name?: string | null; slug?: string | null })) {
      return { success: false, error: "Salon not found." };
    }

    const salonId = String(salonData.id);

    const [servicesData, staffRes, amenitiesRes, promotionsRes, reviewsBundle] = await Promise.all([
      fetchActiveServices(supabase, salonId),
      supabase
        .from("salon_staff")
        .select("id, name, role, working_hours, status, avatar_url")
        .eq("salon_id", salonId)
        .eq("status", "active"),
      supabase
        .from("salon_amenities")
        .select("amenity_id, value, quantity, type")
        .eq("salon_id", salonId)
        .or("value.eq.true,value.gt.0"),
      supabase
        .from("salon_promotion_packages")
        .select(
          "id, name, description, package_price, original_price, included_services, start_date, end_date, status, promotion_type"
        )
        .eq("salon_id", salonId)
        .eq("status", "active"),
      fetchPublishedSalonReviewsForPage(salonId),
    ]);

    if (staffRes.error) throw new Error(staffRes.error.message);
    if (amenitiesRes.error) throw new Error(amenitiesRes.error.message);
    if (promotionsRes.error) throw new Error(promotionsRes.error.message);

    const amenityIds = [
      ...new Set((amenitiesRes.data || []).map((row) => row.amenity_id).filter(Boolean)),
    ] as string[];

    const globalAmenitiesRes =
      amenityIds.length > 0
        ? await supabase
            .from("global_amenities")
            .select(GLOBAL_AMENITY_COLUMNS)
            .in("id", amenityIds)
        : { data: [], error: null };

    if (globalAmenitiesRes.error) throw new Error(globalAmenitiesRes.error.message);

    const staffForCoverage = (staffRes.data || []) as Array<{
      id: string;
      status?: string | null;
      working_hours?: { assigned_services?: Array<{ service_id: string; enabled?: boolean }> } | null;
    }>;
    const bookableServices = (() => {
      const activeServices = (servicesData || []).filter(
        (svc) => (svc.status || "active").toLowerCase() === "active"
      );
      const mapped = filterServicesWithStaffCoverage(activeServices, staffForCoverage);
      if (mapped.length > 0) return mapped;
      if (activeServices.length > 0 && staffForCoverage.length > 0) {
        return activeServices;
      }
      return mapped;
    })();

    const services: PublicSalonService[] = bookableServices.map((svc) => ({
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

    const staff: PublicSalonStaff[] = dedupeStaffByNameRole(staffRes.data || []).map((member) => ({
      id: member.id,
      name: member.name,
      role: member.role || "Professional",
      experience: "5 yrs",
      rating: 0,
      completed: 0,
      availableToday: true,
      working_hours: member.working_hours,
      avatar_url: member.avatar_url || null,
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
      salon: normalizeSalonRecord(salonData),
      services,
      staff,
      amenities,
      promotionPackages,
      reviewSummary: reviewsBundle.summary,
      reviews: reviewsBundle.reviews,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not load salon.";
    console.error("[fetchPublicSalonPage]", normalizedSlug, message);
    return { success: false, error: message };
  }
}
