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
  newStatus: string | null
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

    // 4. Log Activity
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
