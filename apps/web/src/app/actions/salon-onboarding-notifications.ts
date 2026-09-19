"use server";

import { createSupabaseAdminClient } from "@/config/supabase-admin";
import {
  sendAdminApprovalEmail,
  sendAgentApprovalEmail,
  sendOwnerSubmissionRejectedEmail,
  sendTriggeredEmail,
} from "@/app/actions/email-settings";
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
  const { data: existing } = await supabase
    .from("salon_owner_notifications")
    .select("id")
    .eq("salon_id", salonId)
    .eq("user_email", email)
    .eq("notification_type", notificationType)
    .is("read_at", null)
    .limit(1)
    .maybeSingle();

  if (existing?.id) return;

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

  await Promise.allSettled([
    params.ownerPhone
      ? sendAdminApprovalAlerts(params.salonId, params.ownerPhone, salonName)
      : Promise.resolve(),
    ownerEmail ? sendAdminApprovalEmail(salonName, ownerEmail) : Promise.resolve(),
    insertSalonOwnerInAppNotification(
      params.salonId,
      ownerEmail,
      "SALON_VERIFIED",
      "Your salon is live on Trimma",
      `${salonName} is verified. Customers can now find and book you on the Trimma marketplace.`
    ),
  ]);

  return { success: true as const };
}

/** Agent completes field review → PENDING_ADMIN_VERIFICATION. */
export async function notifyAgentApprovedSalonForAdmin(params: {
  salonId: string;
  salonName: string;
  ownerPhone?: string | null;
  ownerEmail?: string | null;
}) {
  const salonName = params.salonName || "Your salon";
  const ownerEmail = normalizeEmail(params.ownerEmail || "") || null;

  await Promise.allSettled([
    params.ownerPhone
      ? sendAgentApprovalAlerts(params.salonId, params.ownerPhone, salonName)
      : Promise.resolve(),
    sendAgentApprovalEmail(salonName, ownerEmail || ""),
    insertSalonOwnerInAppNotification(
      params.salonId,
      ownerEmail,
      "AGENT_APPROVED",
      "Profile approved by your Trimma agent",
      `${salonName} was approved by your Trimma agent and sent to Trimma admin for final verification.`
    ),
  ]);

  return { success: true as const };
}

/** Owner submitted profile for booking approval. */
export async function notifyOwnerSubmissionAcknowledged(params: {
  salonId: string;
  salonName: string;
  ownerEmail: string;
  reviewTarget?: "agent" | "admin";
}) {
  const reviewer = params.reviewTarget === "admin" ? "Trimma admin" : "your Trimma agent";
  const ownerEmail = normalizeEmail(params.ownerEmail);
  await Promise.allSettled([
    insertSalonOwnerInAppNotification(
      params.salonId,
      ownerEmail,
      "OWNER_SUBMITTED",
      "Profile submitted for review",
      `We received your booking profile for ${params.salonName || "your salon"}. ${reviewer} will review it shortly.`
    ),
    ownerEmail
      ? sendTriggeredEmail({
          triggerId: "partner-lead-received",
          to: ownerEmail,
          variables: {
            owner_name: ownerEmail.split("@")[0],
            salon_name: params.salonName || "Your salon",
            salon_address: `Submitted to ${reviewer} for booking approval`,
          },
          rateLimitKey: `owner-submit:${params.salonId}:${ownerEmail}`,
          idempotencyKey: `owner-submit/${params.salonId}/${ownerEmail}`,
        })
      : Promise.resolve(),
  ]);

  return { success: true as const };
}

/** Admin rejected salon from onboarding pipeline. */
export async function notifyAdminRejectedSalon(params: {
  salonId: string;
  salonName: string;
  ownerPhone?: string | null;
  ownerEmail?: string | null;
  reason: string;
}) {
  const reason = params.reason.trim() || "Please contact Trimma support for details.";
  const ownerEmail = normalizeEmail(params.ownerEmail || "") || null;
  await Promise.allSettled([
    params.ownerPhone
      ? sendOwnerSubmissionRejectedAlert(
          params.salonId,
          params.ownerPhone,
          params.salonName || "Your salon",
          reason
        )
      : Promise.resolve(),
    ownerEmail
      ? sendOwnerSubmissionRejectedEmail(params.salonName || "Your salon", ownerEmail, reason)
      : Promise.resolve(),
    insertSalonOwnerInAppNotification(
      params.salonId,
      ownerEmail,
      "SALON_REJECTED",
      "Salon application requires attention",
      `${params.salonName || "Your salon"} was not approved. Reason: ${reason}`
    ),
  ]);

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

  await Promise.allSettled([
    params.ownerPhone
      ? sendOwnerSubmissionRejectedAlert(params.salonId, params.ownerPhone, salonName, reason)
      : Promise.resolve(),
    ownerEmail
      ? sendOwnerSubmissionRejectedEmail(salonName, ownerEmail, reason)
      : Promise.resolve(),
    insertSalonOwnerInAppNotification(
      params.salonId,
      ownerEmail,
      "SALON_REJECTED",
      "Action required: Salon profile",
      `${salonName} requires updates before approval. Reason: ${reason}`
    ),
  ]);

  return { success: true as const };
}

/** Fresh self-serve draft created after the duplicate check. */
export async function notifyOwnerDraftCreated(params: {
  salonId: string;
  salonName: string;
  salonAddress: string;
  ownerEmail: string;
  ownerName?: string | null;
}) {
  const ownerEmail = normalizeEmail(params.ownerEmail);
  if (!ownerEmail) return { success: false as const, error: "Owner email is missing." };

  await Promise.allSettled([
    insertSalonOwnerInAppNotification(
      params.salonId,
      ownerEmail,
      "ONBOARDING_STARTED",
      "Complete your Trimma salon profile",
      `${params.salonName} was created as a private draft. Add services, staff, images and booking details, then submit it for review.`
    ),
    sendTriggeredEmail({
      triggerId: "partner-lead-received",
      to: ownerEmail,
      variables: {
        owner_name: params.ownerName || ownerEmail.split("@")[0],
        salon_name: params.salonName,
        salon_address: params.salonAddress,
      },
      rateLimitKey: `owner-draft:${params.salonId}:${ownerEmail}`,
      idempotencyKey: `owner-draft/${params.salonId}/${ownerEmail}`,
    }),
  ]);

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
