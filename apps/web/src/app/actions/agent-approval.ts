"use server";

import { createServerSupabaseClient } from "@/config/supabase-server";
import { createSupabaseAdminClient } from "@/config/supabase-admin";

import { sendAgentApprovalAlerts } from "@/app/actions/whatsapp";
import { sendAgentApprovalEmail } from "@/app/actions/email-settings";
import { notifyRegionalHeadOfTeamEvent } from "@/lib/agent-lead-notifications";
import { APP_BASE_URL } from "@/lib/email/config";
import { normalizeEmail } from "@/lib/normalize-email";

export async function approveSalon(salonId: string) {
  try {
    const supabase = createSupabaseAdminClient();
    
    // Update salon status
    const { error: updateError, data: salon } = await supabase
      .from("salons")
      .update({ 
        onboarding_status: "AGENT_APPROVED",
        is_verified: false,
        status: "active",
        activation_status: "ACTIVE",
        booking_enabled: true,
        public_visibility: "preview",
      })
      .eq("id", salonId)
      .select("owner_id, owner_email, phone, name, assign_to")
      .single();

    if (updateError) throw updateError;

    // Create in-app notification using existing salon_owner_notifications table
    if (salon?.owner_email) {
      await supabase.from("salon_owner_notifications").insert({
        salon_id: salonId,
        user_email: salon.owner_email,
        notification_type: "SALON_APPROVED",
        title: "Salon Approved!",
        body: `Your operational profile for ${salon.name} was approved. Service bookings can start after contact details are complete. Complete business and bank verification to earn your verified badge and 50% reservation deposits.`,
        metadata: {}
      });
    }

    // Trigger real WhatsApp & Email
    if (salon?.phone) {
      await sendAgentApprovalAlerts(salonId, salon.phone, salon.name || "your salon");
    }
    if (salon?.owner_email) {
      await sendAgentApprovalEmail(salon.name || "your salon", salon.owner_email);
    }

    const assignTo = normalizeEmail(salon?.assign_to || "");
    if (assignTo) {
      void notifyRegionalHeadOfTeamEvent(
        supabase,
        assignTo,
        salon?.name || "Salon",
        "Salon approved and live",
        `${APP_BASE_URL}/regional-head`,
        salonId
      ).catch((err) => console.error("Regional head approval notification failed:", err));
    }

    return { success: true };
  } catch (error: any) {
    console.error("Approve Salon Error:", error);
    return { success: false, error: error.message };
  }
}

export async function rejectSalon(salonId: string, reason: string) {
  try {
    const supabase = createSupabaseAdminClient();
    
    // Update salon status back to ASSIGNED_TO_AGENT so the owner can edit and resubmit
    const { error: updateError, data: salon } = await supabase
      .from("salons")
      .update({ 
        onboarding_status: "ASSIGNED_TO_AGENT",
        rejection_reason: reason
      })
      .eq("id", salonId)
      .select("owner_id, owner_email, phone, name")
      .single();

    if (updateError) throw updateError;

    // Create in-app notification
    if (salon?.owner_email) {
      await supabase.from("salon_owner_notifications").insert({
        salon_id: salonId,
        user_email: salon.owner_email,
        notification_type: "SALON_REJECTED",
        title: "Action Required: Salon Profile",
        body: `Your salon profile requires changes before approval. Reason: ${reason}`,
        metadata: {}
      });
    }

    // Note: Rejection alerts are currently only sent via in-app notifications above.
    // There is no WhatsApp or Email trigger template defined for rejections.

    return { success: true };
  } catch (error: any) {
    console.error("Reject Salon Error:", error);
    return { success: false, error: error.message };
  }
}
