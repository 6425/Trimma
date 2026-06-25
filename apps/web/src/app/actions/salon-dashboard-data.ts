"use server";

import { getSalonOwnerReviews } from "@/app/actions/reviews";
import { getSalonAccessTokenFromCookies, requireSalonOwnerFromCookies } from "@/lib/server-salon-auth";
import { isSalonDbSuccess, salonDbFailure, withSalonDb } from "@/lib/with-salon-db";
import {
  ensureSalonSubscriptionPlan,
  getAllowedCategoriesLimit,
  readPlanFlags,
  sliceAllowedCategories,
} from "@/lib/salon-subscription-plan";
import { fetchBookingCommissionRates } from "@/app/actions/booking-public-settings";
import { getServiceIdsCoveredByStaff, getBookingServiceDisplayName, resolveStaffMemberFromBooking } from "@/lib/staff-allocation";
import {
  bookingCountsAsLoyaltyVisit,
  resolveHighestDisplayTier,
  resolveVipFromVisits,
} from "@/lib/salon-loyalty";
import { fetchSalonLoyaltyRules } from "@/app/actions/salon-loyalty";
import { getPublicSubscriptionPlans } from "@/app/actions/subscription-plans";

function isDeletedCatalogStatus(status?: string | null): boolean {
  return (status || "").toLowerCase() === "deleted";
}

function filterCatalogServices<T extends { status?: string | null }>(rows: T[]): T[] {
  return rows.filter((row) => !isDeletedCatalogStatus(row.status));
}

function isMissingDbObjectError(message: string): boolean {
  const lower = message.toLowerCase();
  return lower.includes("does not exist") || lower.includes("schema cache");
}

export async function fetchSalonLayoutShell() {
  const auth = await requireSalonOwnerFromCookies();
  if ("error" in auth) {
    return { success: false as const, error: auth.error };
  }

  const salon = auth.salon;

  return {
    success: true as const,
    role: auth.role,
    salonName: (salon.name as string) || "My Salon",
    avatarUrl: (salon.logo_url as string | null) || null,
    onboardingStatus: (salon.onboarding_status as string | null) || null,
    onboardingSnapshot: {
      name: salon.name as string | null,
      description: salon.description as string | null,
      phone: salon.phone as string | null,
      address: salon.address as string | null,
      city: salon.city as string | null,
      latitude: salon.latitude as number | null,
      longitude: salon.longitude as number | null,
      logo_url: salon.logo_url as string | null,
      cover_url: salon.cover_url as string | null,
      hero_url: salon.hero_url as string | null,
      hero_image: salon.hero_image as string | null,
      owner_email: salon.owner_email as string | null,
      owner_gmail: salon.owner_gmail as string | null,
      working_hours: salon.working_hours,
      business_info_extended: (salon.business_info_extended as Record<string, unknown> | null) || null,
      bank_info: (salon.bank_info as Record<string, unknown> | null) || null,
      is_verified: salon.is_verified as boolean | null,
      onboarding_status: salon.onboarding_status as string | null,
    },
  };
}

