"use server";

import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { APP_BASE_URL } from "@/lib/email/config";
import { normalizeEmail } from "@/lib/normalize-email";
import { preAssignSalonOwnerRole, assignSalonOwnerRoleByAdminClient } from "./admin-operations";
import { cleanEnvValue } from "@/lib/supabase-server-env";
import { WHATSAPP_TEMPLATE_DEFAULTS } from "@/lib/whatsapp-templates";
import {
  readWhatsAppEnvAccessToken,
  readWhatsAppEnvPhoneId,
  resolveEffectiveWhatsAppCredentials,
} from "@/lib/whatsapp-env";
import {
  clearWhatsAppPhoneResolutionCache,
  resolveWhatsAppPhoneNumberId,
  validateWhatsAppMetaAccount,
} from "@/lib/whatsapp-meta-resolver";

const D = WHATSAPP_TEMPLATE_DEFAULTS;

type BookingSalonJoin = {
  name?: string | null;
  phone?: string | null;
  address?: string | null;
  location?: string | null;
  slug?: string | null;
};

type BookingWhatsAppRow = {
  id: string;
  customer_email: string;
  booking_date?: string | null;
  booking_time?: string | null;
  amount?: string | number | null;
  payment_status?: string | null;
  services?: { name?: string | null } | null;
  salons?: BookingSalonJoin | null;
};

function getSupabaseAdmin() {
  return createSupabaseAdminClient();
}

async function resolveServiceName(bookingId: string, fallback?: string | null) {
  if (fallback) return fallback;

  const supabase = getSupabaseAdmin();
  const { data: rows } = await supabase
    .from("booking_services")
    .select("services(name)")
    .eq("booking_id", bookingId)
    .limit(1);

  const first = rows?.[0] as
    | { services?: { name?: string } | { name?: string }[] | null }
    | undefined;
  const services = first?.services;
  if (Array.isArray(services)) {
    return services[0]?.name || "Premium Styling Service";
  }
  return services?.name || "Premium Styling Service";
}

async function fetchBookingByNumber(
  bookingNo: string,
  salonSelect: string
): Promise<BookingWhatsAppRow | null> {
  const supabase = getSupabaseAdmin();
  const { data: booking, error } = await supabase
    .from("bookings")
    .select(`*, ${salonSelect}, services(name)`)
    .eq("booking_no", bookingNo)
    .maybeSingle();

  if (error || !booking) {
    console.error("Failed to fetch booking for WhatsApp:", error);
    return null;
  }

  return booking as unknown as BookingWhatsAppRow;
}

async function fetchCustomerContact(email: string) {
  const supabase = getSupabaseAdmin();
  const { data: customer, error } = await supabase
    .from("users")
    .select("full_name, phone")
    .eq("email", email)
    .maybeSingle();

  if (error) {
    console.error("Failed to fetch customer contact for WhatsApp:", error);
  }

  return customer;
}

