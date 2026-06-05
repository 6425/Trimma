"use server";

import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { requireAgentFromCookies } from "@/lib/server-agent-auth";

export async function saveAgentLeadData(
  salonId: string,
  updatePayload: any,
  servicesData: {
    svcsToAdd: any[];
    svcsToRemoveIds: string[];
  } | null,
  staffToAdd: any[] | null,
  agentEmail: string,
  newStatus: string | null,
  amenitiesData: Record<string, { has_amenity: boolean; quantity: number | null }> | null = null,
  actionType: "DRAFT" | "REVIEW" = "DRAFT"
) {
  const auth = await requireAgentFromCookies();
  if ("error" in auth) return { success: false as const, error: auth.error };

  const supabaseAdmin = createSupabaseAdminClient();

  try {
    const finalPayload = { ...updatePayload };
    
    // Explicitly set visibility and booking status to false for leads
    finalPayload.public_visibility = false;
    finalPayload.booking_enabled = false;
    finalPayload.activation_status = "INACTIVE";

    if (actionType === "REVIEW") {
      finalPayload.onboarding_status = "ASSIGNED_TO_OWNER";
      if (finalPayload.owner_gmail) {
        finalPayload.owner_email = finalPayload.owner_gmail;
      }
    } else if (newStatus) {
      finalPayload.onboarding_status = newStatus;
    }

    // 1. Update Salon Data
    const { error: updateError } = await supabaseAdmin
      .from("salons")
      .update(finalPayload)
      .eq("id", salonId);

    if (updateError) throw updateError;

    // 2. Sync Services
    if (servicesData) {
      if (servicesData.svcsToAdd.length > 0) {
        await supabaseAdmin.from("services").insert(servicesData.svcsToAdd);
      }
      if (servicesData.svcsToRemoveIds.length > 0) {
        await supabaseAdmin.from("services").delete().in("id", servicesData.svcsToRemoveIds);
      }
    }

    // 3. Add Staff
    if (staffToAdd && staffToAdd.length > 0) {
      await supabaseAdmin.from("salon_staff").insert(staffToAdd);
    }

    // 4. Sync Amenities
    if (amenitiesData) {
      // Delete old amenities
      await supabaseAdmin.from("salon_amenities").delete().eq("salon_id", salonId);
      
      const amenityInserts = Object.keys(amenitiesData)
        .filter((amenityId) => amenitiesData[amenityId].has_amenity)
        .map((amenityId) => ({
          salon_id: salonId,
          amenity_id: amenityId,
          quantity: amenitiesData[amenityId].quantity || null,
        }));
      
      if (amenityInserts.length > 0) {
        await supabaseAdmin.from("salon_amenities").insert(amenityInserts);
      }
    }

    // 5. Log Activity
    const actionMap: Record<string, string> = {
      "AGENT_VERIFIED": "AGENT_VERIFIED",
      "AGENT_APPROVED": "AGENT_APPROVED"
    };
    
    await supabaseAdmin.from("onboarding_logs").insert({
      salon_id: salonId,
      actor_email: agentEmail,
      action: newStatus ? (actionMap[newStatus] || "LEAD_UPDATED") : "LEAD_UPDATED",
      notes: newStatus === "AGENT_VERIFIED" 
        ? "Agent completed field verification and added phone/email."
        : newStatus === "AGENT_APPROVED" 
        ? "Agent approved the salon and enabled bookings."
        : "Agent updated salon details in field editor."
    });

    return { success: true as const };
  } catch (err: any) {
    console.error("Agent lead save failed:", err);
    return { success: false as const, error: err.message || "Failed to save lead." };
  }
}

export async function createAgentLeadData(
  payload: any,
  servicesData: { svcsToAdd: any[] } | null,
  staffToAdd: any[] | null,
  amenitiesData: Record<string, { has_amenity: boolean; quantity: number | null }> | null,
  agentEmail: string,
  actionType: "DRAFT" | "REVIEW" = "DRAFT"
) {
  const auth = await requireAgentFromCookies();
  if ("error" in auth) return { success: false as const, error: auth.error };

  const supabaseAdmin = createSupabaseAdminClient();

  try {
    // 1. Create Salon
    const { data: salon, error: createError } = await supabaseAdmin
      .from("salons")
      .insert({
        ...payload,
        assign_to: agentEmail,
        onboarding_status: actionType === "REVIEW" ? "ASSIGNED_TO_OWNER" : "ASSIGNED_TO_AGENT",
        activation_status: "INACTIVE",
        public_visibility: false,
        booking_enabled: false,
        owner_email: actionType === "REVIEW" && payload.owner_gmail ? payload.owner_gmail : `draft-${payload.slug}@trimma.io`
      })
      .select("id")
      .single();

    if (createError) throw createError;
    const salonId = salon.id;

    // 2. Sync Services
    if (servicesData && servicesData.svcsToAdd.length > 0) {
      const svcsToAdd = servicesData.svcsToAdd.map(s => ({ ...s, salon_id: salonId }));
      await supabaseAdmin.from("services").insert(svcsToAdd);
    }

    // 3. Add Staff
    if (staffToAdd && staffToAdd.length > 0) {
      const staff = staffToAdd.map(s => ({ ...s, salon_id: salonId }));
      await supabaseAdmin.from("salon_staff").insert(staff);
    }

    // 4. Sync Amenities
    if (amenitiesData) {
      const amenityInserts = Object.keys(amenitiesData)
        .filter((amenityId) => amenitiesData[amenityId].has_amenity)
        .map((amenityId) => ({
          salon_id: salonId,
          amenity_id: amenityId,
          quantity: amenitiesData[amenityId].quantity || null,
        }));
      
      if (amenityInserts.length > 0) {
        await supabaseAdmin.from("salon_amenities").insert(amenityInserts);
      }
    }

    // 5. Log Activity
    await supabaseAdmin.from("onboarding_logs").insert({
      salon_id: salonId,
      actor_email: agentEmail,
      action: "LEAD_CREATED",
      notes: "Agent created a new manual lead from the field."
    });

    return { success: true as const, salonId };
  } catch (err: any) {
    console.error("Agent lead create failed:", err);
    return { success: false as const, error: err.message || "Failed to create lead." };
  }
}

export async function fetchAgentGlobals() {
  const auth = await requireAgentFromCookies();
  if ("error" in auth) {
    return { success: false as const, error: auth.error };
  }

  const supabaseAdmin = createSupabaseAdminClient();
  const [svcRes, staffRes, amenitiesRes] = await Promise.all([
    supabaseAdmin.from("global_services").select("*, categories(name)").eq("is_active", true),
    supabaseAdmin.from("global_staff_roles").select("*").order("category"),
    supabaseAdmin.from("global_amenities").select("*").order("name")
  ]);
  
  const services = (svcRes.data || []).map((s: any) => ({
    ...s,
    category: s.categories?.name || null,
    default_price: s.suggested_price || 0,
    default_duration: s.suggested_duration_minutes || 30,
    icon_image_url: s.icon || null
  }));

  return {
    success: true as const,
    services: services,
    staffRoles: staffRes.data || [],
    amenities: amenitiesRes.data || []
  };
}
