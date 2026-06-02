"use server";

import { getSalonOwnerReviews } from "@/app/actions/reviews";
import { findOwnerSalon, getSalonAccessTokenFromCookies, getSalonOwnerEmailFromCookies } from "@/lib/server-salon-auth";
import { isSalonDbSuccess, salonDbFailure, withSalonDb } from "@/lib/with-salon-db";
import { createSupabaseAdminClient } from "@/config/supabase-admin";
import {
  ensureSalonSubscriptionPlan,
  getAllowedCategoriesLimit,
  readPlanFlags,
  sliceAllowedCategories,
} from "@/lib/salon-subscription-plan";

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
    const { plan } = await ensureSalonSubscriptionPlan(
      supabase,
      ctx.salonId,
      ctx.salon.subscription_plan_id as string | null | undefined
    );
    return { activePlan: plan };
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
    const { planId, plan, updatedSalon } = await ensureSalonSubscriptionPlan(
      supabase,
      ctx.salonId,
      ctx.salon.subscription_plan_id as string | null | undefined
    );

    const salon =
      updatedSalon && planId ? { ...ctx.salon, subscription_plan_id: planId } : ctx.salon;

    const [servicesRes, categoriesRes, globalServicesRes] = await Promise.all([
      supabase.from("services").select("*").eq("salon_id", ctx.salonId).order("created_at", { ascending: false }),
      supabase.from("categories").select("*").order("name"),
      supabase.from("global_services").select("*").order("name"),
    ]);

    for (const res of [servicesRes, categoriesRes, globalServicesRes]) {
      if (res.error) throw new Error(res.error.message);
    }

    const flags = readPlanFlags(plan);
    const categories = sliceAllowedCategories(
      categoriesRes.data || [],
      flags,
      (plan?.name as string | null | undefined) ?? null
    );

    return {
      salon,
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
    const { plan } = await ensureSalonSubscriptionPlan(
      supabase,
      ctx.salonId,
      ctx.salon.subscription_plan_id as string | null | undefined
    );

    const [staffRes, servicesRes, rolesRes] = await Promise.all([
      supabase.from("salon_staff").select("*").eq("salon_id", ctx.salonId),
      supabase.from("services").select("*").eq("salon_id", ctx.salonId).eq("status", "active"),
      supabase.from("global_staff_roles").select("*").order("category"),
    ]);

    for (const res of [staffRes, servicesRes, rolesRes]) {
      if (res.error) throw new Error(res.error.message);
    }

    return {
      salon: ctx.salon,
      staff: staffRes.data || [],
      salonServices: servicesRes.data || [],
      globalStaffRoles: rolesRes.data || [],
      subscriptionPlan: plan ? { name: plan.name, max_staff: plan.max_staff } : null,
    };
  });
  if (!isSalonDbSuccess(result)) return salonDbFailure(result);
  return { success: true as const, ...result.data };
}

export async function fetchSalonPackagesPage() {
  const result = await withSalonDb(async (supabase, ctx) => {
    const { plan } = await ensureSalonSubscriptionPlan(
      supabase,
      ctx.salonId,
      ctx.salon.subscription_plan_id as string | null | undefined
    );

    const [packagesRes, typesRes, globalPackagesRes] = await Promise.all([
      supabase
        .from("salon_promotion_packages")
        .select("*")
        .eq("salon_id", ctx.salonId)
        .order("created_at", { ascending: false }),
      supabase.from("promotion_types").select("*").order("name"),
      supabase.from("global_promotion_packages").select("*").eq("is_active", true),
    ]);

    for (const res of [packagesRes, typesRes, globalPackagesRes]) {
      if (res.error) throw new Error(res.error.message);
    }

    const flags = readPlanFlags(plan);
    let allowedTypes = typesRes.data || [];
    const typesLimit = Number(flags.allowed_promotion_types_limit);
    if (typesLimit && typesLimit > 0 && typesLimit < 999) {
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
    const { planId, plan, updatedSalon } = await ensureSalonSubscriptionPlan(
      supabase,
      ctx.salonId,
      ctx.salon.subscription_plan_id as string | null | undefined
    );

    const salon =
      updatedSalon && planId ? { ...ctx.salon, subscription_plan_id: planId } : ctx.salon;

    const [amenitiesRes, salonAmenitiesRes, categoriesRes] = await Promise.all([
      supabase.from("global_amenities").select("*").order("name"),
      supabase.from("salon_amenities").select("*").eq("salon_id", ctx.salonId),
      supabase.from("categories").select("id, name, slug").order("name"),
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

    const flags = readPlanFlags(plan);
    const allowedCategoriesCount = getAllowedCategoriesLimit(
      flags,
      (plan?.name as string | null | undefined) ?? null
    );

    return {
      salon,
      subscriptionPlan: plan ? { id: plan.id, name: plan.name, max_images: plan.max_images } : null,
      globalAmenities: amenitiesMissing ? [] : amenitiesRes.data || [],
      salonAmenities: amenitiesMissing ? [] : salonAmenitiesRes.data || [],
      categories: categoriesRes.data || [],
      allowedCategoriesCount,
    };
  });
  if (!isSalonDbSuccess(result)) return salonDbFailure(result);
  return { success: true as const, ...result.data };
}

export async function fetchSalonCustomersPage() {
  const result = await withSalonDb(async (supabase, ctx) => {
    const { data: bookings, error } = await supabase
      .from("bookings")
      .select("customer_email, amount, status, created_at, booking_date, users(full_name, phone)")
      .eq("salon_id", ctx.salonId);

    if (error) throw new Error(error.message);

    const customersMap = new Map();

    for (const b of bookings || []) {
      if (!b.customer_email) continue;
      
      const email = b.customer_email.toLowerCase();
      if (!customersMap.has(email)) {
        customersMap.set(email, {
          email: email,
          name: Array.isArray(b.users) ? (b.users[0] as any)?.full_name || "Guest" : (b.users as any)?.full_name || "Guest",
          phone: Array.isArray(b.users) ? (b.users[0] as any)?.phone || "-" : (b.users as any)?.phone || "-",
          bookings: 0,
          spent: 0,
          rating: 5, // We don't have per-customer ratings aggregated easily right now
          lastVisit: b.booking_date || b.created_at,
          lastVisitDate: new Date(b.created_at).getTime()
        });
      }

      const c = customersMap.get(email);
      c.bookings += 1;
      if (b.status === "completed" || b.status === "confirmed") {
        c.spent += Number(b.amount || 0);
      }
      
      const bDate = new Date(b.created_at).getTime();
      if (bDate > c.lastVisitDate) {
        c.lastVisitDate = bDate;
        c.lastVisit = b.booking_date || b.created_at;
      }
    }

    const customersList = Array.from(customersMap.values())
      .sort((a, b) => b.lastVisitDate - a.lastVisitDate)
      .map(c => ({
        name: c.name,
        email: c.email,
        phone: c.phone,
        bookings: c.bookings,
        spent: "LKR " + c.spent.toLocaleString(),
        rating: 5,
        lastVisit: new Date(c.lastVisitDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      }));

    return {
      salon: ctx.salon,
      customers: customersList,
    };
  });
  if (!isSalonDbSuccess(result)) return salonDbFailure(result);
  return { success: true as const, ...result.data };
}