function parseTemplate(template: string, variables: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{\\s*${key}\\s*\\}`, "g");
    result = result.replace(regex, value);
  }
  return result;
}

/**
 * Sanitizes phone numbers to Meta's required international standard (e.g. 94771234567).
 */
function cleanPhoneNumber(phone: string): string {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0") && digits.length === 10) {
    digits = "94" + digits.substring(1);
  }
  if (digits.length === 9 && digits.startsWith("7")) {
    digits = "94" + digits;
  }
  return digits;
}

function formatWhatsAppApiError(result: {
  error?: { message?: string; code?: number; type?: string };
}): string {
  const message = result.error?.message || "Failed to send WhatsApp.";
  const code = result.error?.code;
  const lower = message.toLowerCase();

  if (
    code === 190 ||
    lower.includes("expired") ||
    lower.includes("authentication error") ||
    lower.includes("error validating access token")
  ) {
    const vercelHint = readWhatsAppEnvAccessToken()
      ? " Trimma is using WHATSAPP_ACCESS_TOKEN from Vercel. If this error persists after redeploy, clear the stale token in Supabase (packages/db/WHATSAPP_CLEAR_STALE_DB_TOKEN.sql)."
      : " Set WHATSAPP_ACCESS_TOKEN in Vercel, or paste your token in Admin → Global Settings and Save.";
    return `${message}.${vercelHint}`;
  }

  if (code === 100 && lower.includes("nonexisting field") && lower.includes("verified_name")) {
    return "Check that the Phone Number ID (App ID) in Admin → Global Settings matches Meta Developer Console → WhatsApp → API Setup.";
  }

  return message;
}

function cleanWhatsAppCredential(value: string | undefined): string {
  return cleanEnvValue(value) || "";
}

/** Vercel WHATSAPP_* env wins over Supabase. Stale DB tokens are ignored when Vercel is set. */
function resolveWhatsAppCredentials(dbPhoneId: string, dbAccessToken: string) {
  const resolved = resolveEffectiveWhatsAppCredentials(dbPhoneId, dbAccessToken);
  return {
    accountId: resolved.accountId,
    accessToken: resolved.accessToken,
    source: resolved.source,
    tokenFromEnv: resolved.tokenFromEnv,
    phoneIdFromEnv: resolved.phoneIdFromEnv,
    databaseAccessToken: resolved.databaseAccessToken,
    databasePhoneId: resolved.databasePhoneId,
    dbToken: resolved.databaseAccessToken,
    envToken: readWhatsAppEnvAccessToken(),
  };
}

async function resolveMessagingPhoneId(accountId: string, accessToken: string): Promise<string | null> {
  const resolved = await resolveWhatsAppPhoneNumberId(accountId, accessToken);
  return resolved.success ? resolved.phoneNumberId : null;
}

export async function validateWhatsAppCredentials(
  accountIdOverride?: string,
  accessTokenOverride?: string
) {
  const config = await getWhatsAppConfig();
  const envToken = readWhatsAppEnvAccessToken();
  const envPhoneId = readWhatsAppEnvPhoneId();
  const accountId =
    accountIdOverride?.trim() || envPhoneId || config.accountId || config.phoneId;
  // Never validate a stale Supabase token when Vercel WHATSAPP_ACCESS_TOKEN is configured.
  const accessToken = envToken || accessTokenOverride?.trim() || config.accessToken;

  const validation = await validateWhatsAppMetaAccount(accountId, accessToken);
  if (validation.valid === false) {
    return { valid: false as const, error: validation.error };
  }

  return {
    valid: true as const,
    accountId: validation.accountId,
    phoneNumberId: validation.phoneNumberId,
    verifiedName: validation.verifiedName,
    displayPhoneNumber: validation.displayPhoneNumber,
  };
}

/**
 * Dynamic helper to fetch active WhatsApp configuration and custom templates from the database.
 */
export async function getWhatsAppConfig() {
  try {
    const { data: dbSettings, error } = await getSupabaseAdmin()
      .from("global_payment_settings")
      .select(`
        whatsapp_phone_number_id, 
        whatsapp_access_token, 
        whatsapp_enabled,
        whatsapp_admin_alert_phone,
        whatsapp_reservation_paid_enabled,
        whatsapp_booking_confirmed_enabled,
        whatsapp_booking_rescheduled_enabled,
        whatsapp_booking_cancelled_enabled,
        whatsapp_booking_review_enabled,
        whatsapp_onboarding_invite_enabled,
        whatsapp_booking_created_enabled,
        whatsapp_agent_approval_enabled,
        whatsapp_admin_approval_enabled,
        whatsapp_welcome_customer_enabled,
        whatsapp_agent_lead_assigned_enabled,
        whatsapp_template_reservation_paid,
        whatsapp_template_confirmed,
        whatsapp_template_rescheduled,
        whatsapp_template_cancelled,
        whatsapp_template_review,
        whatsapp_template_onboarding_invite,
        whatsapp_template_booking_created_customer,
        whatsapp_template_booking_created_owner,
        whatsapp_template_agent_approval_owner,
        whatsapp_template_agent_approval_admin,
        whatsapp_template_admin_approval_owner,
        whatsapp_template_admin_approval_admin,
        whatsapp_template_welcome_customer,
        whatsapp_template_agent_lead_assigned
      `)
      .single();

    if (error || !dbSettings) {
      throw error || new Error("No settings record found.");
    }

    const enabled = dbSettings.whatsapp_enabled !== false;
    const { accountId, accessToken, source, tokenFromEnv, phoneIdFromEnv, databaseAccessToken } =
      resolveWhatsAppCredentials(
      dbSettings.whatsapp_phone_number_id || "",
      dbSettings.whatsapp_access_token || ""
    );
    
    // Trigger toggles
    const reservationPaidEnabled = dbSettings.whatsapp_reservation_paid_enabled !== false;
    const bookingConfirmedEnabled = dbSettings.whatsapp_booking_confirmed_enabled !== false;
    const bookingRescheduledEnabled = dbSettings.whatsapp_booking_rescheduled_enabled !== false;
    const bookingCancelledEnabled = dbSettings.whatsapp_booking_cancelled_enabled !== false;
    const bookingReviewEnabled = dbSettings.whatsapp_booking_review_enabled !== false;
    const onboardingInviteEnabled = dbSettings.whatsapp_onboarding_invite_enabled !== false;
    const bookingCreatedEnabled = dbSettings.whatsapp_booking_created_enabled !== false;
    const agentApprovalEnabled = dbSettings.whatsapp_agent_approval_enabled !== false;
    const adminApprovalEnabled = dbSettings.whatsapp_admin_approval_enabled !== false;
    const welcomeCustomerEnabled = dbSettings.whatsapp_welcome_customer_enabled !== false;
    const agentLeadAssignedEnabled = dbSettings.whatsapp_agent_lead_assigned_enabled !== false;
    const adminAlertPhone = dbSettings.whatsapp_admin_alert_phone?.trim() || "";

    const templateReservationPaid = dbSettings.whatsapp_template_reservation_paid || D.reservationPaid;
    const templateConfirmed = dbSettings.whatsapp_template_confirmed || D.confirmed;
    const templateRescheduled = dbSettings.whatsapp_template_rescheduled || D.rescheduled;
    const templateCancelled = dbSettings.whatsapp_template_cancelled || D.cancelled;
    const templateReview = dbSettings.whatsapp_template_review || D.review;
    const templateOnboardingInvite = dbSettings.whatsapp_template_onboarding_invite || D.onboardingInvite;
    const templateBookingCreatedCustomer =
      dbSettings.whatsapp_template_booking_created_customer || D.bookingCreatedCustomer;
    const templateBookingCreatedOwner =
      dbSettings.whatsapp_template_booking_created_owner || D.bookingCreatedOwner;
    const templateAgentApprovalOwner =
      dbSettings.whatsapp_template_agent_approval_owner || D.agentApprovalOwner;
    const templateAgentApprovalAdmin =
      dbSettings.whatsapp_template_agent_approval_admin || D.agentApprovalAdmin;
    const templateAdminApprovalOwner =
      dbSettings.whatsapp_template_admin_approval_owner || D.adminApprovalOwner;
    const templateAdminApprovalAdmin =
      dbSettings.whatsapp_template_admin_approval_admin || D.adminApprovalAdmin;
    const templateWelcomeCustomer =
      dbSettings.whatsapp_template_welcome_customer || D.welcomeCustomer;
    const templateAgentLeadAssigned =
      dbSettings.whatsapp_template_agent_lead_assigned || D.agentLeadAssigned;

    return { 
      enabled, 
      accountId,
      phoneId: accountId,
      accessToken,
      tokenFromEnv,
      phoneIdFromEnv,
      databaseAccessToken,
      credentialsSource: source,
      adminAlertPhone,
      reservationPaidEnabled,
      bookingConfirmedEnabled,
      bookingRescheduledEnabled,
      bookingCancelledEnabled,
      bookingReviewEnabled,
      onboardingInviteEnabled,
      bookingCreatedEnabled,
      agentApprovalEnabled,
      adminApprovalEnabled,
      welcomeCustomerEnabled,
      agentLeadAssignedEnabled,
      templateReservationPaid,
      templateConfirmed,
      templateRescheduled,
      templateCancelled,
      templateReview,
      templateOnboardingInvite,
      templateBookingCreatedCustomer,
      templateBookingCreatedOwner,
      templateAgentApprovalOwner,
      templateAgentApprovalAdmin,
      templateAdminApprovalOwner,
      templateAdminApprovalAdmin,
      templateWelcomeCustomer,
      templateAgentLeadAssigned,
      source,
    };
  } catch (err) {
    console.warn("⚠️ Failed to load WhatsApp settings from DB, falling back to static default states:", err);
    const {
      accountId,
      accessToken,
      source,
      tokenFromEnv,
      phoneIdFromEnv,
      databaseAccessToken,
    } = resolveWhatsAppCredentials("", "");
    return {
      enabled: true,
      accountId,
      phoneId: accountId,
      accessToken,
      tokenFromEnv,
      phoneIdFromEnv,
      databaseAccessToken,
      credentialsSource: source,
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
      adminAlertPhone: "",
      templateReservationPaid: D.reservationPaid,
      templateConfirmed: D.confirmed,
      templateRescheduled: D.rescheduled,
      templateCancelled: D.cancelled,
      templateReview: D.review,
      templateOnboardingInvite: D.onboardingInvite,
      templateBookingCreatedCustomer: D.bookingCreatedCustomer,
      templateBookingCreatedOwner: D.bookingCreatedOwner,
      templateAgentApprovalOwner: D.agentApprovalOwner,
      templateAgentApprovalAdmin: D.agentApprovalAdmin,
      templateAdminApprovalOwner: D.adminApprovalOwner,
      templateAdminApprovalAdmin: D.adminApprovalAdmin,
      templateWelcomeCustomer: D.welcomeCustomer,
      templateAgentLeadAssigned: D.agentLeadAssigned,
      source,
    };
  }
}

async function getWhatsAppMessagingConfig() {
  const config = await getWhatsAppConfig();
  const storedAccountId = config.accountId || config.phoneId;
  if (!storedAccountId || !config.accessToken) {
    return {
      ...config,
      accountId: storedAccountId,
      messagingPhoneId: null as string | null,
      phoneId: storedAccountId || "",
    };
  }

  const messagingPhoneId = await resolveMessagingPhoneId(storedAccountId, config.accessToken);
  return {
    ...config,
    accountId: storedAccountId,
    messagingPhoneId,
    phoneId: messagingPhoneId || "",
  };
}

/**
 * Securely saves WhatsApp configurations and custom templates directly to the database.
 */
export async function saveWhatsAppSettings(
  accountId: string,
  accessToken: string,
  enabled: boolean,
  reservationPaidEnabled?: boolean,
  bookingConfirmedEnabled?: boolean,
  bookingRescheduledEnabled?: boolean,
  bookingCancelledEnabled?: boolean,
  bookingReviewEnabled?: boolean,
  onboardingInviteEnabled?: boolean,
  templateReservationPaid?: string,
  templateConfirmed?: string,
  templateRescheduled?: string,
  templateCancelled?: string,
  templateReview?: string,
  templateOnboardingInvite?: string,
  bookingCreatedEnabled?: boolean,
  agentApprovalEnabled?: boolean,
  adminApprovalEnabled?: boolean,
  adminAlertPhone?: string,
  templateBookingCreatedCustomer?: string,
  templateBookingCreatedOwner?: string,
  templateAgentApprovalOwner?: string,
  templateAgentApprovalAdmin?: string,
  templateAdminApprovalOwner?: string,
  templateAdminApprovalAdmin?: string,
  welcomeCustomerEnabled?: boolean,
  agentLeadAssignedEnabled?: boolean,
  templateWelcomeCustomer?: string,
  templateAgentLeadAssigned?: string
) {
  try {
    const envToken = readWhatsAppEnvAccessToken();
    const envPhoneId = readWhatsAppEnvPhoneId();
    const trimmedAccountId = cleanWhatsAppCredential(accountId || envPhoneId);
    const trimmedToken = cleanWhatsAppCredential(envToken || accessToken);

    if (!trimmedAccountId || !trimmedToken) {
      return {
        success: false,
        error: envToken
          ? "Phone Number ID is required. Set WHATSAPP_PHONE_NUMBER_ID in Vercel or enter it here."
          : "WhatsApp Phone Number ID and access token are required.",
      };
    }

    const validation = await validateWhatsAppCredentials(trimmedAccountId, trimmedToken);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error || "WhatsApp credentials could not be validated with Meta.",
      };
    }

    const { error } = await getSupabaseAdmin()
      .from("global_payment_settings")
      .upsert({
        id: "00000000-0000-0000-0000-000000000001",
        whatsapp_phone_number_id: trimmedAccountId,
        whatsapp_access_token: trimmedToken,
        whatsapp_enabled: enabled,
        whatsapp_admin_alert_phone: adminAlertPhone?.trim() || null,
        whatsapp_reservation_paid_enabled: reservationPaidEnabled !== false,
        whatsapp_booking_confirmed_enabled: bookingConfirmedEnabled !== false,
        whatsapp_booking_rescheduled_enabled: bookingRescheduledEnabled !== false,
        whatsapp_booking_cancelled_enabled: bookingCancelledEnabled !== false,
        whatsapp_booking_review_enabled: bookingReviewEnabled !== false,
        whatsapp_onboarding_invite_enabled: onboardingInviteEnabled !== false,
        whatsapp_booking_created_enabled: bookingCreatedEnabled !== false,
        whatsapp_agent_approval_enabled: agentApprovalEnabled !== false,
        whatsapp_admin_approval_enabled: adminApprovalEnabled !== false,
        whatsapp_welcome_customer_enabled: welcomeCustomerEnabled !== false,
        whatsapp_agent_lead_assigned_enabled: agentLeadAssignedEnabled !== false,
        whatsapp_template_reservation_paid: templateReservationPaid || null,
        whatsapp_template_confirmed: templateConfirmed || null,
        whatsapp_template_rescheduled: templateRescheduled || null,
        whatsapp_template_cancelled: templateCancelled || null,
        whatsapp_template_review: templateReview || null,
        whatsapp_template_onboarding_invite: templateOnboardingInvite || null,
        whatsapp_template_booking_created_customer: templateBookingCreatedCustomer || null,
        whatsapp_template_booking_created_owner: templateBookingCreatedOwner || null,
        whatsapp_template_agent_approval_owner: templateAgentApprovalOwner || null,
        whatsapp_template_agent_approval_admin: templateAgentApprovalAdmin || null,
        whatsapp_template_admin_approval_owner: templateAdminApprovalOwner || null,
        whatsapp_template_admin_approval_admin: templateAdminApprovalAdmin || null,
        whatsapp_template_welcome_customer: templateWelcomeCustomer || null,
        whatsapp_template_agent_lead_assigned: templateAgentLeadAssigned || null,
      });

    if (error) throw error;
    clearWhatsAppPhoneResolutionCache();
    return { success: true };
  } catch (err: any) {
    console.error("❌ Failed to save WhatsApp configuration:", err);
    return { success: false, error: err.message || "Failed to save settings." };
  }
}

export async function getWhatsAppTemplateDefaults() {
  return WHATSAPP_TEMPLATE_DEFAULTS;
}

/**
 * Triggers a live sandbox test message to the specified phone number.
 */
export async function testWhatsAppConnection(testPhone: string) {
  const { phoneId, accessToken, accountId } = await getWhatsAppMessagingConfig();

  if (!phoneId || !accessToken) {
    return {
      success: false,
      error:
        "Could not resolve a WhatsApp phone number for your Meta Business account ID. Check the ID and access token in Admin → Global Settings.",
    };
  }

  const cleanPhone = cleanPhoneNumber(testPhone);

  try {
    const testMessage = `Hello! 🌟 This is a secure test message from your *Trimma Admin Settings Panel*!\n\nYour WhatsApp Business Cloud API configuration is working perfectly! ✅\n\n⚙️ *Mode:* Developer Sandbox\n🆔 *Account ID:* ${accountId}\n📞 *Phone ID:* ${phoneId}`;

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${phoneId}/messages`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: cleanPhone,
          type: "text",
          text: {
            preview_url: false,
            body: testMessage,
          },
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error("❌ Meta Graph API test returned error response:", result);
      return { success: false, error: formatWhatsAppApiError(result) };
    }

    return { success: true, messageId: result.messages?.[0]?.id };
  } catch (err: any) {
    console.error("❌ Unhandled test WhatsApp error:", err);
    return { success: false, error: err.message || "Internal server error." };
  }
}

