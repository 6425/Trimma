"use server";

import { getSalonOwnerReviews } from "@/app/actions/reviews";
import { findOwnerSalon, getSalonAccessTokenFromCookies, getSalonOwnerEmailFromCookies } from "@/lib/server-salon-auth";
import { isSalonDbSuccess, salonDbFailure, withSalonDb } from "@/lib/with-salon-db";
import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { parseFeatureFlags } from "@/lib/parse-feature-flags";

export async function fetchSalonLayoutShell() {
  const email = await getSalonOwnerEmailFromCookies();
  if (!email) return { success: false as const, error: "Not signed in." };

  const supabase = createSupabaseAdminClient();
  const salon = await findOwnerSalon(supabase, email);
  if (!salon) {
    return {
      success: true as const,
      role: "salon_owner",
      salonName: "My Salon",
      avatarUrl: null as string | null,
    };
  }

  return {
    success: true as const,
    role: "salon_owner",
    salonName: (salon.name as string) || "My Salon",
    avatarUrl: (salon.logo_url as string | null) || null,
  };
}

export async function fetchSalonDashboardPage() {
  const result = await withSalonDb(async (supabase, ctx) => {
    const [bookingsRes, servicesRes, staffRes] = await Promise.all([
      supabase
        .from("bookings")
        .select(
          "id, booking_no, amount, total_reservation_fee, salon_upfront_amount, platform_commission_amount, agent_commission_amount, status, booking_date, created_at, customer_email"
        )
        .eq("salon_id", ctx.salonId)
        .order("created_at", { ascending: false }),
      supabase.from("services").select("id, name, status, created_at").eq("salon_id", ctx.salonId),
      supabase.from("salon_staff").select("id, name, created_at").eq("salon_id", ctx.salonId),
    ]);

    if (bookingsRes.error) throw new Error(bookingsRes.error.message);
    if (servicesRes.error) throw new Error(servicesRes.error.message);
    if (staffRes.error) throw new Error(staffRes.error.message);

    return {
      salon: ctx.salon,
      bookings: bookingsRes.data || [],
      services: servicesRes.data || [],
      staff: staffRes.data || [],
    };
  });

  if (!isSalonDbSuccess(result)) return salonDbFailure(result);
  return { success: true as const, ...result.data };
}

export async function fetchSalonBookingsPage() {
  const result = await withSalonDb(async (supabase, ctx) => {
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("salon_id", ctx.salonId)
      .order("booking_date", { ascending: false })
      .order("booking_time", { ascending: false });
    if (error) throw new Error(error.message);
    return { salon: ctx.salon, bookings: data || [] };
  });
  if (!isSalonDbSuccess(result)) return salonDbFailure(result);
  return { success: true as const, ...result.data };
}

