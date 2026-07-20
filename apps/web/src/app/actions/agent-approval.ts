"use server";

import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { notifyRegionalHeadOfTeamEvent } from "@/lib/agent-lead-notifications";
import { APP_BASE_URL } from "@/lib/email/config";
import { normalizeEmail } from "@/lib/normalize-email";
import { ownerResubmitStatusAfterRejection } from "@/lib/salon-onboarding-paths";
import { notifyOwnerSubmissionRejected } from "@/app/actions/salon-onboarding-notifications";
import { isMissingRejectionReasonColumnError } from "@/lib/with-admin-db";

/** Return owner to field editing after agent rejects their submitted profile (Field Editor only). */
export async function rejectSalonOwnerSubmission(salonId: string, reason: string) {
  try {
    const supabase = createSupabaseAdminClient();
    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      return { success: false as const, error: "A rejection reason is required." };
    }

    const { data: existing, error: readError } = await supabase
      .from("salons")
      .select("source_type")
      .eq("id", salonId)
      .single();

    if (readError || !existing) {
      return { success: false as const, error: readError?.message || "Salon not found." };
    }

    const resubmitStatus = ownerResubmitStatusAfterRejection(existing.source_type);

    const rejectPayload = {
      onboarding_status: resubmitStatus,
      booking_enabled: false,
      rejection_reason: trimmedReason,
    };

    let { error: updateError, data: salon } = await supabase
      .from("salons")
      .update(rejectPayload)
      .eq("id", salonId)
      .select("owner_id, owner_email, owner_gmail, phone, name, assign_to, source_type")
      .single();

    // Older DBs may lack rejection_reason; still reject and keep the note in admin_notes.
    if (updateError && isMissingRejectionReasonColumnError(updateError.message)) {
      ({ error: updateError, data: salon } = await supabase
        .from("salons")
        .update({
          onboarding_status: resubmitStatus,
          booking_enabled: false,
          admin_notes: `Rejection reason: ${trimmedReason}`,
        })
        .eq("id", salonId)
        .select("owner_id, owner_email, owner_gmail, phone, name, assign_to, source_type")
        .single());
    }

    if (updateError) throw updateError;

    const ownerEmail = normalizeEmail(salon?.owner_email || salon?.owner_gmail || "");

    await notifyOwnerSubmissionRejected({
      salonId,
      salonName: salon?.name || "Your salon",
      ownerPhone: salon?.phone,
      ownerEmail: ownerEmail || null,
      reason: trimmedReason,
    });

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
