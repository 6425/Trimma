"use server";

import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { requireAgentFromCookies } from "@/lib/server-agent-auth";

/**
 * Attach the actual amount we charge each salon, taken from the latest
 * successful subscription payment (payments.raw_response.type = 'subscription').
 * Best-effort: if the payments table is unreadable, salons are returned unchanged.
 */
async function attachSubscriptionCharges<T extends { id: string }>(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  salons: T[]
): Promise<T[]> {
  if (salons.length === 0) return salons;
  const salonIds = salons.map((s) => s.id);

  const { data: payments, error } = await supabase
    .from("payments")
    .select("salon_id, amount, currency, raw_response, created_at, status")
    .in("salon_id", salonIds)
    .eq("status", "success")
    .order("created_at", { ascending: false });

  if (error || !payments) return salons;

  // First (latest) successful subscription payment per salon.
  const latestBySalon = new Map<string, (typeof payments)[number]>();
  for (const p of payments) {
    const raw = (p.raw_response || {}) as Record<string, unknown>;
    if (raw.type !== "subscription") continue;
    if (!p.salon_id) continue;
    if (!latestBySalon.has(p.salon_id)) latestBySalon.set(p.salon_id, p);
  }

  return salons.map((salon) => {
    const p = latestBySalon.get(salon.id);
    if (!p) return salon;
    const raw = (p.raw_response || {}) as Record<string, unknown>;
    return {
      ...salon,
      subscription_charge: p.amount == null ? null : Number(p.amount),
      subscription_currency: (p.currency as string) || "LKR",
      subscription_billing_cycle: (raw.billing_cycle as string) || null,
      subscription_plan_name: (raw.plan_name as string) || null,
    };
  });
}

export async function fetchAgentAssignedLeads() {
  const auth = await requireAgentFromCookies();
  if ("error" in auth) {
    return { success: false as const, error: auth.error };
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("salons")
      .select("*")
      .eq("assign_to", auth.email)
      .not("onboarding_status", "in", '("VERIFIED","REJECTED")')
      .order("created_at", { ascending: false });

    if (error) {
      return { success: false as const, error: error.message };
    }

    return {
      success: true as const,
      leads: data || [],
      agentEmail: auth.email,
      agentName: auth.email.split("@")[0],
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load leads.";
    return { success: false as const, error: message };
  }
}

export async function fetchAgentLeadEditorData(salonId: string) {
  const auth = await requireAgentFromCookies();
  if ("error" in auth) {
    return { success: false as const, error: auth.error };
  }

  if (!salonId) {
    return { success: false as const, error: "Salon ID is required." };
  }

  try {
    const supabase = createSupabaseAdminClient();

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

    if (servicesRes.error) {
      return { success: false as const, error: servicesRes.error.message };
    }
    if (amenitiesRes.error) {
      return { success: false as const, error: amenitiesRes.error.message };
    }

    return {
      success: true as const,
      services: servicesRes.data || [],
      amenities: amenitiesRes.data || [],
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load lead data.";
    return { success: false as const, error: message };
  }
}

export async function fetchAgentSalonsList() {
  const auth = await requireAgentFromCookies();
  if ("error" in auth) {
    return { success: false as const, error: auth.error };
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("salons")
      .select(
        "id, name, slug, address, phone, category, owner_gmail, onboarding_status, booking_enabled, created_at, subscription_plan_id, subscription_plans(name, monthly_price, intro_monthly_price)"
      )
      .eq("assign_to", auth.email)
      .order("created_at", { ascending: false });

    if (error) {
      return { success: false as const, error: error.message };
    }

    const salons = await attachSubscriptionCharges(supabase, data || []);
    return { success: true as const, salons, agentEmail: auth.email };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load salons.";
    return { success: false as const, error: message };
  }
}

export async function fetchAgentSalonServiceIds(salonId: string) {
  const auth = await requireAgentFromCookies();
  if ("error" in auth) {
    return { success: false as const, error: auth.error };
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("services")
      .select("id, global_service_id")
      .eq("salon_id", salonId);

    if (error) {
      return { success: false as const, error: error.message };
    }

    return { success: true as const, services: data || [] };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load services.";
    return { success: false as const, error: message };
  }
}

export async function fetchAgentManualLeads() {
  const auth = await requireAgentFromCookies();
  if ("error" in auth) {
    return { success: false as const, error: auth.error };
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("salon_leads")
      .select("*")
      .eq("assign_to", auth.email)
      .neq("lead_status", "CONVERTED")
      .order("created_at", { ascending: false });

    if (error) {
      return { success: false as const, error: error.message };
    }

    return {
      success: true as const,
      leads: data || [],
      agentEmail: auth.email,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load manual leads.";
    return { success: false as const, error: message };
  }
}
