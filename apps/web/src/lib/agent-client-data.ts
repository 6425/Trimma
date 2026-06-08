import { supabase } from "@/config/supabase";
import { getAgentEmailFast } from "@/lib/client-auth";
import { isAgentSalonLive, getAgentSalonStatusLabel } from "@/lib/agent-salons";
import { formatRelativeTime } from "@/lib/dashboard-stats";
import { normalizeEmail } from "@/lib/normalize-email";
import { resolveTrimmaUserRole } from "@/lib/trimma-role";
import type { TrimmaUserRole } from "@/lib/auth-routes";
import type { WorkItem } from "@/app/actions/agent-work-queue";
import {
  buildAgentTerritories,
  findAgentRecord,
  formatAgentTerritoryLabel,
  resolveAgentMapAgentId,
  territorySearchOrClause,
} from "@/lib/agent-territory-resolve";

const AGENT_SERVER_FALLBACK_ERRORS = /agent not found|agent profile not found|unexpected response/i;

/** Prefer server action; on failure use client Supabase (app-managed). */
export async function tryAgentData<T extends { success: boolean; error?: string }>(
  serverFn: () => Promise<T>,
  clientFn: () => Promise<T>,
  options?: { clientFirst?: boolean }
): Promise<T> {
  if (options?.clientFirst) {
    try {
      const clientRes = await clientFn();
      if (clientRes.success) return clientRes;
    } catch {
      // fall through to server
    }
  }

  try {
    const res = await serverFn();
    if (res.success) return res;
    if (AGENT_SERVER_FALLBACK_ERRORS.test(res.error || "")) {
      return clientFn();
    }
  } catch {
    // Server action unavailable (e.g. functions down on preview).
  }
  return clientFn();
}

export async function getAgentEmailFromClient(): Promise<string | null> {
  const fast = getAgentEmailFast();
  if (fast) return normalizeEmail(fast);
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return normalizeEmail(session?.user?.email) || null;
}

async function requireAgentEmailClient(): Promise<
  { success: true; email: string; userId: string; role: TrimmaUserRole } | { success: false; error: string }
> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user?.email) {
    return { success: false, error: "Not authenticated" };
  }
  const role = await resolveTrimmaUserRole(session.user.id, session.user.email);
  if (role !== "agent" && role !== "admin") {
    return { success: false, error: "Unauthorized access" };
  }
  return {
    success: true,
    email: normalizeEmail(session.user.email)!,
    userId: session.user.id,
    role,
  };
}

// --- Dashboard (re-exported for page-client) ---

export async function loadAgentDashboardFromClient() {
  const auth = await requireAgentEmailClient();
  if (auth.success === false) return { success: false as const, error: auth.error };

  const email = auth.email;
  const { data: userData } = await supabase
    .from("users")
    .select("full_name")
    .eq("email", email)
    .maybeSingle();

  const agentName = userData?.full_name || email.split("@")[0];

  const [
    { data: salonRows },
    { data: agentProfile },
    { data: bookingRows },
    { data: ledgerRows },
  ] = await Promise.all([
    supabase
      .from("salons")
      .select("id, name, address, phone, rating, onboarding_status, created_at")
      .eq("assign_to", email)
      .order("created_at", { ascending: false }),
    supabase.from("agents").select("id, commission_rate").eq("user_email", email).maybeSingle(),
    supabase.from("bookings").select("agent_commission_amount").eq("agent_email", email),
    supabase.from("commission_ledger").select("*").eq("agent_email", email),
  ]);

  const agentRow = await findAgentRecord(supabase, email, auth.userId);
  const territoryLabel = formatAgentTerritoryLabel(
    await buildAgentTerritories(supabase, email, agentRow ?? agentProfile)
  );

  const salons = salonRows || [];
  const hotLeads = salons.slice(0, 3);
  const pendingSalons = salons
    .filter((s) => !isAgentSalonLive(s.onboarding_status) && s.onboarding_status !== "REJECTED")
    .slice(0, 5);

  return {
    success: true as const,
    data: {
      agentEmail: email,
      agentName,
      territoryLabel,
      stats: {
        assignedCount: salons.length,
        convertedCount: salons.filter((s) => isAgentSalonLive(s.onboarding_status)).length,
        commissionRate: agentProfile?.commission_rate || 10,
        bookingCommissions: (bookingRows || []).reduce(
          (sum, b) => sum + (Number(b.agent_commission_amount) || 0),
          0
        ),
        subscriptionCommissions: (ledgerRows || [])
          .filter((e) => String(e.commission_category || "").toLowerCase() === "subscription")
          .reduce((sum, e) => sum + (Number(e.amount) || 0), 0),
        hotLeads,
        upcomingTasks: pendingSalons.map((salon) => {
          const status = salon.onboarding_status || "ASSIGNED_TO_AGENT";
          let type: "call" | "msg" | "visit" = "call";
          if (status === "OWNER_INVITED") type = "msg";
          if (status === "AGENT_VERIFIED" || status === "OWNER_ACTIVATED") type = "visit";
          return {
            id: salon.id,
            task: `${salon.name} · ${getAgentSalonStatusLabel(status)}`,
            time: formatRelativeTime(salon.created_at),
            type,
            status,
          };
        }),
      },
    },
  };
}

