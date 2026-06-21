"use server";

import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { sendAdminApprovalEmail, sendAgentApprovalEmail, sendOwnerSubmissionRejectedEmail } from "@/app/actions/email-settings";
import { sendAdminApprovalAlerts, sendAgentApprovalAlerts, sendOwnerSubmissionRejectedAlert } from "@/app/actions/whatsapp";
import { normalizeEmail } from "@/lib/normalize-email";
import { notifyAgentLeadAssigned } from "@/lib/agent-lead-notifications";

async function insertSalonOwnerInAppNotification(
  salonId: string,
  ownerEmail: string | null | undefined,
  notificationType: string,
  title: string,
  body: string
) {
  const email = normalizeEmail(ownerEmail || "");
  if (!email) return;

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("salon_owner_notifications").insert({
    salon_id: salonId,
    user_email: email,
    notification_type: notificationType,
    title,
    body,
    metadata: {},
  });

  if (error) {
    console.error(`Salon owner notification (${notificationType}) failed:`, error.message);
  }
}

/** Admin → Leads verify: salon goes VERIFIED and live. */
export async function notifySalonVerifiedByAdmin(params: {
  salonId: string;
  salonName: string;
  ownerPhone?: string | null;
  ownerEmail?: string | null;
}) {
  const salonName = params.salonName || "Your salon";
  const ownerEmail = normalizeEmail(params.ownerEmail || "") || null;

  if (params.ownerPhone) {
    void sendAdminApprovalAlerts(params.salonId, params.ownerPhone, salonName).catch((err) =>
      console.error("Admin verify WhatsApp failed:", err)
    );
  }

  if (ownerEmail) {
    void sendAdminApprovalEmail(salonName, ownerEmail).catch((err) =>
      console.error("Admin verify owner email failed:", err)
    );
  }

  void insertSalonOwnerInAppNotification(
    params.salonId,
    ownerEmail,
    "SALON_VERIFIED",
    "Your salon is live on Trimma",
    `${salonName} is verified. Customers can now find and book you on the Trimma marketplace.`
  );

  return { success: true as const };
}

/** Agent enables booking → PENDING_ADMIN_VERIFICATION. */
export async function notifyAgentApprovedSalonForAdmin(params: {
  salonId: string;
  salonName: string;
  ownerPhone?: string | null;
  ownerEmail?: string | null;
}) {
  const salonName = params.salonName || "Your salon";
  const ownerEmail = normalizeEmail(params.ownerEmail || "") || null;

  if (params.ownerPhone) {
    void sendAgentApprovalAlerts(params.salonId, params.ownerPhone, salonName).catch((err) =>
      console.error("Agent approval WhatsApp failed:", err)
    );
  }

  void sendAgentApprovalEmail(salonName, ownerEmail || "").catch((err) =>
    console.error("Agent approval email failed:", err)
  );

  void insertSalonOwnerInAppNotification(
    params.salonId,
    ownerEmail,
    "AGENT_APPROVED",
    "Profile approved by your Trimma agent",
    `${salonName} was approved by your Trimma agent and sent to Trimma admin for final verification.`
  );

  return { success: true as const };
}

/** Owner submitted profile for booking approval. */
export async function notifyOwnerSubmissionAcknowledged(params: {
  salonId: string;
  salonName: string;
  ownerEmail: string;
}) {
  void insertSalonOwnerInAppNotification(
    params.salonId,
    params.ownerEmail,
    "OWNER_SUBMITTED",
    "Profile submitted for review",
    `We received your booking profile for ${params.salonName || "your salon"}. Your Trimma agent will review it shortly.`
  );

  return { success: true as const };
}

/** Admin rejected salon from onboarding pipeline. */
export async function notifyAdminRejectedSalon(params: {
  salonId: string;
  salonName: string;
  ownerEmail?: string | null;
  reason: string;
}) {
  const reason = params.reason.trim() || "Please contact Trimma support for details.";
  void insertSalonOwnerInAppNotification(
    params.salonId,
    params.ownerEmail,
    "SALON_REJECTED",
    "Salon application requires attention",
    `${params.salonName || "Your salon"} was not approved. Reason: ${reason}`
  );

  return { success: true as const };
}

/** Agent returns owner profile for corrections (not admin rejection). */
export async function notifyOwnerSubmissionRejected(params: {
  salonId: string;
  salonName: string;
  ownerPhone?: string | null;
  ownerEmail?: string | null;
  reason: string;
}) {
  const salonName = params.salonName || "Your salon";
  const ownerEmail = normalizeEmail(params.ownerEmail || "") || null;
  const reason = params.reason.trim() || "Please update your salon profile and resubmit.";

  if (params.ownerPhone) {
    void sendOwnerSubmissionRejectedAlert(
      params.salonId,
      params.ownerPhone,
      salonName,
      reason
    ).catch((err) => console.error("Owner rejection WhatsApp failed:", err));
  }

  if (ownerEmail) {
    void sendOwnerSubmissionRejectedEmail(salonName, ownerEmail, reason).catch((err) =>
      console.error("Owner rejection email failed:", err)
    );
  }

  void insertSalonOwnerInAppNotification(
    params.salonId,
    ownerEmail,
    "SALON_REJECTED",
    "Action required: Salon profile",
    `${salonName} requires updates before approval. Reason: ${reason}`
  );

  return { success: true as const };
}

/** Admin sends a discovered lead to the assigned field agent. */
export async function notifyAgentOfSalonAssignment(salonId: string) {
  const supabase = createSupabaseAdminClient();
  const { data: salon, error } = await supabase
    .from("salons")
    .select("id, name, address, assign_to, onboarding_status")
    .eq("id", salonId)
    .maybeSingle();

  if (error || !salon?.assign_to) {
    return { success: false as const, error: error?.message || "No agent assigned" };
  }

  void notifyAgentLeadAssigned(supabase, {
    salonId: salon.id,
    salonName: salon.name || "Salon lead",
    salonAddress: salon.address,
    assignToEmail: salon.assign_to,
    onboardingStatus: salon.onboarding_status || "ASSIGNED_TO_AGENT",
  });

  return { success: true as const };
}
