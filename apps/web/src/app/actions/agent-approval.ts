"use server";

import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { notifyRegionalHeadOfTeamEvent } from "@/lib/agent-lead-notifications";
import { APP_BASE_URL } from "@/lib/email/config";
import { normalizeEmail } from "@/lib/normalize-email";

/** Return owner to field editing after agent rejects their submitted profile (Field Editor only). */
export async function rejectSalonOwnerSubmission(salonId: string, reason: string) {
  try {
    const supabase = createSupabaseAdminClient();
    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      return { success: false as const, error: "A rejection reason is required." };
    }

    const { error: updateError, data: salon } = await supabase
      .from("salons")
      .update({
        onboarding_status: "ASSIGNED_TO_AGENT",
        booking_enabled: false,
        rejection_reason: trimmedReason,
      })
      .eq("id", salonId)
      .select("owner_id, owner_email, phone, name, assign_to")
      .single();

    if (updateError) throw updateError;

    if (salon?.owner_email) {
      await supabase.from("salon_owner_notifications").insert({
        salon_id: salonId,
        user_email: salon.owner_email,
        notification_type: "SALON_REJECTED",
        title: "Action Required: Salon Profile",
        body: `Your salon profile requires changes before approval. Reason: ${trimmedReason}`,
        metadata: {},
      });
    }

    await supabase.from("onboarding_logs").insert({
      salon_id: salonId,
      actor_email: salon?.assign_to || "agent@trimma.io",
      action: "OWNER_SUBMISSION_REJECTED",
      notes: trimmedReason,
    });

    const assignTo = normalizeEmail(salon?.assign_to || "");
    if (assignTo) {
      void notifyRegionalHeadOfTeamEvent(
        supabase,
        assignTo,
        salon?.name || "Salon",
        "Owner submission rejected",
        `${APP_BASE_URL}/regional-head`,
        salonId
      ).catch((err) => console.error("Regional head rejection notification failed:", err));
    }

    return { success: true as const };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Rejection failed.";
    console.error("Reject Salon Owner Submission Error:", error);
    return { success: false as const, error: message };
  }
}