// --- Profile ---

export async function fetchAgentProfileClient() {
  const auth = await requireAgentEmailClient();
  if (auth.success === false) return { success: false as const, error: auth.error };

  const { data, error } = await supabase
    .from("users")
    .select("full_name, email, phone, avatar_url")
    .eq("email", auth.email)
    .maybeSingle();

  if (error) return { success: false as const, error: error.message };

  let territory = "No territory assigned";
  try {
    const agentRow = await findAgentRecord(supabase, auth.email, auth.userId);
    territory = formatAgentTerritoryLabel(
      await buildAgentTerritories(supabase, auth.email, agentRow)
    );
  } catch {
    // Client RLS may block agents/agent_territories until FIX_AGENT_CLIENT_RLS.sql is applied.
  }

  return {
    success: true as const,
    profile: {
      fullName: data?.full_name || "",
      email: data?.email || auth.email,
      phone: data?.phone || "",
      avatarUrl: data?.avatar_url || "",
      territory,
    },
  };
}

// --- Salons list ---

export async function fetchAgentSalonsListClient() {
  const auth = await requireAgentEmailClient();
  if (auth.success === false) return { success: false as const, error: auth.error };

  const { data, error } = await supabase
    .from("salons")
    .select(
      "id, name, slug, address, phone, category, owner_gmail, onboarding_status, booking_enabled, created_at"
    )
    .eq("assign_to", auth.email)
    .order("created_at", { ascending: false });

  if (error) return { success: false as const, error: error.message };
  return { success: true as const, salons: data || [], agentEmail: auth.email };
}

// --- Leads ---

export async function fetchAgentAssignedLeadsClient() {
  const auth = await requireAgentEmailClient();
  if (auth.success === false) return { success: false as const, error: auth.error };

  const { data, error } = await supabase
    .from("salons")
    .select("*")
    .eq("assign_to", auth.email)
    .not("onboarding_status", "in", '("VERIFIED","REJECTED")')
    .order("created_at", { ascending: false });

  if (error) return { success: false as const, error: error.message };
  return {
    success: true as const,
    leads: data || [],
    agentEmail: auth.email,
    agentName: auth.email.split("@")[0],
  };
}

export async function fetchAgentManualLeadsClient() {
  const auth = await requireAgentEmailClient();
  if (auth.success === false) return { success: false as const, error: auth.error };

  const { data, error } = await supabase
    .from("salon_leads")
    .select("*")
    .eq("assign_to", auth.email)
    .neq("lead_status", "CONVERTED")
    .order("created_at", { ascending: false });

  if (error) return { success: false as const, error: error.message };
  return {
    success: true as const,
    leads: data || [],
    agentEmail: auth.email,
  };
}

export async function fetchAgentLeadEditorDataClient(salonId: string) {
  const auth = await requireAgentEmailClient();
  if (auth.success === false) return { success: false as const, error: auth.error };
  if (!salonId) return { success: false as const, error: "Salon ID is required." };

  const { data: salon, error: salonError } = await supabase
    .from("salons")
    .select("id, assign_to")
    .eq("id", salonId)
    .maybeSingle();

  if (salonError || !salon) {
    return { success: false as const, error: salonError?.message || "Salon not found." };
  }
  if (salon.assign_to && salon.assign_to !== auth.email) {
    return { success: false as const, error: "You do not have access to this lead." };
  }

  const [servicesRes, amenitiesRes] = await Promise.all([
    supabase
      .from("services")
      .select("global_service_id, price, duration_min, category")
      .eq("salon_id", salonId),
    supabase.from("salon_amenities").select("*").eq("salon_id", salonId),
  ]);

  if (servicesRes.error) return { success: false as const, error: servicesRes.error.message };
  if (amenitiesRes.error) return { success: false as const, error: amenitiesRes.error.message };

  return {
    success: true as const,
    services: servicesRes.data || [],
    amenities: amenitiesRes.data || [],
  };
}

