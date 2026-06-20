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
import { getServiceIdsCoveredByStaff } from "@/lib/staff-allocation";

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
      logo_url: salon.logo_url as string | null,
      cover_url: salon.cover_url as string | null,
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
          `id, booking_no, amount, total_reservation_fee, salon_upfront_amount, platform_commission_amount, agent_commission_amount, staff_commission_amount, staff_commission_percent, status, booking_date, booking_time, created_at, customer_email, staff_id, service_id,
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
        .select("id, name, commission_rate, working_hours, created_at")
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

export async function fetchSalonBookingsPage() {
  const result = await withSalonDb(async (supabase, ctx) => {
    const { data, error } = await supabase
      .from("bookings")
      .select(SALON_BOOKINGS_SELECT)
      .eq("salon_id", ctx.salonId)
      .order("booking_date", { ascending: false })
      .order("booking_time", { ascending: false });
    if (error) throw new Error(error.message);
    return { salon: ctx.salon, bookings: data || [] };
  });
  if (!isSalonDbSuccess(result)) return salonDbFailure(result);
  return { success: true as const, ...result.data };
}

export async function fetchSalonCalendarBookings(startDateStr: string, endDateStr: string) {
  const result = await withSalonDb(async (supabase, ctx) => {
    // Note: To join users via customer_email foreign key in Supabase, we can use users!bookings_customer_email_fkey(...) if needed,
    // but users(full_name) usually works if there's only one FK to users. Let's select what we need.
    const { data, error } = await supabase
      .from("bookings")
      .select(`
        id, 
        booking_date, 
        booking_time, 
        status, 
        customer_email,
        services (name)
      `)
      .eq("salon_id", ctx.salonId)
      .gte("booking_date", startDateStr)
      .lte("booking_date", endDateStr)
      .order("booking_date", { ascending: true })
      .order("booking_time", { ascending: true });
      
    if (error) throw new Error(error.message);

    const bookingsList = data || [];
    
    // Fetch users separately
    const emails = [...new Set(bookingsList.map(b => b.customer_email).filter(Boolean))];
    let usersMap: Record<string, string> = {};
    if (emails.length > 0) {
      const { data: usersData } = await supabase
        .from("users")
        .select("email, full_name")
        .in("email", emails);
        
      if (usersData) {
        usersData.forEach(u => {
          usersMap[u.email] = u.full_name || u.email;
        });
      }
    }

    // Map the returned data to a cleaner format
    const mappedBookings = bookingsList.map((b: any) => {
      let clientName = b.customer_email ? (usersMap[b.customer_email] || b.customer_email) : "Guest";
      
      let serviceName = "General Booking";
      if (b.services) {
        serviceName = Array.isArray(b.services) ? b.services[0]?.name : b.services.name;
      }

      return {
        id: b.id,
        booking_date: b.booking_date,
        booking_time: b.booking_time,
        status: b.status,
        clientName: clientName || b.customer_email || "Guest",
        serviceName: serviceName || "General Booking"
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
      services: servicesRes.data || [],
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
      salonServices: (servicesRes.data || []).filter((service: { status?: string | null }) => {
        const status = (service.status || "active").toLowerCase();
        return status !== "deleted";
      }),
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
  const result = await withSalonDb(async (supabase, ctx) => {
    const { data: bookings, error } = await supabase
      .from("bookings")
      .select("customer_email, amount, status, created_at, booking_date")
      .eq("salon_id", ctx.salonId);

    if (error) throw new Error(error.message);

    const customersMap = new Map();

    const emails = [...new Set((bookings || []).map(b => b.customer_email).filter(Boolean))];
    let usersData: any[] = [];
    let vipByEmail = new Map<string, boolean>();
    if (emails.length > 0) {
      const [usersRes, vipRes] = await Promise.all([
        supabase.from("users").select("email, full_name, phone").in("email", emails),
        supabase
          .from("salon_customer_profiles")
          .select("customer_email, is_vip")
          .eq("salon_id", ctx.salonId)
          .in("customer_email", emails),
      ]);
      if (usersRes.data) usersData = usersRes.data;
      if (vipRes.error && !vipRes.error.message.toLowerCase().includes("does not exist")) {
        throw new Error(vipRes.error.message);
      }
      (vipRes.data || []).forEach((row) => {
        if (row.customer_email) {
          vipByEmail.set(String(row.customer_email).toLowerCase(), Boolean(row.is_vip));
        }
      });
    }
    
    const usersByEmail = new Map();
    usersData.forEach(u => {
      if (u.email) usersByEmail.set(u.email.toLowerCase(), u);
    });

    for (const b of bookings || []) {
      if (!b.customer_email) continue;
      
      const email = b.customer_email.toLowerCase();
      if (!customersMap.has(email)) {
        const user = usersByEmail.get(email);
        customersMap.set(email, {
          email: email,
          name: user?.full_name || "Guest",
          phone: user?.phone || "-",
          isVip: vipByEmail.get(email) ?? false,
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
        isVip: c.isVip,
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
