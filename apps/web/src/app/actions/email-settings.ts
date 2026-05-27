"use server";

import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { DynamicTrimmaEmail } from "@/emails/DynamicTrimmaEmail";
import { APP_BASE_URL, RESEND_FROM } from "@/lib/email/config";
import {
  buildDefaultEmailTemplateFields,
  buildEmailDbUpsertPayload,
  EMAIL_DB_COLUMN_MAP,
} from "@/lib/email-config-fields";
import { parseEmailTemplate } from "@/lib/email/parse-template";
import { checkEmailRateLimit } from "@/lib/email/rate-limit";
import { getResendClient } from "@/lib/email/resend-client";
import {
  getEmailTriggerById,
  type EmailTriggerId,
} from "@/lib/email-templates";

const SETTINGS_ID = "00000000-0000-0000-0000-000000000001";

function getSupabaseAdmin() {
  return createSupabaseAdminClient();
}

export type EmailConfig = {
  enabled: boolean;
  adminAlertEmail: string;
  reservationPaidEnabled: boolean;
  bookingConfirmedEnabled: boolean;
  bookingRescheduledEnabled: boolean;
  bookingCancelledEnabled: boolean;
  bookingReviewEnabled: boolean;
  onboardingInviteEnabled: boolean;
  bookingCreatedEnabled: boolean;
  agentApprovalEnabled: boolean;
  adminApprovalEnabled: boolean;
  welcomeCustomerEnabled: boolean;
  agentLeadAssignedEnabled: boolean;
  subjectReservationPaid: string;
  subjectConfirmed: string;
  subjectRescheduled: string;
  subjectCancelled: string;
  subjectReview: string;
  subjectOnboardingInvite: string;
  subjectBookingCreatedCustomer: string;
  subjectBookingCreatedOwner: string;
  subjectAgentApprovalOwner: string;
  subjectAgentApprovalAdmin: string;
  subjectAdminApprovalOwner: string;
  subjectAdminApprovalAdmin: string;
  subjectWelcomeCustomer: string;
  subjectAgentLeadAssigned: string;
  templateReservationPaid: string;
  templateReservationPaidSi: string;
  templateReservationPaidTa: string;
  templateConfirmed: string;
  templateConfirmedSi: string;
  templateConfirmedTa: string;
  templateRescheduled: string;
  templateRescheduledSi: string;
  templateRescheduledTa: string;
  templateCancelled: string;
  templateCancelledSi: string;
  templateCancelledTa: string;
  templateReview: string;
  templateReviewSi: string;
  templateReviewTa: string;
  templateOnboardingInvite: string;
  templateOnboardingInviteSi: string;
  templateOnboardingInviteTa: string;
  templateBookingCreatedCustomer: string;
  templateBookingCreatedCustomerSi: string;
  templateBookingCreatedCustomerTa: string;
  templateBookingCreatedOwner: string;
  templateBookingCreatedOwnerSi: string;
  templateBookingCreatedOwnerTa: string;
  templateAgentApprovalOwner: string;
  templateAgentApprovalOwnerSi: string;
  templateAgentApprovalOwnerTa: string;
  templateAgentApprovalAdmin: string;
  templateAgentApprovalAdminSi: string;
  templateAgentApprovalAdminTa: string;
  templateAdminApprovalOwner: string;
  templateAdminApprovalOwnerSi: string;
  templateAdminApprovalOwnerTa: string;
  templateAdminApprovalAdmin: string;
  templateAdminApprovalAdminSi: string;
  templateAdminApprovalAdminTa: string;
  templateWelcomeCustomer: string;
  templateWelcomeCustomerSi: string;
  templateWelcomeCustomerTa: string;
  templateAgentLeadAssigned: string;
  templateAgentLeadAssignedSi: string;
  templateAgentLeadAssignedTa: string;
  fromEmail: string;
};

function defaultEmailConfig(): EmailConfig {
  const fields = buildDefaultEmailTemplateFields();
  return {
    ...(fields as Omit<EmailConfig, "fromEmail">),
    fromEmail: process.env.RESEND_FROM_EMAIL || "no-reply@trimma.io",
  };
}