// --- Globals (services, staff roles, amenities) ---

export async function fetchAgentGlobalsClient() {
  const auth = await requireAgentEmailClient();
  if (auth.success === false) return { success: false as const, error: auth.error };

  const [svcRes, staffRes, amenitiesRes] = await Promise.all([
    supabase.from("global_services").select("*, categories(name)").eq("is_active", true),
    supabase.from("global_staff_roles").select("*").order("category"),
    supabase.from("global_amenities").select("*").order("name"),
  ]);

  const services = (svcRes.data || []).map((s: Record<string, unknown>) => ({
    ...s,
    category: (s.categories as { name?: string } | null)?.name || null,
    default_price: (s.suggested_price as number) || 0,
    default_duration: (s.suggested_duration_minutes as number) || 30,
    icon_image_url: (s.icon as string) || null,
  }));

  return {
    success: true as const,
    services,
    staffRoles: staffRes.data || [],
    amenities: amenitiesRes.data || [],
  };
}

// --- Territory map ---

export async function getAgentMapDataClient() {
  const auth = await requireAgentEmailClient();
  if (auth.success === false) return { success: false as const, error: auth.error };

  try {
    const agentRow = await findAgentRecord(supabase, auth.email, auth.userId);
    const territories = await buildAgentTerritories(supabase, auth.email, agentRow);
    const { data: catData } = await supabase.from("categories").select("name").order("name");

    return {
      success: true as const,
      agentId: resolveAgentMapAgentId(auth.email, agentRow),
      territories,
      categories: catData?.map((c) => c.name) || [],
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load territory data";
    return { success: false as const, error: message };
  }
}

export async function searchBusinessesInTerritoriesClient(
  categories: string[],
  territoryIds: string[]
) {
  const auth = await requireAgentEmailClient();
  if (auth.success === false) return { success: false as const, error: auth.error };

  let terrNames: string[] = [];
  let query = supabase
    .from("salons")
    .select(
      "id, slug, name, category, address, city, phone, latitude, longitude, location, logo_url, is_verified, rating, review_count, status"
    );

  if (territoryIds.length > 0) {
    const realIds = territoryIds.filter((id) => !id.startsWith("primary-"));
    const primaryNames = territoryIds
      .filter((id) => id.startsWith("primary-"))
      .map((id) => id.replace("primary-", ""));
    terrNames = [...primaryNames];

    if (realIds.length > 0) {
      const { data: terrs } = await supabase.from("territories").select("name").in("id", realIds);
      if (terrs?.length) terrNames = [...terrNames, ...terrs.map((t) => t.name)];
    }

    if (terrNames.length > 0) {
      const orClause = territorySearchOrClause(terrNames);
      if (orClause) query = query.or(orClause);
    }
  }

  if (categories.length > 0 && !categories.includes("All Categories")) {
    const orClauses = categories.map((cat) => `category.ilike.%${cat}%`).join(",");
    query = query.or(orClauses);
  }

  if (terrNames.length === 0) {
    query = query.or(`assign_to.eq.${auth.email},assign_to.ilike.${auth.email}`);
  }

  const { data, error } = await query;
  if (error) return { success: false as const, error: error.message };

  return { success: true as const, businesses: data || [] };
}

// --- Commissions ---

export async function fetchAgentCommissionsClient() {
  const auth = await requireAgentEmailClient();
  if (auth.success === false) return { success: false as const, error: auth.error };

  const email = auth.email;

  const [masterRes, agentRow, salonsRes, bookingsByAgentRes, ledgerRes] = await Promise.all([
    supabase
      .from("commission_master")
      .select("commission_type, agent_percentage, active")
      .eq("active", true),
    findAgentRecord(supabase, email, auth.userId),
    supabase.from("salons").select("id, name").eq("assign_to", email),
    supabase
      .from("bookings")
      .select(
        "id, salon_id, booking_date, status, amount, customer_email, agent_commission_amount, agent_commission_percent, salons(name)"
      )
      .eq("agent_email", email)
      .order("booking_date", { ascending: false }),
    supabase
      .from("commission_ledger")
      .select("*")
      .eq("agent_email", email)
      .order("created_at", { ascending: false }),
  ]);

  const bookingMaster = (masterRes.data || []).find((r) => r.commission_type === "booking");
  const subscriptionMaster = (masterRes.data || []).find((r) => r.commission_type === "subscription");
  const bookingAgentPct =
    Number(bookingMaster?.agent_percentage) ||
    Number(agentRow?.commission_rate) ||
    20;
  const subscriptionAgentPct = Number(subscriptionMaster?.agent_percentage) || 20;

  const salonMap = new Map<string, string>();
  for (const salon of salonsRes.data || []) {
    salonMap.set(salon.id, salon.name);
  }

  const bookingIds = new Set<string>();
  const bookings: Array<{
    id: string;
    salon_id: string;
    salon_name: string;
    booking_date: string;
    status: string;
    amount: number;
    customer_email: string;
    agent_cut: number;
    agent_percent: number;
  }> = [];

  const pushBooking = (row: Record<string, unknown>) => {
    const id = String(row.id);
    if (bookingIds.has(id)) return;
    bookingIds.add(id);

    const amount = Number(row.amount) || 0;
    const storedPct = Number(row.agent_commission_percent);
    const agentPercent = storedPct > 0 ? storedPct : bookingAgentPct;
    const storedCut = Number(row.agent_commission_amount);
    const agentCut = storedCut > 0 ? storedCut : amount * (agentPercent / 100);
    const salonsJoin = row.salons as { name?: string } | { name?: string }[] | null;
    const joinedName = Array.isArray(salonsJoin) ? salonsJoin[0]?.name : salonsJoin?.name;

    bookings.push({
      id,
      salon_id: String(row.salon_id || ""),
      salon_name: joinedName || salonMap.get(String(row.salon_id)) || "Referred Salon",
      booking_date: String(row.booking_date || ""),
      status: String(row.status || "pending"),
      amount,
      customer_email: String(row.customer_email || "—"),
      agent_cut: agentCut,
      agent_percent: agentPercent,
    });
  };

  for (const row of bookingsByAgentRes.data || []) {
    pushBooking(row as Record<string, unknown>);
  }

  const salonIds = [...salonMap.keys()];
  if (salonIds.length > 0) {
    const { data: salonBookings } = await supabase
      .from("bookings")
      .select(
        "id, salon_id, booking_date, status, amount, customer_email, agent_commission_amount, agent_commission_percent, salons(name)"
      )
      .in("salon_id", salonIds)
      .order("booking_date", { ascending: false });

    for (const row of salonBookings || []) {
      pushBooking(row as Record<string, unknown>);
    }
  }

  bookings.sort(
    (a, b) => new Date(b.booking_date).getTime() - new Date(a.booking_date).getTime()
  );

  const subscriptions = (ledgerRes.data || [])
    .filter((row) => String(row.commission_category || "").toLowerCase() === "subscription")
    .map((row) => ({
      id: row.id,
      amount: Number(row.amount) || 0,
      status: row.status || "PENDING",
      notes: row.notes,
      created_at: row.created_at,
    }));

  let allTimeBookingGross = 0;
  bookings.forEach((b) => {
    if (b.status === "completed" || b.status === "confirmed") {
      allTimeBookingGross += b.amount;
    }
  });

  return {
    success: true as const,
    agentEmail: email,
    bookingAgentPct,
    subscriptionAgentPct,
    profileCommissionRate: Number(agentRow?.commission_rate) || bookingAgentPct,
    referredSalonCount: salonIds.length,
    bookings,
    subscriptions,
    allTimeBookingGross,
  };
}

// --- Work queue ---

export async function fetchAgentWorkQueueClient(agentEmail: string) {
  if (!agentEmail) throw new Error("Agent email is required");

  const workItems: WorkItem[] = [];

  const { data: leads } = await supabase
    .from("salons")
    .select("id, name, onboarding_status, created_at, updated_at")
    .eq("assign_to", agentEmail)
    .not("onboarding_status", "in", '("VERIFIED","REJECTED","COMPLETED")');

  (leads || []).forEach((lead) => {
    let priority: "HIGH" | "MEDIUM" | "LOW" = "MEDIUM";
    let action = "Follow up";
    if (lead.onboarding_status === "ASSIGNED_TO_AGENT" || lead.onboarding_status === "UNVERIFIED") {
      priority = "HIGH";
      action = lead.onboarding_status === "ASSIGNED_TO_AGENT" ? "Verify Lead Details" : "Verify Profile Data";
    }
    const daysSince =
      (Date.now() - new Date(lead.updated_at || lead.created_at).getTime()) / (1000 * 3600 * 24);
    if (daysSince > 3) priority = "HIGH";

    workItems.push({
      id: `lead-${lead.id}`,
      type: "LEAD",
      businessName: lead.name,
      businessId: lead.id,
      currentStatus: lead.onboarding_status || "NEW",
      lastActivityDate: lead.updated_at || lead.created_at,
      priority,
      recommendedAction: action,
      actionUrl: `/agent/leads?open=${lead.id}`,
    });
  });

  const { data: salons } = await supabase
    .from("salons")
    .select("id, name, onboarding_status, activation_status, updated_at")
    .eq("assign_to", agentEmail)
    .eq("onboarding_status", "VERIFIED");

  (salons || []).forEach((salon) => {
    workItems.push({
      id: `salon-${salon.id}`,
      type: "SALON",
      businessName: salon.name,
      businessId: salon.id,
      currentStatus: salon.activation_status === "ACTIVE" ? "Active" : "Awaiting Owner Activation",
      lastActivityDate: salon.updated_at || new Date().toISOString(),
      priority: salon.activation_status === "ACTIVE" ? "LOW" : "HIGH",
      recommendedAction:
        salon.activation_status === "ACTIVE" ? "Review Performance" : "Assist Owner Activation",
      actionUrl: `/salons/${salon.id}`,
    });
  });

  const { data: commissions } = await supabase
    .from("commission_ledger")
    .select("id, amount, status, created_at, salon_id")
    .eq("agent_email", agentEmail)
    .eq("status", "PENDING");

  (commissions || []).forEach((comm) => {
    workItems.push({
      id: `comm-${comm.id}`,
      type: "COMMISSION",
      businessName: `Commission: LKR ${comm.amount}`,
      businessId: comm.salon_id || "N/A",
      currentStatus: "Pending Payout",
      lastActivityDate: comm.created_at,
      priority: "MEDIUM",
      recommendedAction: "Review Payout",
      actionUrl: `/agent`,
    });
  });

  const staleDate = new Date();
  staleDate.setDate(staleDate.getDate() - 7);
  (leads || []).forEach((lead) => {
    if (new Date(lead.updated_at || lead.created_at) < staleDate) {
      workItems.push({
        id: `alert-${lead.id}`,
        type: "ALERT",
        businessName: lead.name,
        businessId: lead.id,
        currentStatus: "Stale / No Activity",
        lastActivityDate: lead.updated_at || lead.created_at,
        priority: "HIGH",
        recommendedAction: "Reach Out Immediately",
        actionUrl: `/agent/leads?open=${lead.id}`,
      });
    }
  });

  const { data: activityLogs } = await supabase
    .from("agent_activity_logs")
    .select("*")
    .eq("agent_email", agentEmail)
    .order("created_at", { ascending: false })
    .limit(5);

  const priorityWeight = { HIGH: 3, MEDIUM: 2, LOW: 1 };

  return {
    workItems: workItems.sort((a, b) => {
      if (priorityWeight[a.priority] !== priorityWeight[b.priority]) {
        return priorityWeight[b.priority] - priorityWeight[a.priority];
      }
      return new Date(b.lastActivityDate).getTime() - new Date(a.lastActivityDate).getTime();
    }),
    metrics: {
      totalAssignedLeads: leads?.length || 0,
      verifiedSalons: salons?.length || 0,
      pendingCommissionsCount: commissions?.length || 0,
      totalCommissionAmount: (commissions || []).reduce(
        (acc, c) => acc + (Number(c.amount) || 0),
        0
      ),
      performanceScore:
        (leads?.length || 0) + (salons?.length || 0) === 0
          ? 0
          : Math.round(((salons?.length || 0) / ((leads?.length || 0) + (salons?.length || 0))) * 100),
    },
    activityLogs: activityLogs || [],
  };
}