export async function fetchSalonDashboardPage() {
  const result = await withSalonDb(async (supabase, ctx) => {
    const [bookingsRes, servicesRes, staffRes] = await Promise.all([
      supabase
        .from("bookings")
        .select(
          `id, booking_no, amount, total_reservation_fee, salon_upfront_amount, platform_commission_amount, agent_commission_amount, staff_commission_amount, staff_commission_percent, status, payment_status, reservation_fee_paid, booking_date, booking_time, created_at, customer_email, staff_id, service_id,
          services (id, name),
          salon_staff (id, name, commission_rate, working_hours),
          booking_services (service_id, price, duration_min, services (id, name, global_service_id)),
          booking_staff (staff_id, salon_staff (id, name, commission_rate, working_hours))`
        )
        .eq("salon_id", ctx.salonId)
        .order("created_at", { ascending: false }),
      supabase.from("services").select("id, name, status, created_at").eq("salon_id", ctx.salonId),
      supabase
        .from("salon_staff")
        .select("id, name, status, commission_rate, working_hours, created_at")
        .eq("salon_id", ctx.salonId),
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

const SALON_BOOKINGS_SELECT = `
  *,
  services (id, name),
  salon_staff (id, name, commission_rate, working_hours),
  booking_services (service_id, price, duration_min, services (id, name, global_service_id)),
  booking_staff (staff_id, salon_staff (id, name, commission_rate, working_hours))
`;

function compareBookingsByAppointmentDate(
  a: { booking_date?: string | null; booking_time?: string | null; created_at?: string | null },
  b: { booking_date?: string | null; booking_time?: string | null; created_at?: string | null }
): number {
  const dateA = a.booking_date || "";
  const dateB = b.booking_date || "";
  if (dateA !== dateB) return dateA.localeCompare(dateB);

  const timeA = (a.booking_time || "").slice(0, 8);
  const timeB = (b.booking_time || "").slice(0, 8);
  if (timeA !== timeB) return timeA.localeCompare(timeB);

  return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
}

function mergeBookingsById<T extends { id: string; booking_date?: string | null; booking_time?: string | null; created_at?: string | null }>(
  primary: T[],
  extra: T[]
): T[] {
  const byId = new Map<string, T>();
  for (const row of primary) byId.set(row.id, row);
  for (const row of extra) {
    if (!byId.has(row.id)) byId.set(row.id, row);
  }
  return Array.from(byId.values()).sort(compareBookingsByAppointmentDate);
}

export async function fetchSalonBookingsPage() {
  const result = await withSalonDb(async (supabase, ctx) => {
    const primaryQuery = await supabase
      .from("bookings")
      .select(SALON_BOOKINGS_SELECT)
      .eq("salon_id", ctx.salonId)
      .order("booking_date", { ascending: true })
      .order("booking_time", { ascending: true });

    let bookings = primaryQuery.data || [];

    if (primaryQuery.error) {
      console.error("Bookings relation select failed, falling back:", primaryQuery.error.message);
      const fallback = await supabase
        .from("bookings")
        .select("*")
        .eq("salon_id", ctx.salonId)
        .order("booking_date", { ascending: true })
        .order("booking_time", { ascending: true });
      if (fallback.error) throw new Error(fallback.error.message);
      bookings = fallback.data || [];
    }

    const pendingPaid = await supabase
      .from("bookings")
      .select(SALON_BOOKINGS_SELECT)
      .eq("salon_id", ctx.salonId)
      .eq("status", "pending")
      .eq("payment_status", "reservation_paid")
      .order("booking_date", { ascending: true })
      .order("booking_time", { ascending: true });

    if (!pendingPaid.error && pendingPaid.data?.length) {
      bookings = mergeBookingsById(bookings, pendingPaid.data);
    } else if (pendingPaid.error) {
      const pendingPaidFallback = await supabase
        .from("bookings")
        .select("*")
        .eq("salon_id", ctx.salonId)
        .eq("status", "pending")
        .eq("payment_status", "reservation_paid")
        .order("booking_date", { ascending: true })
        .order("booking_time", { ascending: true });
      if (!pendingPaidFallback.error && pendingPaidFallback.data?.length) {
        bookings = mergeBookingsById(bookings, pendingPaidFallback.data);
      }
    }

    bookings.sort(compareBookingsByAppointmentDate);

    return { salon: ctx.salon, bookings };
  });
  if (!isSalonDbSuccess(result)) return salonDbFailure(result);
  return { success: true as const, ...result.data };
}

export async function fetchSalonCalendarBookings(startDateStr: string, endDateStr: string) {
  const result = await withSalonDb(async (supabase, ctx) => {
    const calendarSelect = `
      id,
      booking_date,
      booking_time,
      status,
      customer_email,
      staff_id,
      services (id, name),
      salon_staff (id, name, commission_rate, working_hours),
      booking_services (service_id, price, duration_min, services (id, name, global_service_id)),
      booking_staff (staff_id, salon_staff (id, name, commission_rate, working_hours))
    `;

    const { data, error } = await supabase
      .from("bookings")
      .select(calendarSelect)
      .eq("salon_id", ctx.salonId)
      .gte("booking_date", startDateStr)
      .lte("booking_date", endDateStr)
      .order("booking_date", { ascending: true })
      .order("booking_time", { ascending: true });

    if (error) throw new Error(error.message);

    const bookingsList = data || [];

    const [usersRes, staffRes] = await Promise.all([
      (async () => {
        const emails = [...new Set(bookingsList.map((b) => b.customer_email).filter(Boolean))];
        if (!emails.length) return {} as Record<string, string>;
        const { data: usersData } = await supabase
          .from("users")
          .select("email, full_name")
          .in("email", emails);
        const usersMap: Record<string, string> = {};
        (usersData || []).forEach((u) => {
          usersMap[u.email] = u.full_name || u.email;
        });
        return usersMap;
      })(),
      supabase
        .from("salon_staff")
        .select("id, name, commission_rate, working_hours, status")
        .eq("salon_id", ctx.salonId),
    ]);

    if (staffRes.error) throw new Error(staffRes.error.message);
    const allStaff = staffRes.data || [];

    const mappedBookings = bookingsList.map((b: any) => {
      const clientName = b.customer_email
        ? usersRes[b.customer_email] || b.customer_email
        : "Walk-in Client";
      const serviceName = getBookingServiceDisplayName(b) || "General Booking";
      const staffMember = resolveStaffMemberFromBooking(b, allStaff);

      return {
        id: b.id,
        booking_date: b.booking_date,
        booking_time: b.booking_time,
        status: b.status,
        clientName,
        serviceName,
        staffName: staffMember?.name || "Unassigned",
      };
    });

    return { salon: ctx.salon, bookings: mappedBookings };
  });
  if (!isSalonDbSuccess(result)) return salonDbFailure(result);
  return { success: true as const, ...result.data };
}

export async function fetchSalonFinancePage() {
  const [result, commissionRates] = await Promise.all([
    withSalonDb(async (supabase, ctx) => {
      const [bookingsRes, staffRes] = await Promise.all([
        supabase
          .from("bookings")
          .select(`
          *,
          services (id, name),
          salon_staff (id, name, commission_rate, working_hours),
          booking_services (service_id, price, duration_min, services (id, name, global_service_id)),
          booking_staff (staff_id, salon_staff (id, name, commission_rate, working_hours))
        `)
          .eq("salon_id", ctx.salonId)
          .order("created_at", { ascending: false }),
        supabase
          .from("salon_staff")
          .select("id, name, commission_rate, working_hours")
          .eq("salon_id", ctx.salonId),
      ]);
      if (bookingsRes.error) throw new Error(bookingsRes.error.message);
      if (staffRes.error) throw new Error(staffRes.error.message);
      return { salon: ctx.salon, bookings: bookingsRes.data || [], staff: staffRes.data || [] };
    }),
    fetchBookingCommissionRates(),
  ]);
  if (!isSalonDbSuccess(result)) return salonDbFailure(result);
  return { success: true as const, ...result.data, commissionRates };
}

export async function fetchSalonBillingPage() {
  const [billingResult, plansResult] = await Promise.all([
    withSalonDb(async (supabase, ctx) => {
      const { plan } = await ensureSalonSubscriptionPlan(
        supabase,
        ctx.salonId,
        ctx.salon.subscription_plan_id as string | null | undefined
      );
      return { activePlan: plan };
    }),
    getPublicSubscriptionPlans(),
  ]);

  if (!isSalonDbSuccess(billingResult)) return salonDbFailure(billingResult);

  return {
    success: true as const,
    ...billingResult.data,
    availablePlans: plansResult.plans,
    plansLoadError: plansResult.success ? null : plansResult.error,
  };
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

    const [servicesRes, categoriesRes, globalServicesRes, staffRes] = await Promise.all([
      supabase.from("services").select("*").eq("salon_id", ctx.salonId).order("created_at", { ascending: false }),
      supabase.from("categories").select("*").order("name"),
      supabase.from("global_services").select("*").order("name"),
      supabase
        .from("salon_staff")
        .select("id, name, status, working_hours")
        .eq("salon_id", ctx.salonId),
    ]);

    for (const res of [servicesRes, categoriesRes, globalServicesRes, staffRes]) {
      if (res.error) throw new Error(res.error.message);
    }

    const staff = staffRes.data || [];
    const coveredServiceIds = [...getServiceIdsCoveredByStaff(staff)];

    const flags = readPlanFlags(plan);
    const categories = sliceAllowedCategories(
      categoriesRes.data || [],
      flags,
      (plan?.name as string | null | undefined) ?? null
    );

    return {
      salon,
      services: filterCatalogServices(servicesRes.data || []),
      staff,
      coveredServiceIds,
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

    const [staffRes, servicesRes, rolesRes, globalServicesRes] = await Promise.all([
      supabase.from("salon_staff").select("*").eq("salon_id", ctx.salonId),
      supabase
        .from("services")
        .select("*")
        .eq("salon_id", ctx.salonId)
        .order("name"),
      supabase.from("global_staff_roles").select("*").order("category"),
      supabase.from("global_services").select("*").order("name"),
    ]);

    for (const res of [staffRes, servicesRes, rolesRes, globalServicesRes]) {
      if (res.error) throw new Error(res.error.message);
    }

    const allRoles = rolesRes.data || [];
    const globalStaffRoles = allRoles.filter(r => r.category !== 'Grade');
    const globalSkillGrades = allRoles.filter(r => r.category === 'Grade').map(g => ({
      id: g.id,
      name: g.role_name
    }));

    return {
      salon: ctx.salon,
      staff: staffRes.data || [],
      salonServices: filterCatalogServices(servicesRes.data || []),
      globalServices: globalServicesRes.data || [],
      globalStaffRoles,
      globalSkillGrades,
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

    if (typesRes.error) throw new Error(typesRes.error.message);
    if (globalPackagesRes.error) throw new Error(globalPackagesRes.error.message);

    let packages = packagesRes.data || [];
    if (packagesRes.error) {
      if (!isMissingDbObjectError(packagesRes.error.message)) {
        throw new Error(packagesRes.error.message);
      }
      packages = [];
    }

    const flags = readPlanFlags(plan);
    let allowedTypes = typesRes.data || [];
    const typesLimit = Number(flags.allowed_promotion_types_limit);
    if (typesLimit && typesLimit > 0 && typesLimit < 999) {
      allowedTypes = allowedTypes.slice(0, typesLimit);
    }

    return {
      salon: ctx.salon,
      packages,
      promotionTypes: typesRes.data || [],
      allowedPromotionTypes: allowedTypes,
      globalPackages: globalPackagesRes.data || [],
      subscriptionPlan: plan,
      packagesTableMissing: Boolean(packagesRes.error),
    };
  });
  if (!isSalonDbSuccess(result)) return salonDbFailure(result);
  return { success: true as const, ...result.data };
}

export async function fetchSalonBookingDetail(bookingId: string) {
  const result = await withSalonDb(async (supabase, ctx) => {
    const { data, error } = await supabase
      .from("bookings")
      .select(SALON_BOOKINGS_SELECT)
      .eq("id", bookingId)
      .maybeSingle();
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

    const [
      amenitiesRes,
      salonAmenitiesRes,
      categoriesRes,
      globalServicesRes,
      servicesRes,
      globalStaffRolesRes,
      staffRes
    ] = await Promise.all([
      supabase.from("global_amenities").select("*").order("name"),
      supabase.from("salon_amenities").select("*").eq("salon_id", ctx.salonId),
      supabase.from("categories").select("id, name, slug").order("name"),
      supabase.from("global_services").select("*, categories(name)").eq("is_active", true),
      supabase.from("services").select("*").eq("salon_id", ctx.salonId),
      supabase.from("global_staff_roles").select("*").order("category"),
      supabase.from("salon_staff").select("*").eq("salon_id", ctx.salonId)
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
      globalServices: (globalServicesRes.data || []).map((s: any) => ({
        ...s,
        category: s.categories?.name || null,
        default_price: s.suggested_price || 0,
        default_duration: s.suggested_duration_minutes || 30,
        icon_image_url: s.icon || null
      })),
      services: servicesRes.data || [],
      globalStaffRoles: globalStaffRolesRes.data || [],
      staff: staffRes.data || [],
    };
  });
  if (!isSalonDbSuccess(result)) return salonDbFailure(result);
  return { success: true as const, ...result.data };
}

export async function fetchSalonCustomersPage() {
  const loyaltyResult = await fetchSalonLoyaltyRules();
  const loyaltyRules = loyaltyResult.success ? loyaltyResult.rules : [];

  const result = await withSalonDb(async (supabase, ctx) => {
    const { data: bookings, error } = await supabase
      .from("bookings")
      .select("customer_email, amount, status, created_at, booking_date")
      .eq("salon_id", ctx.salonId);

    if (error) throw new Error(error.message);

    const customersMap = new Map<
      string,
      {
        email: string;
        name: string;
        phone: string;
        visits: number;
        spent: number;
        rating: number;
        lastVisit: string;
        lastVisitDate: number;
      }
    >();

    const emails = [...new Set((bookings || []).map((b) => b.customer_email).filter(Boolean))];
    let usersData: Array<{ email: string; full_name?: string | null; phone?: string | null }> = [];
    if (emails.length > 0) {
      const { data: usersRes } = await supabase.from("users").select("email, full_name, phone").in("email", emails);
      if (usersRes) usersData = usersRes;
    }

    const usersByEmail = new Map<string, { full_name?: string | null; phone?: string | null }>();
    usersData.forEach((u) => {
      if (u.email) usersByEmail.set(u.email.toLowerCase(), u);
    });

    for (const b of bookings || []) {
      if (!b.customer_email) continue;

      const email = b.customer_email.toLowerCase();
      if (!customersMap.has(email)) {
        const user = usersByEmail.get(email);
        customersMap.set(email, {
          email,
          name: user?.full_name || "Guest",
          phone: user?.phone || "-",
          visits: 0,
          spent: 0,
          rating: 5,
          lastVisit: b.booking_date || b.created_at,
          lastVisitDate: new Date(b.created_at).getTime(),
        });
      }

      const c = customersMap.get(email)!;
      if (bookingCountsAsLoyaltyVisit(b.status)) {
        c.visits += 1;
      }
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
      .map((c) => {
        const displayTier = resolveHighestDisplayTier(c.visits, loyaltyRules);
        const isVip = resolveVipFromVisits(c.visits, loyaltyRules);
        return {
          name: c.name,
          email: c.email,
          phone: c.phone,
          isVip,
          loyaltyTier: displayTier?.tier_key || null,
          loyaltyTierLabel: displayTier?.tier_label || null,
          vipMinVisits: loyaltyRules.find((rule) => rule.tier_key === "vip" && rule.enabled)?.min_visits ?? null,
          bookings: c.visits,
          spent: "LKR " + c.spent.toLocaleString(),
          rating: 5,
          lastVisit: new Date(c.lastVisitDate).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
        };
      });

    return {
      salon: ctx.salon,
      customers: customersList,
      loyaltyRules,
    };
  });
  if (!isSalonDbSuccess(result)) return salonDbFailure(result);
  return { success: true as const, ...result.data };
}

export async function setSalonCustomerVip(customerEmail: string, isVip: boolean) {
  const normalizedEmail = customerEmail.trim().toLowerCase();
  if (!normalizedEmail || !normalizedEmail.includes("@")) {
    return { success: false as const, error: "A valid customer email is required." };
  }

  const result = await withSalonDb(async (supabase, ctx) => {
    const now = new Date().toISOString();
    const { error } = await supabase.from("salon_customer_profiles").upsert(
      {
        salon_id: ctx.salonId,
        customer_email: normalizedEmail,
        is_vip: isVip,
        marked_vip_at: isVip ? now : null,
        marked_vip_by: isVip ? ctx.email : null,
        updated_at: now,
      },
      { onConflict: "salon_id,customer_email" }
    );

    if (error) throw new Error(error.message);
    return { email: normalizedEmail, isVip };
  });

  if (!isSalonDbSuccess(result)) {
    return salonDbFailure(
      result,
      "VIP status could not be saved. Run packages/db/SALON_CUSTOMER_VIP_PATCH.sql in Supabase SQL Editor."
    );
  }

  return { success: true as const, ...result.data };
}