/**
 * Sent immediately after the customer pays the 20% reservation fee.
 */
export async function sendWhatsAppReservationPaidNotification(
  bookingNo: string,
  overrides?: { customerPhone?: string; customerName?: string; serviceName?: string }
) {
  const {
    enabled,
    phoneId,
    accessToken,
    reservationPaidEnabled,
    templateReservationPaid,
  } = await getWhatsAppMessagingConfig();

  if (!enabled) {
    return { success: true, message: "Disabled" };
  }

  if (!reservationPaidEnabled) {
    return { success: true, message: "Reservation Paid Alerts Disabled" };
  }

  if (!phoneId || !accessToken) {
    return { success: false, error: "WhatsApp credentials not configured." };
  }

  try {
    const booking = await fetchBookingByNumber(
      bookingNo,
      "salons(name, phone, address, location)"
    );

    if (!booking) {
      return { success: false, error: "Booking record not found." };
    }

    const customer = await fetchCustomerContact(booking.customer_email);
    const customerName =
      overrides?.customerName || customer?.full_name || "Valued Client";
    const rawCustomerPhone = overrides?.customerPhone || customer?.phone;

    if (!rawCustomerPhone) {
      return { success: false, error: "Customer phone number is missing." };
    }

    const customerPhone = cleanPhoneNumber(rawCustomerPhone);
    const salonName = booking.salons?.name || "Trimma Partner Salon";
    const serviceName =
      overrides?.serviceName ||
      (await resolveServiceName(booking.id, booking.services?.name));

    const totalAmount = parseFloat(String(booking.amount ?? 0));
    const depositAmount = Math.round(totalAmount * 0.2);
    const balanceAmount = Math.round(totalAmount * 0.8);

    const variables = {
      customer_name: customerName,
      booking_no: bookingNo,
      salon_name: salonName,
      booking_date: booking.booking_date || "",
      booking_time: booking.booking_time || "",
      service_name: serviceName,
      deposit_paid: depositAmount.toLocaleString(),
      balance_to_pay: balanceAmount.toLocaleString(),
    };

    const customerMessage = parseTemplate(templateReservationPaid || D.reservationPaid, variables);

    const response = await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: customerPhone,
        type: "text",
        text: { preview_url: false, body: customerMessage },
      }),
    });

    const result = await response.json();
    if (!response.ok) {
      return { success: false, error: formatWhatsAppApiError(result) };
    }

    return { success: true, messageId: result.messages?.[0]?.id };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to send WhatsApp reservation alert.",
    };
  }
}

