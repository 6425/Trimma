"use server";

import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { getSalonAccessTokenFromCookies } from "@/lib/server-salon-auth";

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
  amenitiesData: Record<string, { has_amenity: boolean; quantity: number | null }> | null = null
) {
  const accessToken = await getSalonAccessTokenFromCookies();
  if (!accessToken) return { success: false as const, error: "Not authenticated" };

  const supabaseAdmin = createSupabaseAdminClient();

  try {
    const finalPayload = { ...updatePayload };
    if (newStatus) {
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
  agentEmail: string
) {
  const accessToken = await getSalonAccessTokenFromCookies();
  if (!accessToken) return { success: false as const, error: "Not authenticated" };

  const supabaseAdmin = createSupabaseAdminClient();

  try {
    // 1. Create Salon
    const { data: salon, error: createError } = await supabaseAdmin
      .from("salons")
      .insert({
        ...payload,
        assign_to: agentEmail,
        onboarding_status: "ASSIGNED_TO_AGENT",
        activation_status: "INACTIVE"
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

