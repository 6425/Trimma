"use server";

import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { DynamicTrimmaEmail } from "@/emails/DynamicTrimmaEmail";
import { APP_BASE_URL } from "@/lib/email/config";
import {
  buildDefaultEmailTemplateFields,
  buildEmailDbUpsertPayload,
  EMAIL_DB_COLUMN_MAP,
} from "@/lib/email-config-fields";
import { parseEmailTemplate } from "@/lib/email/parse-template";
import { checkEmailRateLimit } from "@/lib/email/rate-limit";
import { createResendClient } from "@/lib/email/resend-client";
import {
  getEmailTriggerById,
  EMAIL_BODY_DEFAULTS,
  EMAIL_SUBJECT_DEFAULTS,
  type EmailTriggerId,
} from "@/lib/email-templates";
import { cleanEnvValue } from "@/lib/supabase-server-env";

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
  partnerLeadReceivedEnabled: boolean;
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
  subjectPartnerLeadReceived: string;
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
  templatePartnerLeadReceived: string;
  templatePartnerLeadReceivedSi: string;
  templatePartnerLeadReceivedTa: string;
  resendApiKey: string;
  fromEmail: string;
  fromName: string;
};

export type EmailConfigWithSource = EmailConfig & { source: "database" | "env" };

function defaultEmailConfig(): EmailConfig {
  const fields = buildDefaultEmailTemplateFields();
  return {
    ...(fields as Omit<EmailConfig, "resendApiKey" | "fromEmail" | "fromName">),
    resendApiKey: cleanEnvValue(process.env.RESEND_API_KEY) || "",
    fromEmail: cleanEnvValue(process.env.RESEND_FROM_EMAIL) || "no-reply@trimma.io",
    fromName: cleanEnvValue(process.env.RESEND_FROM_NAME) || "Trimma",
  };
}

function resolveResendCredentials(config: Pick<EmailConfig, "resendApiKey" | "fromEmail" | "fromName">) {
  const envApiKey = cleanEnvValue(process.env.RESEND_API_KEY) || "";
  const envFromEmail = cleanEnvValue(process.env.RESEND_FROM_EMAIL) || "";
  const envFromName = cleanEnvValue(process.env.RESEND_FROM_NAME) || "";
  const isDev = process.env.NODE_ENV !== "production";

  const dbApiKey = config.resendApiKey?.trim() || "";
  const apiKey = isDev && envApiKey ? envApiKey : dbApiKey || envApiKey;
  const fromEmail = config.fromEmail?.trim() || envFromEmail || "no-reply@trimma.io";
  const fromName = config.fromName?.trim() || envFromName || "Trimma";
  const source: "database" | "env" =
    apiKey === dbApiKey && dbApiKey
      ? "database"
      : apiKey === envApiKey && envApiKey
        ? "env"
        : dbApiKey
          ? "database"
          : "env";

  return {
    apiKey,
    fromEmail,
    fromName,
    from: `${fromName} <${fromEmail}>`,
    source,
  };
}