function mapDbRow(row: Record<string, unknown>): EmailConfig {
  const defaults = defaultEmailConfig();
  const config = { ...defaults };

  for (const [dbCol, configKey] of Object.entries(EMAIL_DB_COLUMN_MAP)) {
    const raw = row[dbCol];
    if (raw == null || raw === "") continue;
    if (dbCol.endsWith("_enabled")) {
      (config as Record<string, unknown>)[configKey] = raw !== false;
    } else {
      (config as Record<string, unknown>)[configKey] = String(raw);
    }
  }

  return config;
}

function getConfigString(config: EmailConfig, key: string): string {
  return String((config as unknown as Record<string, string>)[key] || "");
}

function composeMultilingualBody(
  config: EmailConfig,
  bodyKey: string,
  bodyKeySi: string,
  bodyKeyTa: string,
  variables: Record<string, string>
) {
  const en = parseEmailTemplate(getConfigString(config, bodyKey), variables);
  const siRaw = getConfigString(config, bodyKeySi).trim();
  const taRaw = getConfigString(config, bodyKeyTa).trim();
  const sections = [en];
  if (siRaw) {
    sections.push("---\nසිංහල\n---\n\n" + parseEmailTemplate(siRaw, variables));
  }
  if (taRaw) {
    sections.push("---\nதமிழ்\n---\n\n" + parseEmailTemplate(taRaw, variables));
  }
  return sections.join("\n\n");
}

function isTriggerEnabled(config: EmailConfig, toggleKey: string) {
  return (config as unknown as Record<string, boolean>)[toggleKey] !== false;
}

export async function getEmailConfig(): Promise<EmailConfig> {
  try {
    const { data, error } = await getSupabaseAdmin()
      .from("global_payment_settings")
      .select("*")
      .eq("id", SETTINGS_ID)
      .maybeSingle();

    if (error || !data) {
      throw error || new Error("No settings record found.");
    }

    return mapDbRow(data as Record<string, unknown>);
  } catch (err) {
    console.warn("Failed to load email settings from DB, using defaults:", err);
    return defaultEmailConfig();
  }
}

export async function saveEmailSettings(config: EmailConfig) {
  try {
    const { error } = await getSupabaseAdmin()
      .from("global_payment_settings")
      .upsert(buildEmailDbUpsertPayload(config as unknown as Record<string, unknown>));

    if (error) throw error;
    return { success: true as const };
  } catch (err) {
    return {
      success: false as const,
      error: err instanceof Error ? err.message : "Failed to save email settings.",
    };
  }
}

export async function testEmailConnection(recipientEmail: string) {
  return sendTriggeredEmail({
    triggerId: "welcome-customer",
    to: recipientEmail,
    variables: {
      customer_name: "Trimma Admin",
      dashboard_link: `${APP_BASE_URL}/admin`,
    },
    rateLimitKey: "admin:test:email",
    idempotencyKey: `test-email/${Date.now()}`,
    force: true,
  });
}

type SendTriggeredEmailInput = {
  triggerId: EmailTriggerId;
  to: string;
  variables: Record<string, string>;
  rateLimitKey: string;
  idempotencyKey?: string;
  force?: boolean;
};

export type SendTriggeredEmailResult =
  | { success: true; id: string }
  | { success: false; error: string; skipped?: boolean; rateLimited?: boolean; retryAfterSec?: number };