/**
 * Salon confirmation notification sender (after owner confirms a reserved booking).
 */
export async function sendWhatsAppNotification(
  bookingNo: string,
  overrides?: { customerPhone?: string; customerName?: string; serviceName?: string }
) {
  const { 
    enabled, 
    phoneId, 
    accessToken, 
    bookingConfirmedEnabled,
    templateConfirmed
  } = await getWhatsAppMessagingConfig();

  if (!enabled) {
    console.log("ℹ️ WhatsApp alerts are disabled globally in settings.");
    return { success: true, message: "Disabled" };
  }

  if (!bookingConfirmedEnabled) {
    console.log("ℹ️ WhatsApp Booking Confirmation receipts are disabled in settings.");
    return { success: true, message: "Confirmed Alerts Disabled" };
  }

  if (!phoneId || !accessToken) {
    console.error("❌ WhatsApp configuration is missing. Cannot dispatch receipt.");
    return { success: false, error: "WhatsApp credentials not configured." };
  }

  try {
    const booking = await fetchBookingByNumber(
      bookingNo,
      "salons(name, phone, address, location)"
    );

    if (!booking) {
      return { success: false, error: "Booking record not found." };
    }

    const customer = await fetchCustomerContact(booking.customer_email);

    const customerName =
      overrides?.customerName || customer?.full_name || "Valued Client";
    const rawCustomerPhone = overrides?.customerPhone || customer?.phone;

    if (!rawCustomerPhone) {
      console.error("❌ Customer phone number is empty. Cannot dispatch WhatsApp.");
      return { success: false, error: "Customer phone number is missing." };
    }

    const customerPhone = cleanPhoneNumber(rawCustomerPhone);
    const salonName = booking.salons?.name || "Trimma Partner Salon";
    const salonAddress = booking.salons?.address || "";
    const salonLocation = booking.salons?.location || "";
    const serviceName =
      overrides?.serviceName ||
      (await resolveServiceName(booking.id, booking.services?.name));
    
    const totalAmount = parseFloat(String(booking.amount ?? 0));
    const depositAmount = Math.round(totalAmount * 0.2);
    const balanceAmount = Math.round(totalAmount * 0.8);

    // 📍 GPS coordinate-based Google Maps Directions Link
    let mapsLink = "";
    if (salonLocation && salonLocation.includes(",")) {
      mapsLink = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(salonLocation.trim())}`;
    } else if (salonAddress) {
      mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(salonName + ", " + salonAddress)}`;
    }

    // 3. Format the dynamic message via merge-tag parser
    const variables = {
      customer_name: customerName,
      booking_no: bookingNo,
      salon_name: salonName,
      booking_date: booking.booking_date || "",
      booking_time: booking.booking_time || "",
      service_name: serviceName,
      total_price: totalAmount.toLocaleString(),
      deposit_paid: depositAmount.toLocaleString(),
      balance_to_pay: balanceAmount.toLocaleString(),
      salon_address: salonAddress,
      maps_link: mapsLink
    };

    const customerMessage = parseTemplate(templateConfirmed || D.confirmed, variables);

    console.log(`🚀 Dispatching WhatsApp Booking Confirmation to ${customerPhone}:`);

    // 4. Send WhatsApp request directly to Meta API for CUSTOMER
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${phoneId}/messages`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: customerPhone,
          type: "text",
          text: {
            preview_url: false,
            body: customerMessage,
          },
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error("❌ Meta Graph API returned error response for customer:", result);
      return { success: false, error: formatWhatsAppApiError(result) };
    }

    // 5. Send Notification to SALON OWNER
    const ownerRawPhone = booking.salons?.phone;
    if (ownerRawPhone) {
      const ownerPhone = cleanPhoneNumber(ownerRawPhone);
      const ownerMessage = `🔔 *BOOKING CONFIRMED* 🔔\n\nYou confirmed the booking from *${customerName}*.\n\n📋 Ref: ${bookingNo}\n📅 Date: ${booking.booking_date}\n⏰ Time: ${booking.booking_time}\n💇 Service: ${serviceName}\n\nPlease prepare for their arrival! ✂️`;

      await fetch(
        `https://graph.facebook.com/v18.0/${phoneId}/messages`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: ownerPhone,
            type: "text",
            text: {
              preview_url: false,
              body: ownerMessage,
            },
          }),
        }
      );
    }

    return { success: true, messageId: result.messages?.[0]?.id };

  } catch (err: any) {
    console.error("❌ Unhandled error in WhatsApp confirmation dispatch:", err);
    return { success: false, error: err.message || "Internal server error." };
  }
}