export async function validateResendCredentials(apiKey: string, fromEmail: string) {
  const trimmedKey = apiKey.trim();
  if (!trimmedKey) {
    return { valid: false as const, error: "Resend API key is required." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fromEmail.trim())) {
    return { valid: false as const, error: "From email must be a valid address." };
  }

  try {
    const resend = createResendClient(trimmedKey);
    const { error } = await resend.domains.list();
    if (error) {
      return { valid: false as const, error: error.message || "Resend rejected the API key." };
    }
    return { valid: true as const };
  } catch (err) {
    return {
      valid: false as const,
      error: err instanceof Error ? err.message : "Failed to validate Resend credentials.",
    };
  }
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

export async function getEmailConfig(): Promise<EmailConfigWithSource> {
  let config: EmailConfig;
  try {
    const { data, error } = await getSupabaseAdmin()
      .from("global_payment_settings")
      .select("*")
      .eq("id", SETTINGS_ID)
      .maybeSingle();

    if (error || !data) {
      throw error || new Error("No settings record found.");
    }

    config = mapDbRow(data as Record<string, unknown>);
  } catch (err) {
    console.warn("Failed to load email settings from DB, using defaults:", err);
    config = defaultEmailConfig();
  }

  const resolved = resolveResendCredentials(config);
  return {
    ...config,
    resendApiKey: resolved.apiKey,
    fromEmail: config.fromEmail || resolved.fromEmail,
    fromName: config.fromName || resolved.fromName,
    source: resolved.source,
  };
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

  const credentials = resolveResendCredentials(config);
  if (!credentials.apiKey) {
    return {
      success: false,
      error: "Resend API key is not configured. Add it in Admin → Global Settings → Resend Email.",
    };
  }

  try {
    const resend = createResendClient(credentials.apiKey);
    const { data, error } = await resend.emails.send({
      from: credentials.from,
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

export async function sendBookingRescheduledEmail(bookingNo: string) {
  const supabase = getSupabaseAdmin();
  const { data: booking } = await supabase.from("bookings").select("customer_email, booking_date, booking_time, salons(name, address, location)").eq("booking_no", bookingNo).maybeSingle();
  if (!booking?.customer_email) return { success: false, error: "Not found", skipped: true };
  const salon = Array.isArray(booking.salons) ? booking.salons[0] : booking.salons;
  const { data: customer } = await supabase.from("users").select("full_name").eq("email", booking.customer_email).maybeSingle();
  
  return sendTriggeredEmail({
    triggerId: "rescheduled",
    to: booking.customer_email,
    variables: { customer_name: customer?.full_name || "Valued Client", salon_name: salon?.name || "Partner Salon", booking_date: booking.booking_date || "", booking_time: booking.booking_time || "", service_name: "Salon service", salon_address: salon?.address || "", maps_link: APP_BASE_URL },
    rateLimitKey: `rescheduled:${bookingNo}`
  });
}

export async function sendBookingCancelledEmail(bookingNo: string) {
  const supabase = getSupabaseAdmin();
  const { data: booking } = await supabase.from("bookings").select("customer_email, booking_date, booking_time, salons(name)").eq("booking_no", bookingNo).maybeSingle();
  if (!booking?.customer_email) return { success: false, error: "Not found", skipped: true };
  const salon = Array.isArray(booking.salons) ? booking.salons[0] : booking.salons;
  const { data: customer } = await supabase.from("users").select("full_name").eq("email", booking.customer_email).maybeSingle();

  return sendTriggeredEmail({
    triggerId: "cancelled",
    to: booking.customer_email,
    variables: { customer_name: customer?.full_name || "Valued Client", salon_name: salon?.name || "Partner Salon", booking_date: booking.booking_date || "", booking_time: booking.booking_time || "", service_name: "Salon service" },
    rateLimitKey: `cancelled:${bookingNo}`
  });
}

export async function sendBookingNoShowEmail(bookingNo: string) {
  const supabase = getSupabaseAdmin();
  const { data: booking } = await supabase
    .from("bookings")
    .select("customer_email, booking_date, booking_time, salons(name)")
    .eq("booking_no", bookingNo)
    .maybeSingle();
  if (!booking?.customer_email) return { success: false, error: "Not found", skipped: true };

  const salon = Array.isArray(booking.salons) ? booking.salons[0] : booking.salons;
  const { data: customer } = await supabase
    .from("users")
    .select("full_name")
    .eq("email", booking.customer_email)
    .maybeSingle();

  const config = await getEmailConfig();
  if (!config.enabled) {
    return { success: false, error: "Email notifications are disabled.", skipped: true };
  }
  if (!config.bookingCancelledEnabled) {
    return { success: false, error: "This email trigger is disabled.", skipped: true };
  }

  const rate = checkEmailRateLimit(`no-show:${bookingNo}`);
  if (!rate.allowed) {
    return {
      success: false,
      error: "Email rate limit exceeded. Please try again later.",
      rateLimited: true,
      retryAfterSec: rate.retryAfterSec,
    };
  }

  const variables = {
    customer_name: customer?.full_name || "Valued Client",
    salon_name: salon?.name || "Partner Salon",
    booking_date: booking.booking_date || "",
    booking_time: booking.booking_time || "",
    service_name: "Salon service",
  };

  const subject = "Your Trimma appointment was marked as a no-show";
  const body = `Hello ${variables.customer_name},

Your appointment at ${variables.salon_name} was marked as a no-show because you did not attend the scheduled visit.

Original date: ${variables.booking_date}
Original time: ${variables.booking_time}
Service: ${variables.service_name}

The online reservation deposit is non-refundable. Contact ${variables.salon_name} directly with any questions.`;

  const credentials = resolveResendCredentials(config);
  if (!credentials.apiKey) {
    return {
      success: false,
      error: "Resend API key is not configured. Add it in Admin → Global Settings → Resend Email.",
    };
  }

  try {
    const resend = createResendClient(credentials.apiKey);
    const { data, error } = await resend.emails.send({
      from: credentials.from,
      to: [booking.customer_email.trim().toLowerCase()],
      subject,
      react: DynamicTrimmaEmail({
        preview: subject,
        title: subject,
        body,
      }),
      tags: [{ name: "trigger", value: "no-show" }],
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

export async function sendReviewRequestEmail(bookingNo: string) {
  const supabase = getSupabaseAdmin();
  const { data: booking } = await supabase
    .from("bookings")
    .select("id, customer_email, salons(name, slug)")
    .eq("booking_no", bookingNo)
    .maybeSingle();
  if (!booking?.customer_email || !booking.id) return { success: false, error: "Not found", skipped: true };
  const salon = Array.isArray(booking.salons) ? booking.salons[0] : booking.salons;
  const { data: customer } = await supabase.from("users").select("full_name").eq("email", booking.customer_email).maybeSingle();
  const { buildCustomerReviewLink } = await import("@/lib/reviews");

  return sendTriggeredEmail({
    triggerId: "review",
    to: booking.customer_email,
    variables: {
      customer_name: customer?.full_name || "Valued Client",
      salon_name: salon?.name || "Partner Salon",
      review_link: buildCustomerReviewLink(booking.id),
    },
    rateLimitKey: `review:${bookingNo}`,
  });
}

export async function sendBookingCreatedCustomerEmail(bookingNo: string) {
  const supabase = getSupabaseAdmin();
  const { data: booking } = await supabase.from("bookings").select("customer_email, booking_date, booking_time, salons(name)").eq("booking_no", bookingNo).maybeSingle();
  if (!booking?.customer_email) return { success: false, error: "Not found", skipped: true };
  const salon = Array.isArray(booking.salons) ? booking.salons[0] : booking.salons;
  const { data: customer } = await supabase.from("users").select("full_name").eq("email", booking.customer_email).maybeSingle();

  return sendTriggeredEmail({
    triggerId: "booking-created-customer",
    to: booking.customer_email,
    variables: { customer_name: customer?.full_name || "Valued Client", salon_name: salon?.name || "Partner Salon", service_name: "Salon service", booking_date: booking.booking_date || "", booking_time: booking.booking_time || "" },
    rateLimitKey: `booking-created-cust:${bookingNo}`
  });
}

export async function sendBookingCreatedOwnerEmail(bookingNo: string, ownerEmail: string, paymentStatus: string) {
  const supabase = getSupabaseAdmin();
  const { data: booking } = await supabase.from("bookings").select("customer_email, booking_date, booking_time, salons(name)").eq("booking_no", bookingNo).maybeSingle();
  if (!booking?.customer_email) return { success: false, error: "Not found", skipped: true };
  const salon = Array.isArray(booking.salons) ? booking.salons[0] : booking.salons;
  const { data: customer } = await supabase.from("users").select("full_name").eq("email", booking.customer_email).maybeSingle();

  return sendTriggeredEmail({
    triggerId: "booking-created-owner",
    to: ownerEmail,
    variables: { customer_name: customer?.full_name || "Valued Client", salon_name: salon?.name || "Partner Salon", service_name: "Salon service", booking_date: booking.booking_date || "", booking_time: booking.booking_time || "", payment_status: paymentStatus, dashboard_link: `${APP_BASE_URL}/dashboard/bookings` },
    rateLimitKey: `booking-created-own:${bookingNo}`
  });
}

export async function sendBookingReminderEmail(bookingNo: string) {
  try {
    const config = await getEmailConfig();
    if (!config.enabled) {
      return { success: false, error: "Email notifications are disabled.", skipped: true };
    }

    const supabase = getSupabaseAdmin();
    const { data: booking } = await supabase
      .from("bookings")
      .select("customer_email, booking_date, booking_time, services(name), salons(name, address, location, slug)")
      .eq("booking_no", bookingNo)
      .maybeSingle();

    if (!booking?.customer_email) {
      return { success: false, error: "Booking or customer email not found.", skipped: true };
    }

    const rate = checkEmailRateLimit(`reminder:${bookingNo}`);
    if (!rate.allowed) {
      return {
        success: false,
        error: "Email rate limit exceeded. Please try again later.",
        rateLimited: true,
        retryAfterSec: rate.retryAfterSec,
      };
    }

    const salon = Array.isArray(booking.salons) ? booking.salons[0] : booking.salons;
    const salonName = salon?.name || "your salon";
    const salonAddress = salon?.address || salon?.location || "See Trimma for details";
    const mapsLink = salon?.slug ? `${APP_BASE_URL}/salons/${salon.slug}` : APP_BASE_URL;
    const serviceRow = Array.isArray(booking.services) ? booking.services[0] : booking.services;

    const { data: customer } = await supabase
      .from("users")
      .select("full_name")
      .eq("email", booking.customer_email)
      .maybeSingle();

    const variables = {
      customer_name: customer?.full_name || "Valued Client",
      booking_no: bookingNo,
      salon_name: salonName,
      booking_date: booking.booking_date || "",
      booking_time: booking.booking_time || "",
      service_name: serviceRow?.name || "Salon service",
      salon_address: salonAddress,
      maps_link: mapsLink,
      dashboard_link: `${APP_BASE_URL}/customer`,
    };

    const subject = parseEmailTemplate(EMAIL_SUBJECT_DEFAULTS.appointmentReminder, variables);
    const body = parseEmailTemplate(EMAIL_BODY_DEFAULTS.appointmentReminder, variables);
    const credentials = resolveResendCredentials(config);
    if (!credentials.apiKey) {
      return {
        success: false,
        error: "Resend API key is not configured. Add it in Admin → Global Settings → Resend Email.",
      };
    }

    const resend = createResendClient(credentials.apiKey);
    const { data, error } = await resend.emails.send({
      from: credentials.from,
      to: [booking.customer_email.trim().toLowerCase()],
      subject,
      react: DynamicTrimmaEmail({
        preview: subject,
        title: subject,
        body,
        ctaLabel: "View my bookings",
        ctaUrl: variables.dashboard_link,
      }),
      tags: [{ name: "trigger", value: "appointment-reminder" }],
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
      error: err instanceof Error ? err.message : "Failed to send reminder email.",
    };
  }
}

export async function sendAgentApprovalEmail(salonName: string, ownerEmail: string) {
  if (ownerEmail) {
    await sendTriggeredEmail({ triggerId: "agent-approval-owner", to: ownerEmail, variables: { salon_name: salonName }, rateLimitKey: `agent-app-own:${ownerEmail}` });
  }
  return sendAdminAlertEmail("agent-approval-admin", { salon_name: salonName }, `agent-app-adm:${salonName}`);
}

export async function sendAdminApprovalEmail(salonName: string, ownerEmail: string) {
  if (ownerEmail) {
    await sendTriggeredEmail({ triggerId: "admin-approval-owner", to: ownerEmail, variables: { salon_name: salonName }, rateLimitKey: `admin-app-own:${ownerEmail}` });
  }
  return sendAdminAlertEmail("admin-approval-admin", { salon_name: salonName }, `admin-app-adm:${salonName}`);
}

export async function sendOwnerSubmissionRejectedEmail(
  salonName: string,
  ownerEmail: string,
  rejectionReason: string
) {
  if (!ownerEmail) return { success: false as const, error: "No owner email", skipped: true as const };
  return sendTriggeredEmail({
    triggerId: "owner-submission-rejected",
    to: ownerEmail,
    variables: {
      salon_name: salonName,
      rejection_reason: rejectionReason,
      dashboard_link: `${APP_BASE_URL}/dashboard/profile`,
    },
    rateLimitKey: `owner-reject:${ownerEmail}:${rejectionReason.slice(0, 40)}`,
  });
}

export async function sendWelcomeCustomerEmail(customerName: string, customerEmail: string) {
  return sendTriggeredEmail({
    triggerId: "welcome-customer",
    to: customerEmail,
    variables: { customer_name: customerName, dashboard_link: APP_BASE_URL },
    rateLimitKey: `welcome:${customerEmail}`
  });
}
