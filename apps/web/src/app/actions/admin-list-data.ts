"use server";

import { adminDbFailure, isAdminDbSuccess, withAdminDb } from "@/lib/with-admin-db";

export async function fetchAdminSubscriptionPlans() {
  const result = await withAdminDb(async (supabase) => {
    const { data, error } = await supabase.from("subscription_plans").select("*").order("monthly_price");
    if (error) throw new Error(error.message);
    return { plans: data || [] };
  });
  if (!isAdminDbSuccess(result)) return adminDbFailure(result);
  return { success: true as const, plans: result.data.plans };
}

export async function fetchAdminSalons() {
  const result = await withAdminDb(async (supabase) => {
    const { data, error } = await supabase.from("salons").select("*").order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { salons: data || [] };
  });
  if (!isAdminDbSuccess(result)) return adminDbFailure(result);
  return { success: true as const, salons: result.data.salons };
}

export async function fetchAdminBookings() {
  const result = await withAdminDb(async (supabase) => {
    const { data, error } = await supabase
      .from("bookings")
      .select("*, salons ( id, name )")
      .order("booking_date", { ascending: false })
      .order("booking_time", { ascending: false });
    if (error) throw new Error(error.message);
    return { bookings: data || [] };
  });
  if (!isAdminDbSuccess(result)) return adminDbFailure(result);
  return { success: true as const, bookings: result.data.bookings };
}

export async function fetchAdminUsers(role?: string | null) {
  const result = await withAdminDb(async (supabase) => {
    let query = supabase.from("users").select("*").order("email");
    if (role) {
      if (role === "regional_head") {
        query = query.in("global_role", ["regional_head", "regional_admin"]);
      } else {
        query = query.eq("global_role", role);
      }
    }
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return { users: data || [] };
  });
  if (!isAdminDbSuccess(result)) return adminDbFailure(result);
  return { success: true as const, users: result.data.users };
}

export async function fetchAdminPaymentsPage() {
  const result = await withAdminDb(async (supabase) => {
    const [settingsRes, paymentsRes] = await Promise.all([
      supabase.from("global_payment_settings").select("*").maybeSingle(),
      supabase.from("payments").select("*, salons ( id, name )").order("created_at", { ascending: false }).limit(100),
    ]);
    if (settingsRes.error) throw new Error(settingsRes.error.message);
    if (paymentsRes.error) throw new Error(paymentsRes.error.message);
    return { settings: settingsRes.data, payments: paymentsRes.data || [] };
  });
  if (!isAdminDbSuccess(result)) return adminDbFailure(result);
  return { success: true as const, ...result.data };
}

export async function fetchAdminFinancePage() {
  const result = await withAdminDb(async (supabase) => {
    const [rolesRes, commissionRes, salonsRes, bookingsRes] = await Promise.all([
      supabase.from("user_roles").select("user_id, role").eq("role", "admin"),
      supabase.from("commission_master").select("*"),
      supabase.from("salons").select("id, name, owner_email, subscription_plan_id"),
      supabase
        .from("bookings")
        .select(
          "id, booking_no, booking_date, booking_time, amount, status, payment_status, reservation_fee_paid, customer_email, created_at, platform_commission_amount, salon_upfront_amount, agent_commission_amount, agent_commission_percent, agent_email, salon_id"
        )
        .order("booking_date", { ascending: false }),
    ]);
    if (rolesRes.error) throw new Error(rolesRes.error.message);
    if (commissionRes.error) throw new Error(commissionRes.error.message);
    if (salonsRes.error) throw new Error(salonsRes.error.message);
    if (bookingsRes.error) throw new Error(bookingsRes.error.message);

    // Subscription ledger is optional: it only exists after SUBSCRIPTION_COMMISSION_PATCH.
    // Select base columns only (no salons embed / patched columns) and tolerate absence.
    let subscriptionLedger: any[] = [];
    const ledgerRes = await supabase
      .from("commission_ledger")
      .select("*")
      .order("created_at", { ascending: false });
    if (!ledgerRes.error) {
      subscriptionLedger = ledgerRes.data || [];
    }

    return {
      adminRoles: rolesRes.data || [],
      commissionMaster: commissionRes.data || [],
      salons: salonsRes.data || [],
      bookings: bookingsRes.data || [],
      subscriptionLedger,
    };
  });
  if (!isAdminDbSuccess(result)) return adminDbFailure(result);
  return { success: true as const, ...result.data };
}

export async function fetchAdminCommissionsPage() {
  const result = await withAdminDb(async (supabase) => {
    const [commissionRes, rulesRes] = await Promise.all([
      supabase.from("commission_master").select("*"),
      supabase.from("commission_rules").select("*").order("tier_min"),
    ]);
    if (commissionRes.error) throw new Error(commissionRes.error.message);
    return {
      commissionMaster: commissionRes.data || [],
      commissionRules: rulesRes.error ? [] : rulesRes.data || [],
    };
  });
  if (!isAdminDbSuccess(result)) return adminDbFailure(result);
  return { success: true as const, ...result.data };
}

