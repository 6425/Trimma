"use server";

import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { requireAgentFromCookies } from "@/lib/server-agent-auth";

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
        "id, name, slug, address, phone, category, owner_gmail, onboarding_status, booking_enabled, created_at"
      )
      .eq("assign_to", auth.email)
      .order("created_at", { ascending: false });

    if (error) {
      return { success: false as const, error: error.message };
    }

    return { success: true as const, salons: data || [], agentEmail: auth.email };
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
