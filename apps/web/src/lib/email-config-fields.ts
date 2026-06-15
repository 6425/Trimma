import {
  EMAIL_BODY_DEFAULTS,
  EMAIL_BODY_SINHALA_DEFAULTS,
  EMAIL_BODY_TAMIL_DEFAULTS,
  EMAIL_SUBJECT_DEFAULTS,
  EMAIL_TRIGGER_CATALOG,
} from "@/lib/email-templates";

/** Builds default template fields for EmailConfig from catalog + locale defaults. */
export function buildDefaultEmailTemplateFields(): Record<string, string | boolean> {
  const fields: Record<string, string | boolean> = {
    enabled: true,
    adminAlertEmail: "",
    resendApiKey: "",
    fromEmail: "no-reply@trimma.io",
    fromName: "Trimma",
    reservationPaidEnabled: true,
    bookingConfirmedEnabled: true,
    bookingRescheduledEnabled: true,
    bookingCancelledEnabled: true,
    bookingReviewEnabled: true,
    onboardingInviteEnabled: true,
    bookingCreatedEnabled: true,
    agentApprovalEnabled: true,
    adminApprovalEnabled: true,
    welcomeCustomerEnabled: true,
    agentLeadAssignedEnabled: true,
    partnerLeadReceivedEnabled: true,
  };

  for (const trigger of EMAIL_TRIGGER_CATALOG) {
    fields[trigger.subjectKey] = EMAIL_SUBJECT_DEFAULTS[trigger.defaultSubject];
    fields[trigger.bodyKey] = EMAIL_BODY_DEFAULTS[trigger.defaultBody];
    fields[trigger.bodyKeySi] = EMAIL_BODY_SINHALA_DEFAULTS[trigger.defaultBody];
    fields[trigger.bodyKeyTa] = EMAIL_BODY_TAMIL_DEFAULTS[trigger.defaultBody];
  }

  return fields;
}

/** Maps DB snake_case columns to EmailConfig camelCase keys. */
export const EMAIL_DB_COLUMN_MAP: Record<string, string> = {
  email_enabled: "enabled",
  email_admin_alert_email: "adminAlertEmail",
  resend_api_key: "resendApiKey",
  resend_from_email: "fromEmail",
  resend_from_name: "fromName",
  email_reservation_paid_enabled: "reservationPaidEnabled",
  email_booking_confirmed_enabled: "bookingConfirmedEnabled",
  email_booking_rescheduled_enabled: "bookingRescheduledEnabled",
  email_booking_cancelled_enabled: "bookingCancelledEnabled",
  email_booking_review_enabled: "bookingReviewEnabled",
  email_onboarding_invite_enabled: "onboardingInviteEnabled",
  email_booking_created_enabled: "bookingCreatedEnabled",
  email_agent_approval_enabled: "agentApprovalEnabled",
  email_admin_approval_enabled: "adminApprovalEnabled",
  email_welcome_customer_enabled: "welcomeCustomerEnabled",
  email_agent_lead_assigned_enabled: "agentLeadAssignedEnabled",
  email_subject_reservation_paid: "subjectReservationPaid",
  email_subject_confirmed: "subjectConfirmed",
  email_subject_rescheduled: "subjectRescheduled",
  email_subject_cancelled: "subjectCancelled",
  email_subject_review: "subjectReview",
  email_subject_onboarding_invite: "subjectOnboardingInvite",
  email_subject_booking_created_customer: "subjectBookingCreatedCustomer",
  email_subject_booking_created_owner: "subjectBookingCreatedOwner",
  email_subject_agent_approval_owner: "subjectAgentApprovalOwner",
  email_subject_agent_approval_admin: "subjectAgentApprovalAdmin",
  email_subject_admin_approval_owner: "subjectAdminApprovalOwner",
  email_subject_admin_approval_admin: "subjectAdminApprovalAdmin",
  email_subject_welcome_customer: "subjectWelcomeCustomer",
  email_subject_agent_lead_assigned: "subjectAgentLeadAssigned",
  email_template_reservation_paid: "templateReservationPaid",
  email_template_reservation_paid_si: "templateReservationPaidSi",
  email_template_reservation_paid_ta: "templateReservationPaidTa",
  email_template_confirmed: "templateConfirmed",
  email_template_confirmed_si: "templateConfirmedSi",
  email_template_confirmed_ta: "templateConfirmedTa",
  email_template_rescheduled: "templateRescheduled",
  email_template_rescheduled_si: "templateRescheduledSi",
  email_template_rescheduled_ta: "templateRescheduledTa",
  email_template_cancelled: "templateCancelled",
  email_template_cancelled_si: "templateCancelledSi",
  email_template_cancelled_ta: "templateCancelledTa",
  email_template_review: "templateReview",
  email_template_review_si: "templateReviewSi",
  email_template_review_ta: "templateReviewTa",
  email_template_onboarding_invite: "templateOnboardingInvite",
  email_template_onboarding_invite_si: "templateOnboardingInviteSi",
  email_template_onboarding_invite_ta: "templateOnboardingInviteTa",
  email_template_booking_created_customer: "templateBookingCreatedCustomer",
  email_template_booking_created_customer_si: "templateBookingCreatedCustomerSi",
  email_template_booking_created_customer_ta: "templateBookingCreatedCustomerTa",
  email_template_booking_created_owner: "templateBookingCreatedOwner",
  email_template_booking_created_owner_si: "templateBookingCreatedOwnerSi",
  email_template_booking_created_owner_ta: "templateBookingCreatedOwnerTa",
  email_template_agent_approval_owner: "templateAgentApprovalOwner",
  email_template_agent_approval_owner_si: "templateAgentApprovalOwnerSi",
  email_template_agent_approval_owner_ta: "templateAgentApprovalOwnerTa",
  email_template_agent_approval_admin: "templateAgentApprovalAdmin",
  email_template_agent_approval_admin_si: "templateAgentApprovalAdminSi",
  email_template_agent_approval_admin_ta: "templateAgentApprovalAdminTa",
  email_template_admin_approval_owner: "templateAdminApprovalOwner",
  email_template_admin_approval_owner_si: "templateAdminApprovalOwnerSi",
  email_template_admin_approval_owner_ta: "templateAdminApprovalOwnerTa",
  email_template_admin_approval_admin: "templateAdminApprovalAdmin",
  email_template_admin_approval_admin_si: "templateAdminApprovalAdminSi",
  email_template_admin_approval_admin_ta: "templateAdminApprovalAdminTa",
  email_template_welcome_customer: "templateWelcomeCustomer",
  email_template_welcome_customer_si: "templateWelcomeCustomerSi",
  email_template_welcome_customer_ta: "templateWelcomeCustomerTa",
  email_template_agent_lead_assigned: "templateAgentLeadAssigned",
  email_template_agent_lead_assigned_si: "templateAgentLeadAssignedSi",
  email_template_agent_lead_assigned_ta: "templateAgentLeadAssignedTa",
};

export function buildEmailDbUpsertPayload(config: Record<string, unknown>) {
  const payload: Record<string, unknown> = { id: "00000000-0000-0000-0000-000000000001" };
  for (const [dbCol, configKey] of Object.entries(EMAIL_DB_COLUMN_MAP)) {
    const value = config[configKey];
    if (dbCol.endsWith("_enabled")) {
      payload[dbCol] = value !== false;
    } else if (typeof value === "string") {
      payload[dbCol] = value.trim() || null;
    } else if (value != null) {
      payload[dbCol] = value;
    }
  }
  return payload;
}