/**
 * Triggers an instant WhatsApp alert when an appointment is cancelled.
 */
export async function sendWhatsAppCancellationNotification(bookingNo: string) {
  const { 
    enabled, 
    phoneId, 
    accessToken, 
    bookingCancelledEnabled,
    templateCancelled
  } = await getWhatsAppMessagingConfig();

  if (!enabled) return { success: true, message: "Disabled" };
  if (!bookingCancelledEnabled) return { success: true, message: "Cancellation Alerts Disabled" };

  if (!phoneId || !accessToken) {
    return { success: false, error: "WhatsApp credentials not configured." };
  }

  try {
    // 1. Fetch booking details
    const { data: booking, error: bookingErr } = await getSupabaseAdmin()
      .from("bookings")
      .select("*, salons(name), services(name)")
      .eq("booking_no", bookingNo)
      .single();

    if (bookingErr || !booking) return { success: false, error: "Booking not found." };

    // 2. Fetch customer details
    const { data: customer } = await getSupabaseAdmin()
      .from("users")
      .select("full_name, phone")
      .eq("email", booking.customer_email)
      .single();

    if (!customer || !customer.phone) return { success: false, error: "Customer phone is missing." };

    const customerPhone = cleanPhoneNumber(customer.phone);
    const customerName = customer.full_name || "Valued Client";
    const salonName = booking.salons?.name || "Trimma Partner Salon";
    const serviceName = booking.services?.name || "Premium Styling Service";

    // 3. Format Dynamic Cancellation Template
    const variables = {
      customer_name: customerName,
      salon_name: salonName,
      booking_date: booking.booking_date || "",
      booking_time: booking.booking_time || "",
      service_name: serviceName
    };

    const cancelMessage = parseTemplate(templateCancelled || D.cancelled, variables);

    console.log(`❌ Dispatching WhatsApp Booking Cancellation to ${customerPhone}:`);

    // 4. Dispatch WhatsApp
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${phoneId}/messages`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: customerPhone,
          type: "text",
          text: {
            preview_url: false,
            body: cancelMessage,
          },
        }),
      }
    );

    const result = await response.json();
    if (!response.ok) return { success: false, error: formatWhatsAppApiError(result) };

    return { success: true, messageId: result.messages?.[0]?.id };
  } catch (err: any) {
    console.error("❌ Unhandled cancellation WhatsApp error:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Triggers an instant WhatsApp alert when an appointment is marked as a no-show.
 */
export async function sendWhatsAppNoShowNotification(bookingNo: string) {
  const {
    enabled,
    phoneId,
    accessToken,
    bookingCancelledEnabled,
  } = await getWhatsAppMessagingConfig();

  if (!enabled) return { success: true, message: "Disabled" };
  if (!bookingCancelledEnabled) return { success: true, message: "No-Show Alerts Disabled" };

  if (!phoneId || !accessToken) {
    return { success: false, error: "WhatsApp credentials not configured." };
  }

  try {
    const { data: booking, error: bookingErr } = await getSupabaseAdmin()
      .from("bookings")
      .select("*, salons(name), services(name)")
      .eq("booking_no", bookingNo)
      .single();

    if (bookingErr || !booking) return { success: false, error: "Booking not found." };

    const { data: customer } = await getSupabaseAdmin()
      .from("users")
      .select("full_name, phone")
      .eq("email", booking.customer_email)
      .single();

    if (!customer || !customer.phone) return { success: false, error: "Customer phone is missing." };

    const customerPhone = cleanPhoneNumber(customer.phone);
    const customerName = customer.full_name || "Valued Client";
    const salonName = booking.salons?.name || "Trimma Partner Salon";
    const serviceName = booking.services?.name || "Premium Styling Service";

    const variables = {
      customer_name: customerName,
      salon_name: salonName,
      booking_date: booking.booking_date || "",
      booking_time: booking.booking_time || "",
      service_name: serviceName,
    };

    const noShowMessage = parseTemplate(D.noShow, variables);

    console.log(`⚠️ Dispatching WhatsApp No-Show alert to ${customerPhone}:`);

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${phoneId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: customerPhone,
          type: "text",
          text: {
            preview_url: false,
            body: noShowMessage,
          },
        }),
      }
    );

    const result = await response.json();
    if (!response.ok) return { success: false, error: formatWhatsAppApiError(result) };

    return { success: true, messageId: result.messages?.[0]?.id };
  } catch (err: any) {
    console.error("❌ Unhandled no-show WhatsApp error:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Triggers an instant WhatsApp alert when an appointment is rescheduled.
 */
export async function sendWhatsAppRescheduleNotification(bookingNo: string) {
  const { 
    enabled, 
    phoneId, 
    accessToken, 
    bookingRescheduledEnabled,
    templateRescheduled
  } = await getWhatsAppMessagingConfig();

  if (!enabled) return { success: true, message: "Disabled" };
  if (!bookingRescheduledEnabled) return { success: true, message: "Reschedule Alerts Disabled" };

  if (!phoneId || !accessToken) {
    return { success: false, error: "WhatsApp credentials not configured." };
  }

  try {
    // 1. Fetch booking details
    const { data: booking, error: bookingErr } = await getSupabaseAdmin()
      .from("bookings")
      .select("*, salons(name, phone, address, location), services(name)")
      .eq("booking_no", bookingNo)
      .single();

    if (bookingErr || !booking) {
      return { success: false, error: "Booking record not found." };
    }

    // 2. Fetch customer details
    const { data: customer } = await getSupabaseAdmin()
      .from("users")
      .select("full_name, phone")
      .eq("email", booking.customer_email)
      .single();

    if (!customer || !customer.phone) {
      return { success: false, error: "Customer phone is missing." };
    }

    const customerPhone = cleanPhoneNumber(customer.phone);
    const customerName = customer.full_name || "Valued Client";
    const salonName = booking.salons?.name || "Trimma Partner Salon";
    const salonAddress = booking.salons?.address || "";
    const salonLocation = booking.salons?.location || "";
    const serviceName = booking.services?.name || "Premium Styling Service";

    // 📍 GPS coordinate-based Google Maps Directions Link
    let mapsLink = "";
    if (salonLocation && salonLocation.includes(",")) {
      mapsLink = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(salonLocation.trim())}`;
    } else if (salonAddress) {
      mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(salonName + ", " + salonAddress)}`;
    }

    // 3. Format Dynamic Reschedule Template
    const variables = {
      customer_name: customerName,
      salon_name: salonName,
      booking_date: booking.booking_date || "",
      booking_time: booking.booking_time || "",
      service_name: serviceName,
      salon_address: salonAddress,
      maps_link: mapsLink
    };

    const rescheduleMessage = parseTemplate(templateRescheduled || D.rescheduled, variables);

    console.log(`🚀 Dispatching WhatsApp Booking Reschedule to ${customerPhone}:`);

    // 4. Dispatch WhatsApp
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${phoneId}/messages`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: customerPhone,
          type: "text",
          text: {
            preview_url: false,
            body: rescheduleMessage,
          },
        }),
      }
    );

    const result = await response.json();
    if (!response.ok) return { success: false, error: formatWhatsAppApiError(result) };

    return { success: true, messageId: result.messages?.[0]?.id };
  } catch (error: any) {
    console.error("WhatsApp Reschedule Error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Triggers an instant WhatsApp alert when a new booking is created (Pending state).
 * Sends to BOTH customer and Salon Owner.
 */
export async function sendBookingCreatedAlert(bookingNo: string) {
  const {
    enabled,
    phoneId,
    accessToken,
    bookingCreatedEnabled,
    templateBookingCreatedCustomer,
    templateBookingCreatedOwner,
  } = await getWhatsAppMessagingConfig();
  if (!enabled || !bookingCreatedEnabled || !phoneId || !accessToken) {
    return { success: false, message: "Disabled" };
  }

  try {
    const booking = await fetchBookingByNumber(bookingNo, "salons(name, phone)");
    if (!booking) return { success: false };

    const customer = await fetchCustomerContact(booking.customer_email);
    if (!customer?.phone) return { success: false };

    const customerPhone = cleanPhoneNumber(customer.phone);
    const serviceName = await resolveServiceName(booking.id, booking.services?.name);
    const ownerPhone = booking.salons?.phone ? cleanPhoneNumber(booking.salons.phone) : null;
    const customerName = customer.full_name || "Customer";
    const salonName = booking.salons?.name || "Trimma Partner Salon";

    const customerMsg = parseTemplate(templateBookingCreatedCustomer || D.bookingCreatedCustomer, {
      customer_name: customerName,
      salon_name: salonName,
      service_name: serviceName,
      booking_date: booking.booking_date || "",
      booking_time: booking.booking_time || "",
    });

    const ownerMsg = parseTemplate(templateBookingCreatedOwner || D.bookingCreatedOwner, {
      customer_name: customerName,
      salon_name: salonName,
      service_name: serviceName,
      booking_date: booking.booking_date || "",
      booking_time: booking.booking_time || "",
      payment_status: booking.payment_status || "unpaid",
    });

    await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: customerPhone,
        type: "text",
        text: { body: customerMsg },
      }),
    });

    if (ownerPhone) {
      await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: ownerPhone,
          type: "text",
          text: { body: ownerMsg },
        }),
      });
    }

    return { success: true };
  } catch (err: any) {
    console.error("WhatsApp booking created error:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Triggers a WhatsApp review request when an appointment is completed.
 */
export async function sendReviewRequestAlert(bookingNo: string) {
  const { enabled, phoneId, accessToken, templateReview, bookingReviewEnabled } = await getWhatsAppMessagingConfig();
  if (!enabled || !bookingReviewEnabled || !phoneId || !accessToken) return { success: false };

  try {
    const { data: booking } = await getSupabaseAdmin()
      .from("bookings")
      .select("*, salons(name, slug)")
      .eq("booking_no", bookingNo)
      .single();

    if (!booking) return { success: false };

    const { data: customer } = await getSupabaseAdmin()
      .from("users")
      .select("full_name, phone")
      .eq("email", booking.customer_email)
      .single();

    if (!customer || !customer.phone) return { success: false };

    const customerPhone = cleanPhoneNumber(customer.phone);
    const { buildCustomerReviewLink } = await import("@/lib/reviews");
    const reviewLink = buildCustomerReviewLink(booking.id);

    const variables = {
      customer_name: customer.full_name || "Valued Client",
      salon_name: booking.salons?.name || "our salon",
      review_link: reviewLink
    };

    const msg = parseTemplate(templateReview || D.review, variables);

    await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", recipient_type: "individual", to: customerPhone, type: "text", text: { body: msg } })
    });

    return { success: true };
  } catch (err: any) {
    console.error("WhatsApp review request error:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Triggers an instant WhatsApp alert to invite a Salon Owner when onboarding is completed.
 */
export async function sendOnboardingInviteAlert(salonId: string, phone: string, ownerGmail: string, salonName: string, slug?: string | null) {
  const normalizedGmail = normalizeEmail(ownerGmail);
  const cleanPhone = cleanPhoneNumber(phone);

  if (normalizedGmail) {
    try {
      const supabaseAdmin = createSupabaseAdminClient();
      await assignSalonOwnerRoleByAdminClient(supabaseAdmin, normalizedGmail, salonName + " Owner", cleanPhone || "");
    } catch (roleErr: any) {
      console.error("⚠️ Failed to pre-assign salon_owner role:", roleErr);
      return { success: false, error: "Failed to assign salon owner role: " + roleErr.message };
    }
  }

  const { 
    enabled, 
    phoneId, 
    accessToken, 
    onboardingInviteEnabled,
    templateOnboardingInvite 
  } = await getWhatsAppMessagingConfig();

  if (!enabled || !onboardingInviteEnabled || !phoneId || !accessToken) {
    console.log("ℹ️ WhatsApp onboarding invite is disabled or missing credentials.");
    return { success: false, error: "Disabled or missing credentials" };
  }

  if (!phone) {
    console.error("❌ Phone number is required to send onboarding invite.");
    return { success: false, error: "Phone number is missing." };
  }

  try {
    const loginLink = normalizedGmail
      ? `${APP_BASE_URL}/login?email=${encodeURIComponent(normalizedGmail)}&next=${encodeURIComponent("/dashboard/profile")}`
      : `${APP_BASE_URL}/login?next=${encodeURIComponent("/onboarding")}`;
      
    const draftLink = `${APP_BASE_URL}/salons/${slug || salonId}?preview=true`;

    const variables = {
      salon_name: salonName || "Partner",
      owner_gmail: normalizedGmail || "your verified email",
      login_link: loginLink,
      draft_link: draftLink,
    };

    const msg = parseTemplate(templateOnboardingInvite || D.onboardingInvite, variables);

    console.log(`🚀 Dispatching WhatsApp Onboarding Invite to ${cleanPhone}:`);

    const response = await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
      method: "POST",
      headers: { 
        "Authorization": `Bearer ${accessToken}`, 
        "Content-Type": "application/json" 
      },
      body: JSON.stringify({ 
        messaging_product: "whatsapp", 
        recipient_type: "individual", 
        to: cleanPhone, 
        type: "text", 
        text: { body: msg } 
      })
    });

    const result = await response.json();
    if (!response.ok) {
      console.error("❌ Meta Graph API returned error response:", result);
      return { success: false, error: formatWhatsAppApiError(result) };
    }

    return { success: true, messageId: result.messages?.[0]?.id };
  } catch (err: any) {
    console.error("❌ Unhandled WhatsApp onboarding invite error:", err);
    return { success: false, error: err.message || "Internal server error" };
  }
}

/**
 * Triggers WhatsApp alerts when an Agent approves a salon to go Live.
 */
export async function sendAgentApprovalAlerts(salonId: string, ownerPhone: string, salonName: string) {
  const {
    enabled,
    phoneId,
    accessToken,
    agentApprovalEnabled,
    adminAlertPhone,
    templateAgentApprovalOwner,
    templateAgentApprovalAdmin,
  } = await getWhatsAppMessagingConfig();
  if (!enabled || !agentApprovalEnabled || !phoneId || !accessToken) return { success: false };

  try {
    const cleanOwnerPhone = ownerPhone ? cleanPhoneNumber(ownerPhone) : "";
    const adminPhone = adminAlertPhone ? cleanPhoneNumber(adminAlertPhone) : "";

    const ownerMsg = parseTemplate(templateAgentApprovalOwner || D.agentApprovalOwner, {
      salon_name: salonName || "Partner Salon",
    });
    const adminMsg = parseTemplate(templateAgentApprovalAdmin || D.agentApprovalAdmin, {
      salon_name: salonName || "Partner Salon",
    });

    if (cleanOwnerPhone) {
      await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: cleanOwnerPhone,
          type: "text",
          text: { body: ownerMsg },
        }),
      });
    }

    if (adminPhone) {
      await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: adminPhone,
          type: "text",
          text: { body: adminMsg },
        }),
      });
    }

    return { success: true };
  } catch (err: any) {
    console.error("WhatsApp agent approval alert error:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Triggers WhatsApp alerts when an Admin grants the Approved Badge.
 */
export async function sendAdminApprovalAlerts(salonId: string, ownerPhone: string, salonName: string) {
  const {
    enabled,
    phoneId,
    accessToken,
    adminApprovalEnabled,
    adminAlertPhone,
    templateAdminApprovalOwner,
    templateAdminApprovalAdmin,
  } = await getWhatsAppMessagingConfig();
  if (!enabled || !adminApprovalEnabled || !phoneId || !accessToken) return { success: false };

  try {
    const cleanOwnerPhone = ownerPhone ? cleanPhoneNumber(ownerPhone) : "";
    const adminPhone = adminAlertPhone ? cleanPhoneNumber(adminAlertPhone) : "";

    const ownerMsg = parseTemplate(templateAdminApprovalOwner || D.adminApprovalOwner, {
      salon_name: salonName || "Partner Salon",
    });
    const adminMsg = parseTemplate(templateAdminApprovalAdmin || D.adminApprovalAdmin, {
      salon_name: salonName || "Partner Salon",
    });

    if (cleanOwnerPhone) {
      await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: cleanOwnerPhone,
          type: "text",
          text: { body: ownerMsg },
        }),
      });
    }

    if (adminPhone) {
      await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: adminPhone,
          type: "text",
          text: { body: adminMsg },
        }),
      });
    }

    return { success: true };
  } catch (err: any) {
    console.error("WhatsApp admin approval alert error:", err);
    return { success: false, error: err.message };
  }
}