export async function fetchSalonFinancePage() {
  const result = await withSalonDb(async (supabase, ctx) => {
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("salon_id", ctx.salonId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { salon: ctx.salon, bookings: data || [] };
  });
  if (!isSalonDbSuccess(result)) return salonDbFailure(result);
  return { success: true as const, ...result.data };
}

export async function fetchSalonBillingPage() {
  const result = await withSalonDb(async (supabase, ctx) => {
    const planId = ctx.salon.subscription_plan_id as string | null | undefined;
    if (!planId) return { activePlan: null };
    const { data, error } = await supabase.from("subscription_plans").select("*").eq("id", planId).maybeSingle();
    if (error) throw new Error(error.message);
    return { activePlan: data };
  });
  if (!isSalonDbSuccess(result)) return salonDbFailure(result);
  return { success: true as const, ...result.data };
}

export async function fetchSalonReviewsPage() {
  const accessToken = await getSalonAccessTokenFromCookies();
  if (!accessToken) return { success: false as const, error: "Please sign in." };

  const result = await withSalonDb(async (_supabase, ctx) => {
    const reviewsResult = await getSalonOwnerReviews(accessToken, ctx.salonId);
    if (!reviewsResult.success) throw new Error(reviewsResult.error);
    return { reviews: reviewsResult.reviews, summary: reviewsResult.summary };
  });
  if (!isSalonDbSuccess(result)) return salonDbFailure(result);
  return { success: true as const, ...result.data };
}

export async function fetchSalonServicesPage() {
  const result = await withSalonDb(async (supabase, ctx) => {
    const planId = ctx.salon.subscription_plan_id as string | null | undefined;
    const [servicesRes, planRes, categoriesRes, globalServicesRes] = await Promise.all([
      supabase.from("services").select("*").eq("salon_id", ctx.salonId).order("created_at", { ascending: false }),
      planId
        ? supabase.from("subscription_plans").select("*").eq("id", planId).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      supabase.from("categories").select("*").order("name"),
      supabase.from("global_services").select("*").order("name"),
    ]);

    for (const res of [servicesRes, planRes, categoriesRes, globalServicesRes]) {
      if (res.error) throw new Error(res.error.message);
    }

    const plan = planRes.data;
    const flags = parseFeatureFlags(plan?.feature_flags);
    const limit = flags.allowed_categories_limit ?? 999;
    const categories = (categoriesRes.data || []).slice(0, limit >= 999 ? undefined : limit);

    return {
      salon: ctx.salon,
      services: servicesRes.data || [],
      subscriptionPlan: plan,
      allowedCategories: categories,
      globalServices: globalServicesRes.data || [],
    };
  });
  if (!isSalonDbSuccess(result)) return salonDbFailure(result);
  return { success: true as const, ...result.data };
}

export async function fetchSalonStaffPage() {
  const result = await withSalonDb(async (supabase, ctx) => {
    const planId = ctx.salon.subscription_plan_id as string | null | undefined;
    const [staffRes, servicesRes, rolesRes, planRes] = await Promise.all([
      supabase.from("salon_staff").select("*").eq("salon_id", ctx.salonId),
      supabase.from("services").select("*").eq("salon_id", ctx.salonId).eq("status", "active"),
      supabase.from("global_staff_roles").select("*").order("category"),
      planId
        ? supabase.from("subscription_plans").select("name, max_staff").eq("id", planId).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ]);

    for (const res of [staffRes, servicesRes, rolesRes, planRes]) {
      if (res.error) throw new Error(res.error.message);
    }

    return {
      salon: ctx.salon,
      staff: staffRes.data || [],
      salonServices: servicesRes.data || [],
      globalStaffRoles: rolesRes.data || [],
      subscriptionPlan: planRes.data,
    };
  });
  if (!isSalonDbSuccess(result)) return salonDbFailure(result);
  return { success: true as const, ...result.data };
}

export async function fetchSalonPackagesPage() {
  const result = await withSalonDb(async (supabase, ctx) => {
    const planId = ctx.salon.subscription_plan_id as string | null | undefined;
    const [packagesRes, typesRes, globalPackagesRes, planRes] = await Promise.all([
      supabase
        .from("salon_promotion_packages")
        .select("*")
        .eq("salon_id", ctx.salonId)
        .order("created_at", { ascending: false }),
      supabase.from("promotion_types").select("*").order("name"),
      supabase.from("global_promotion_packages").select("*").eq("is_active", true),
      planId
        ? supabase.from("subscription_plans").select("*").eq("id", planId).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ]);

    for (const res of [packagesRes, typesRes, globalPackagesRes, planRes]) {
      if (res.error) throw new Error(res.error.message);
    }

    const plan = planRes.data;
    const flags = parseFeatureFlags(plan?.feature_flags);
    let allowedTypes = typesRes.data || [];
    const typesLimit = Number(flags.allowed_promotion_types_limit);
    if (typesLimit && typesLimit < 999) {
      allowedTypes = allowedTypes.slice(0, typesLimit);
    }

    return {
      salon: ctx.salon,
      packages: packagesRes.data || [],
      promotionTypes: typesRes.data || [],
      allowedPromotionTypes: allowedTypes,
      globalPackages: globalPackagesRes.data || [],
      subscriptionPlan: plan,
    };
  });
  if (!isSalonDbSuccess(result)) return salonDbFailure(result);
  return { success: true as const, ...result.data };
}

export async function fetchSalonBookingDetail(bookingId: string) {
  const result = await withSalonDb(async (supabase, ctx) => {
    const { data, error } = await supabase.from("bookings").select("*").eq("id", bookingId).maybeSingle();
    if (error) throw new Error(error.message);
    if (!data || data.salon_id !== ctx.salonId) throw new Error("Booking not found for your salon.");
    return { booking: data };
  });
  if (!isSalonDbSuccess(result)) return salonDbFailure(result);
  return { success: true as const, ...result.data };
}

export async function fetchSalonProfilePage() {
  const result = await withSalonDb(async (supabase, ctx) => {
    let plan = null;
    const planId = ctx.salon.subscription_plan_id as string | null | undefined;

    if (planId) {
      const { data } = await supabase.from("subscription_plans").select("id, name, max_images").eq("id", planId).maybeSingle();
      plan = data;
    } else {
      const { data: freePlan } = await supabase.from("subscription_plans").select("id, name, max_images").eq("name", "Free").maybeSingle();
      if (freePlan) {
        await supabase.from("salons").update({ subscription_plan_id: freePlan.id }).eq("id", ctx.salonId);
        plan = freePlan;
      }
    }

    const [amenitiesRes, salonAmenitiesRes] = await Promise.all([
      supabase.from("global_amenities").select("*").order("name"),
      supabase.from("salon_amenities").select("*").eq("salon_id", ctx.salonId),
    ]);

    const amenitiesMissing =
      amenitiesRes.error?.message?.toLowerCase().includes("does not exist") ||
      amenitiesRes.error?.message?.toLowerCase().includes("schema cache") ||
      salonAmenitiesRes.error?.message?.toLowerCase().includes("does not exist") ||
      salonAmenitiesRes.error?.message?.toLowerCase().includes("schema cache");

    if (!amenitiesMissing) {
      if (amenitiesRes.error) throw new Error(amenitiesRes.error.message);
      if (salonAmenitiesRes.error) throw new Error(salonAmenitiesRes.error.message);
    }

    return {
      salon: ctx.salon,
      subscriptionPlan: plan,
      globalAmenities: amenitiesMissing ? [] : amenitiesRes.data || [],
      salonAmenities: amenitiesMissing ? [] : salonAmenitiesRes.data || [],
    };
  });
  if (!isSalonDbSuccess(result)) return salonDbFailure(result);
  return { success: true as const, ...result.data };
}