export async function fetchAdminAgentsPage() {
  const result = await withAdminDb(async (supabase) => {
    const [usersRes, agentsRes, userRolesRes, leadsRes, assignmentsRes, catalogRes, ledgerRes, logsRes, pendingLedgerRes] = await Promise.all([
        supabase.from("users").select("*").order("email"),
        supabase.from("agents").select("*"),
        supabase.from("user_roles").select("user_id, role"),
        supabase.from("salon_leads").select("*").order("created_at", { ascending: false }),
        supabase
          .from("agent_territories")
          .select(
            "agent_id, territory_id, created_at, agents ( id, user_email ), territories ( id, name, type, slug, parent_id )"
          )
          .order("created_at", { ascending: false }),
        supabase.from("territories").select("id, name, type, slug, parent_id").order("name"),
        supabase.from("commission_ledger").select("*").order("created_at", { ascending: false }).limit(50),
        supabase.from("agent_activity_logs").select("*").order("created_at", { ascending: false }).limit(50),
        supabase.from("commission_ledger").select("amount").eq("status", "PENDING")
      ]);
    for (const res of [usersRes, agentsRes, userRolesRes, leadsRes, assignmentsRes, catalogRes, ledgerRes, logsRes, pendingLedgerRes]) {
      if (res.error) throw new Error(res.error.message);
    }

    const totalPending = (pendingLedgerRes.data || []).reduce((sum, l) => sum + parseFloat(l.amount || 0), 0);

    return {
      users: usersRes.data || [],
      agents: agentsRes.data || [],
      userRoles: userRolesRes.data || [],
      leads: leadsRes.data || [],
      agentTerritories: assignmentsRes.data || [],
      territoryCatalog: catalogRes.data || [],
      ledger: ledgerRes.data || [],
      activityLogs: logsRes.data || [],
      totalPendingPayouts: totalPending,
    };
  });
  if (!isAdminDbSuccess(result)) return adminDbFailure(result);
  return { success: true as const, ...result.data };
}

export async function fetchAdminLeadsPage() {
  const result = await withAdminDb(async (supabase) => {
    const [salonsRes, usersRes, rolesRes, plansRes, catRes] = await Promise.all([
      supabase.from("salons").select("*").order("created_at", { ascending: false }),
      supabase.from("users").select("*"),
      supabase.from("global_staff_roles").select("*"),
      supabase.from("subscription_plans").select("*"),
      supabase.from("categories").select("name").order("name"),
    ]);
    for (const res of [salonsRes, usersRes, rolesRes, plansRes, catRes]) {
      if (res.error) throw new Error(res.error.message);
    }
    return {
      salons: salonsRes.data || [],
      users: usersRes.data || [],
      staffRoles: rolesRes.data || [],
      subscriptionPlans: plansRes.data || [],
      categories: catRes.data?.map(c => c.name) || [],
    };
  });
  if (!isAdminDbSuccess(result)) return adminDbFailure(result);
  return { success: true as const, ...result.data };
}

export async function fetchAdminDashboard() {
  const result = await withAdminDb(async (supabase) => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoIso = weekAgo.toISOString();

    const [
      salonsRes,
      salonsWeekRes,
      bookingsCountRes,
      bookingsRowsRes,
      pendingSalonsRowsRes,
      usersRes,
      activeSalonsRes,
      onboardingLogsRes,
      recentBookingsRes,
      recentSalonsRes,
      recentServicesRes,
    ] = await Promise.all([
      supabase.from("salons").select("id", { count: "exact", head: true }),
      supabase.from("salons").select("id", { count: "exact", head: true }).gte("created_at", weekAgoIso),
      supabase.from("bookings").select("id", { count: "exact", head: true }),
      supabase.from("bookings").select("amount, total_reservation_fee, status"),
      supabase.from("salons").select("id, status, onboarding_status, is_verified"),
      supabase.from("users").select("email", { count: "exact", head: true }),
      supabase
        .from("salons")
        .select("subscription_plan_id, subscription_plans(monthly_price, intro_monthly_price)")
        .or("activation_status.eq.ACTIVE,status.eq.active,status.eq.verified,is_verified.eq.true"),
      supabase
        .from("onboarding_logs")
        .select("id, action, notes, actor_email, created_at, salons(name)")
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("bookings")
        .select("id, booking_no, amount, total_reservation_fee, created_at, salons(name)")
        .order("created_at", { ascending: false })
        .limit(3),
      supabase
        .from("salons")
        .select("id, name, onboarding_status, created_at, verified_at")
        .order("created_at", { ascending: false })
        .limit(3),
      supabase
        .from("global_services")
        .select("id, name, created_at")
        .order("created_at", { ascending: false })
        .limit(2),
    ]);

    for (const res of [
      salonsRes,
      salonsWeekRes,
      bookingsCountRes,
      bookingsRowsRes,
      pendingSalonsRowsRes,
      usersRes,
      activeSalonsRes,
      onboardingLogsRes,
      recentBookingsRes,
      recentSalonsRes,
      recentServicesRes,
    ]) {
      if (res.error) throw new Error(res.error.message);
    }

    return {
      salonsCount: salonsRes.count || 0,
      salonsThisWeek: salonsWeekRes.count || 0,
      bookingsCount: bookingsCountRes.count || 0,
      bookingRows: bookingsRowsRes.data || [],
      pendingSalons: pendingSalonsRowsRes.data || [],
      usersCount: usersRes.count || 0,
      activeSalons: activeSalonsRes.data || [],
      onboardingLogs: onboardingLogsRes.data || [],
      recentBookings: recentBookingsRes.data || [],
      recentSalons: recentSalonsRes.data || [],
      recentServices: recentServicesRes.data || [],
    };
  });

  if (!isAdminDbSuccess(result)) return adminDbFailure(result);
  return { success: true as const, ...result.data };
}