export async function sendWelcomeCustomerWhatsApp(customerName: string, rawPhone: string) {
  const { enabled, phoneId, accessToken, welcomeCustomerEnabled, templateWelcomeCustomer } = await getWhatsAppMessagingConfig();
  if (!enabled || !welcomeCustomerEnabled || !phoneId || !accessToken) return { success: false };

  try {
    const cleanPhone = cleanPhoneNumber(rawPhone);
    if (!cleanPhone) return { success: false, error: "No phone number" };

    const msg = parseTemplate(templateWelcomeCustomer || D.welcomeCustomer, {
      customer_name: customerName,
      dashboard_link: APP_BASE_URL,
    });

    await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: cleanPhone,
        type: "text",
        text: { body: msg },
      }),
    });
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function sendAgentLeadAssignedWhatsApp(agentName: string, rawAgentPhone: string, salonName: string) {
  const { enabled, phoneId, accessToken, agentLeadAssignedEnabled, templateAgentLeadAssigned } = await getWhatsAppMessagingConfig();
  if (!enabled || !agentLeadAssignedEnabled || !phoneId || !accessToken) return { success: false };

  try {
    const cleanPhone = cleanPhoneNumber(rawAgentPhone);
    if (!cleanPhone) return { success: false, error: "No phone number" };

    const msg = parseTemplate(templateAgentLeadAssigned || D.agentLeadAssigned, {
      agent_name: agentName,
      salon_name: salonName,
      salon_address: "",
      onboarding_status: "Pending",
      dashboard_link: APP_BASE_URL,
    });

    await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: cleanPhone,
        type: "text",
        text: { body: msg },
      }),
    });
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
