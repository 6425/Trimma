"use server";

import { createServerSupabaseClient } from "@/config/supabase-server";

import { sendAgentApprovalAlert, sendAgentRejectionAlert } from "@/app/actions/whatsapp";
import { sendAgentApprovalEmail, sendAgentRejectionEmail } from "@/app/actions/email-settings";

export async function approveSalon(salonId: string) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Update salon status
    const { error: updateError, data: salon } = await supabase
      .from("salons")
      .update({ 
        onboarding_status: "APPROVED",
        is_verified: true,
        status: "active" // Assuming 'active' is the approved state for status if applicable
      })
      .eq("id", salonId)
      .select("owner_id, owner_email, phone, name")
      .single();

    if (updateError) throw updateError;

    // Create in-app notification using existing salon_owner_notifications table
    if (salon?.owner_email) {
      await supabase.from("salon_owner_notifications").insert({
        salon_id: salonId,
        user_email: salon.owner_email,
        notification_type: "SALON_APPROVED",
        title: "Salon Approved!",
        body: `Your salon profile for ${salon.name} has been approved and is now live on Trimma.`,
        metadata: {}
      });
    }

    // Trigger real WhatsApp & Email
    if (salon?.phone) {
      await sendAgentApprovalAlert(salonId, salon.phone, salon.name || "your salon", salon.owner_email || "");
    }
    if (salon?.owner_email) {
      await sendAgentApprovalEmail(salonId, salon.owner_email, salon.name || "your salon");
    }

    return { success: true };
  } catch (error: any) {
    console.error("Approve Salon Error:", error);
    return { success: false, error: error.message };
  }
}

export async function rejectSalon(salonId: string, reason: string) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Update salon status
    const { error: updateError, data: salon } = await supabase
      .from("salons")
      .update({ 
        onboarding_status: "REJECTED",
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

    // Trigger real WhatsApp & Email
    if (salon?.phone) {
      await sendAgentRejectionAlert(salonId, salon.phone, salon.name || "your salon", salon.owner_email || "", reason);
    }
    if (salon?.owner_email) {
      await sendAgentRejectionEmail(salonId, salon.owner_email, salon.name || "your salon", reason);
    }

    return { success: true };
  } catch (error: any) {
    console.error("Reject Salon Error:", error);
    return { success: false, error: error.message };
  }
}