export async function sendTriggeredEmail(
  input: SendTriggeredEmailInput
): Promise<SendTriggeredEmailResult> {
  const trigger = getEmailTriggerById(input.triggerId);
  if (!trigger) {
    return { success: false, error: `Unknown email trigger: ${input.triggerId}` };
  }

  const config = await getEmailConfig();
  if (!config.enabled && !input.force) {
    return { success: false, error: "Email notifications are disabled.", skipped: true };
  }

  if (!isTriggerEnabled(config, trigger.toggleKey) && !input.force) {
    return { success: false, error: "This email trigger is disabled.", skipped: true };
  }

  const to = input.to.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return { success: false, error: "Invalid recipient email address." };
  }

  const rate = checkEmailRateLimit(input.rateLimitKey);
  if (!rate.allowed) {
    return {
      success: false,
      error: "Email rate limit exceeded. Please try again later.",
      rateLimited: true,
      retryAfterSec: rate.retryAfterSec,
    };
  }

  const subjectTemplate = getConfigString(config, trigger.subjectKey);
  const subject = parseEmailTemplate(subjectTemplate, input.variables);
  const body = composeMultilingualBody(
    config,
    trigger.bodyKey,
    trigger.bodyKeySi,
    trigger.bodyKeyTa,
    input.variables
  );

  const ctaVariable = "ctaVariable" in trigger ? trigger.ctaVariable : undefined;
  const ctaUrl = ctaVariable ? input.variables[ctaVariable] : undefined;
  const ctaLabel = "ctaLabel" in trigger ? trigger.ctaLabel : undefined;

  try {
    const resend = getResendClient();
    const { data, error } = await resend.emails.send({
      from: RESEND_FROM,
      to: [to],
      subject,
      react: DynamicTrimmaEmail({
        preview: subject,
        title: subject,
        body,
        ctaLabel,
        ctaUrl,
      }),
      tags: [{ name: "trigger", value: input.triggerId }],
    });

    if (error) {
      return { success: false, error: error.message || "Resend rejected the email." };
    }

    if (!data?.id) {
      return { success: false, error: "Resend did not return a message id." };
    }

    return { success: true, id: data.id };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to send email.",
    };
  }
}

export async function sendBookingConfirmedEmail(bookingNo: string) {
  try {
    const supabase = getSupabaseAdmin();
    const { data: booking } = await supabase
      .from("bookings")
      .select("customer_email, booking_date, booking_time, amount, salons(name, address, location, slug)")
      .eq("booking_no", bookingNo)
      .maybeSingle();

    if (!booking?.customer_email) {
      return { success: false, error: "Booking or customer email not found.", skipped: true };
    }

    const salon = Array.isArray(booking.salons) ? booking.salons[0] : booking.salons;
    const salonName = salon?.name || "your salon";
    const salonAddress = salon?.address || salon?.location || "See Trimma for details";
    const mapsLink = salon?.slug ? `${APP_BASE_URL}/salons/${salon.slug}` : APP_BASE_URL;
    const totalAmount = parseFloat(String(booking.amount ?? 0));
    const depositAmount = Math.round(totalAmount * 0.2);
    const balanceAmount = Math.max(0, totalAmount - depositAmount);

    const { data: customer } = await supabase
      .from("users")
      .select("full_name")
      .eq("email", booking.customer_email)
      .maybeSingle();

    return sendTriggeredEmail({
      triggerId: "confirmed",
      to: booking.customer_email,
      variables: {
        customer_name: customer?.full_name || "Valued Client",
        booking_no: bookingNo,
        salon_name: salonName,
        booking_date: booking.booking_date || "",
        booking_time: booking.booking_time || "",
        service_name: "Salon service",
        total_price: totalAmount.toLocaleString("en-LK"),
        deposit_paid: depositAmount.toLocaleString("en-LK"),
        balance_to_pay: balanceAmount.toLocaleString("en-LK"),
        salon_address: salonAddress,
        maps_link: mapsLink,
        dashboard_link: `${APP_BASE_URL}/customer`,
      },
      rateLimitKey: `salon-confirm:${bookingNo}`,
      idempotencyKey: `booking-confirmed/${bookingNo}`,
    });
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to send confirmation email.",
    };
  }
}

export async function sendAdminAlertEmail(
  triggerId: EmailTriggerId,
  variables: Record<string, string>,
  rateLimitKey: string,
  idempotencyKey?: string
) {
  const config = await getEmailConfig();
  const adminEmail = config.adminAlertEmail.trim();
  if (!adminEmail) {
    return { success: false, error: "Admin alert email is not configured.", skipped: true };
  }

  return sendTriggeredEmail({
    triggerId,
    to: adminEmail,
    variables,
    rateLimitKey,
    idempotencyKey,
  });
}
