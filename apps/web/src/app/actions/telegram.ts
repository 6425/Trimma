"use server";

import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { APP_BASE_URL } from "@/lib/email/config";
import { normalizeEmail } from "@/lib/normalize-email";
import { assignSalonOwnerRoleByAdminClient } from "./admin-operations";
import { cleanEnvValue } from "@/lib/supabase-server-env";
import { resolveRoundedReservationAmounts } from "@/lib/booking-pricing";
import { TELEGRAM_TEMPLATE_DEFAULTS } from "@/lib/telegram-templates";
import { resolveEffectiveTelegramCredentials } from "@/lib/telegram-env";

const D = TELEGRAM_TEMPLATE_DEFAULTS;

type BookingSalonJoin = {
  name?: string | null;
  phone?: string | null;
  owner_email?: string | null;
  address?: string | null;
  location?: string | null;
  slug?: string | null;
};

type BookingTelegramRow = {
  id: string;
  customer_email: string;
  booking_date?: string | null;
  booking_time?: string | null;
  amount?: string | number | null;
  total_reservation_fee?: string | number | null;
  payment_status?: string | null;
  services?: { name?: string | null } | null;
  salons?: BookingSalonJoin | null;
};

function getSupabaseAdmin() {
  return createSupabaseAdminClient();
}

function parseTemplate(template: string, variables: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{\\s*${key}\\s*\\}`, "g");
    result = result.replace(regex, value);
  }
  return result;
}

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

function isChatId(value: string): boolean {
  const trimmed = value.trim();
  return /^-?\d+$/.test(trimmed);
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
): Promise<BookingTelegramRow | null> {
  const supabase = getSupabaseAdmin();
  const { data: booking, error } = await supabase
    .from("bookings")
    .select(`*, ${salonSelect}, services(name)`)
    .eq("booking_no", bookingNo)
    .maybeSingle();

  if (error || !booking) {
    console.error("Failed to fetch booking for Telegram:", error);
    return null;
  }

  return booking as unknown as BookingTelegramRow;
}

function isMissingTelegramSchemaError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("telegram_") &&
    (lower.includes("does not exist") ||
      lower.includes("could not find") ||
      (lower.includes("schema cache") && lower.includes("column")))
  );
}

async function fetchCustomerContact(email: string) {
  const supabase = getSupabaseAdmin();
  const { data: customer, error } = await supabase
    .from("users")
    .select("full_name, phone")
    .eq("email", email)
    .maybeSingle();

  if (error) {
    console.error("Failed to fetch customer contact for Telegram:", error);
    return null;
  }

  return customer;
}

async function lookupTelegramChatIdByEmail(email: string): Promise<string | null> {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("users")
      .select("telegram_chat_id")
      .eq("email", email)
      .maybeSingle();

    if (error) {
      if (!isMissingTelegramSchemaError(error.message)) {
        console.error("Failed to fetch Telegram chat ID:", error);
      }
      return null;
    }

    return data?.telegram_chat_id?.trim() || null;
  } catch {
    return null;
  }
}

async function resolveTelegramChatId(
  rawPhoneOrChatId: string | null | undefined,
  explicitChatId?: string | null,
  emailForLookup?: string | null
): Promise<string | null> {
  if (explicitChatId?.trim()) return explicitChatId.trim();
  if (!rawPhoneOrChatId?.trim() && !emailForLookup?.trim()) return null;

  const raw = rawPhoneOrChatId?.trim() || "";
  if (raw && isChatId(raw)) return raw;

  if (emailForLookup?.trim()) {
    const byEmail = await lookupTelegramChatIdByEmail(emailForLookup.trim());
    if (byEmail) return byEmail;
  }

  if (!raw) return null;

  try {
    const clean = cleanPhoneNumber(raw);
    const supabase = getSupabaseAdmin();
    const { data: users, error } = await supabase
      .from("users")
      .select("telegram_chat_id, phone")
      .not("telegram_chat_id", "is", null);

    if (error) {
      if (!isMissingTelegramSchemaError(error.message)) {
        console.error("Failed to resolve Telegram chat ID by phone:", error);
      }
      return null;
    }

    const match = (users || []).find((user) => {
      if (!user.phone) return false;
      const userClean = cleanPhoneNumber(user.phone);
      return userClean === clean || user.phone.trim() === raw;
    });

    return match?.telegram_chat_id?.trim() || null;
  } catch {
    return null;
  }
}

function formatTelegramApiError(result: { description?: string; error_code?: number }): string {
  return result.description || "Failed to send Telegram message.";
}

async function sendTelegramText(botToken: string, chatId: string, body: string) {
  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: body,
      parse_mode: "Markdown",
      disable_web_page_preview: false,
    }),
  });

  const result = await response.json();
  if (!response.ok || !result.ok) {
    return { success: false as const, error: formatTelegramApiError(result) };
  }

  return { success: true as const, messageId: String(result.result?.message_id || "") };
}

export async function validateTelegramCredentials(botTokenOverride?: string) {
  const config = await getTelegramConfig();
  const botToken = botTokenOverride?.trim() || config.botToken;

  if (!botToken) {
    return { valid: false as const, error: "Telegram bot token is required for validation." };
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
    const result = await response.json();
    if (!response.ok || !result.ok) {
      return { valid: false as const, error: formatTelegramApiError(result) };
    }

    return {
      valid: true as const,
      botUsername: result.result?.username as string | undefined,
      botName: result.result?.first_name as string | undefined,
    };
  } catch (err: unknown) {
    return {
      valid: false as const,
      error: err instanceof Error ? err.message : "Telegram validation failed.",
    };
  }
}

export async function getTelegramConfig() {
  try {
    const { data: dbSettings, error } = await getSupabaseAdmin()
      .from("global_payment_settings")
      .select(`
        telegram_enabled,
        telegram_api_id,
        telegram_api_hash,
        telegram_production_dc,
        telegram_production_public_key,
        telegram_bot_token,
        telegram_admin_alert_chat_id,
        telegram_admin_alert_phone,
        telegram_reservation_paid_enabled,
        telegram_booking_confirmed_enabled,
        telegram_booking_rescheduled_enabled,
        telegram_booking_cancelled_enabled,
        telegram_booking_review_enabled,
        telegram_onboarding_invite_enabled,
        telegram_booking_created_enabled,
        telegram_agent_approval_enabled,
        telegram_admin_approval_enabled,
        telegram_welcome_customer_enabled,
        telegram_agent_lead_assigned_enabled,
        telegram_template_reservation_paid,
        telegram_template_confirmed,
        telegram_template_rescheduled,
        telegram_template_cancelled,
        telegram_template_review,
        telegram_template_onboarding_invite,
        telegram_template_booking_created_customer,
        telegram_template_booking_created_owner,
        telegram_template_agent_approval_owner,
        telegram_template_agent_approval_admin,
        telegram_template_admin_approval_owner,
        telegram_template_admin_approval_admin,
        telegram_template_welcome_customer,
        telegram_template_agent_lead_assigned
      `)
      .single();

    if (error || !dbSettings) {
      throw error || new Error("No settings record found.");
    }

    const enabled = dbSettings.telegram_enabled === true;
    const { botToken, apiId, apiHash, source, tokenFromEnv } = resolveEffectiveTelegramCredentials(
      dbSettings.telegram_api_id || "",
      dbSettings.telegram_api_hash || "",
      dbSettings.telegram_bot_token || ""
    );

    return {
      enabled,
      apiId,
      apiHash,
      botToken,
      tokenFromEnv,
      productionDc: dbSettings.telegram_production_dc?.trim() || "2",
      productionPublicKey: dbSettings.telegram_production_public_key?.trim() || "",
      adminAlertChatId: dbSettings.telegram_admin_alert_chat_id?.trim() || "",
      adminAlertPhone: dbSettings.telegram_admin_alert_phone?.trim() || "",
      credentialsSource: source,
      source,
      reservationPaidEnabled: dbSettings.telegram_reservation_paid_enabled !== false,
      bookingConfirmedEnabled: dbSettings.telegram_booking_confirmed_enabled !== false,
      bookingRescheduledEnabled: dbSettings.telegram_booking_rescheduled_enabled !== false,
      bookingCancelledEnabled: dbSettings.telegram_booking_cancelled_enabled !== false,
      bookingReviewEnabled: dbSettings.telegram_booking_review_enabled !== false,
      onboardingInviteEnabled: dbSettings.telegram_onboarding_invite_enabled !== false,
      bookingCreatedEnabled: dbSettings.telegram_booking_created_enabled !== false,
      agentApprovalEnabled: dbSettings.telegram_agent_approval_enabled !== false,
      adminApprovalEnabled: dbSettings.telegram_admin_approval_enabled !== false,
      welcomeCustomerEnabled: dbSettings.telegram_welcome_customer_enabled !== false,
      agentLeadAssignedEnabled: dbSettings.telegram_agent_lead_assigned_enabled !== false,
      templateReservationPaid: dbSettings.telegram_template_reservation_paid || D.reservationPaid,
      templateConfirmed: dbSettings.telegram_template_confirmed || D.confirmed,
      templateRescheduled: dbSettings.telegram_template_rescheduled || D.rescheduled,
      templateCancelled: dbSettings.telegram_template_cancelled || D.cancelled,
      templateReview: dbSettings.telegram_template_review || D.review,
      templateOnboardingInvite: dbSettings.telegram_template_onboarding_invite || D.onboardingInvite,
      templateBookingCreatedCustomer:
        dbSettings.telegram_template_booking_created_customer || D.bookingCreatedCustomer,
      templateBookingCreatedOwner:
        dbSettings.telegram_template_booking_created_owner || D.bookingCreatedOwner,
      templateAgentApprovalOwner:
        dbSettings.telegram_template_agent_approval_owner || D.agentApprovalOwner,
      templateAgentApprovalAdmin:
        dbSettings.telegram_template_agent_approval_admin || D.agentApprovalAdmin,
      templateAdminApprovalOwner:
        dbSettings.telegram_template_admin_approval_owner || D.adminApprovalOwner,
      templateAdminApprovalAdmin:
        dbSettings.telegram_template_admin_approval_admin || D.adminApprovalAdmin,
      templateWelcomeCustomer: dbSettings.telegram_template_welcome_customer || D.welcomeCustomer,
      templateAgentLeadAssigned:
        dbSettings.telegram_template_agent_lead_assigned || D.agentLeadAssigned,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (isMissingTelegramSchemaError(message)) {
      console.warn("Telegram settings columns missing. Run packages/db/TELEGRAM_SETTINGS_PATCH.sql");
    } else {
      console.warn("Failed to load Telegram settings from DB, using defaults:", err);
    }
    const { botToken, apiId, apiHash, source, tokenFromEnv } = resolveEffectiveTelegramCredentials(
      "",
      "",
      ""
    );
    return {
      enabled: false,
      apiId,
      apiHash,
      botToken,
      tokenFromEnv,
      productionDc: "2",
      productionPublicKey: "",
      adminAlertChatId: "",
      adminAlertPhone: "",
      credentialsSource: source,
      source,
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
    };
  }
}

export async function saveTelegramSettings(
  apiId: string,
  apiHash: string,
  productionDc: string,
  productionPublicKey: string,
  botToken: string,
  enabled: boolean,
  adminAlertChatId: string,
  adminAlertPhone: string,
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
    const resolved = resolveEffectiveTelegramCredentials(apiId, apiHash, botToken);
    const trimmedApiId = cleanEnvValue(resolved.apiId);
    const trimmedApiHash = cleanEnvValue(resolved.apiHash);
    const trimmedBotToken = cleanEnvValue(resolved.botToken);
    const trimmedDc = (productionDc || "2").trim();

    if (enabled && trimmedBotToken) {
      const validation = await validateTelegramCredentials(trimmedBotToken);
      if (!validation.valid) {
        return { success: false, error: validation.error || "Telegram bot token is invalid." };
      }
    }

    const trimmedAdminChatId = adminAlertChatId?.trim() || "";
    if (trimmedAdminChatId && trimmedAdminChatId.replace(/\D/g, "").length < 8) {
      return {
        success: false,
        error:
          'Admin Chat ID looks invalid (too short). Clear it, open your bot in Telegram, tap Start, click Detect, then Save.',
      };
    }

    const { error } = await getSupabaseAdmin()
      .from("global_payment_settings")
      .upsert({
        id: "00000000-0000-0000-0000-000000000001",
        telegram_enabled: enabled,
        telegram_api_id: trimmedApiId || null,
        telegram_api_hash: trimmedApiHash || null,
        telegram_production_dc: trimmedDc || "2",
        telegram_production_public_key: productionPublicKey?.trim() || null,
        telegram_bot_token: trimmedBotToken || null,
        telegram_admin_alert_chat_id: adminAlertChatId?.trim() || null,
        telegram_admin_alert_phone: adminAlertPhone?.trim() || null,
        telegram_reservation_paid_enabled: reservationPaidEnabled !== false,
        telegram_booking_confirmed_enabled: bookingConfirmedEnabled !== false,
        telegram_booking_rescheduled_enabled: bookingRescheduledEnabled !== false,
        telegram_booking_cancelled_enabled: bookingCancelledEnabled !== false,
        telegram_booking_review_enabled: bookingReviewEnabled !== false,
        telegram_onboarding_invite_enabled: onboardingInviteEnabled !== false,
        telegram_booking_created_enabled: bookingCreatedEnabled !== false,
        telegram_agent_approval_enabled: agentApprovalEnabled !== false,
        telegram_admin_approval_enabled: adminApprovalEnabled !== false,
        telegram_welcome_customer_enabled: welcomeCustomerEnabled !== false,
        telegram_agent_lead_assigned_enabled: agentLeadAssignedEnabled !== false,
        telegram_template_reservation_paid: templateReservationPaid || null,
        telegram_template_confirmed: templateConfirmed || null,
        telegram_template_rescheduled: templateRescheduled || null,
        telegram_template_cancelled: templateCancelled || null,
        telegram_template_review: templateReview || null,
        telegram_template_onboarding_invite: templateOnboardingInvite || null,
        telegram_template_booking_created_customer: templateBookingCreatedCustomer || null,
        telegram_template_booking_created_owner: templateBookingCreatedOwner || null,
        telegram_template_agent_approval_owner: templateAgentApprovalOwner || null,
        telegram_template_agent_approval_admin: templateAgentApprovalAdmin || null,
        telegram_template_admin_approval_owner: templateAdminApprovalOwner || null,
        telegram_template_admin_approval_admin: templateAdminApprovalAdmin || null,
        telegram_template_welcome_customer: templateWelcomeCustomer || null,
        telegram_template_agent_lead_assigned: templateAgentLeadAssigned || null,
      });

    if (error) throw error;
    void import("@/app/actions/telegram-connect").then((mod) =>
      mod.registerTelegramBotWebhook(trimmedBotToken)
    );
    return { success: true };
  } catch (err: unknown) {
    console.error("Failed to save Telegram configuration:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to save Telegram settings.",
    };
  }
}

export async function getTelegramBotInviteUrl(botTokenOverride?: string) {
  const validation = await validateTelegramCredentials(botTokenOverride);
  if (!validation.valid || !validation.botUsername) {
    return { success: false as const, error: validation.error || "Connect a valid bot token first." };
  }
  return {
    success: true as const,
    url: `https://t.me/${validation.botUsername}`,
    botUsername: validation.botUsername,
  };
}

export type TelegramInboxChat = {
  chatId: string;
  displayName: string;
  username?: string;
  lastMessageAt?: string;
};

/** Lists people who recently pressed Start on your Trimma bot (from Telegram getUpdates). */
export async function listTelegramBotRecentChats(botTokenOverride?: string) {
  const config = await getTelegramConfig();
  const botToken = botTokenOverride?.trim() || config.botToken;

  if (!botToken) {
    return { success: false as const, error: "Save your Bot Token first, then try again." };
  }

  try {
    const webhookRes = await fetch(`https://api.telegram.org/bot${botToken}/getWebhookInfo`);
    const webhookInfo = await webhookRes.json();
    if (webhookInfo.ok && webhookInfo.result?.url) {
      await fetch(`https://api.telegram.org/bot${botToken}/deleteWebhook?drop_pending_updates=false`);
    }

    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/getUpdates?limit=100&allowed_updates=${encodeURIComponent(
        JSON.stringify(["message", "edited_message", "my_chat_member"])
      )}`
    );
    const result = await response.json();

    if (!response.ok || !result.ok) {
      return { success: false as const, error: formatTelegramApiError(result) };
    }

    const chats = new Map<string, TelegramInboxChat>();

    for (const update of result.result || []) {
      const message = update.message || update.edited_message;
      const memberUpdate = update.my_chat_member;
      const chat = message?.chat || memberUpdate?.chat;
      if (!chat?.id) continue;

      const chatId = String(chat.id);
      const displayName =
        [chat.first_name, chat.last_name].filter(Boolean).join(" ").trim() ||
        chat.title ||
        chat.username ||
        chatId;
      const existing = chats.get(chatId);
      const messageDate = message?.date || memberUpdate?.date;
      const lastMessageAt = messageDate
        ? new Date(messageDate * 1000).toISOString()
        : undefined;

      chats.set(chatId, {
        chatId,
        displayName,
        username: chat.username || undefined,
        lastMessageAt: lastMessageAt || existing?.lastMessageAt,
      });
    }

    const list = Array.from(chats.values()).sort((a, b) =>
      (b.lastMessageAt || "").localeCompare(a.lastMessageAt || "")
    );

    if (!list.length) {
      return {
        success: false as const,
        error:
          "No Telegram starters found yet. Open https://t.me/Trimmaiobot (or your bot link), tap Start, send any message, then click Detect again within 1 minute.",
      };
    }

    return { success: true as const, chats: list };
  } catch (err: unknown) {
    return {
      success: false as const,
      error: err instanceof Error ? err.message : "Could not read Telegram bot inbox.",
    };
  }
}

export async function testTelegramConnection(testChatId: string) {
  const config = await getTelegramConfig();
  if (!config.botToken) {
    return { success: false, error: "Telegram bot token is not configured." };
  }

  const chatId = testChatId.trim();
  if (!chatId) {
    return { success: false, error: "Recipient chat ID is required." };
  }

  const testMessage = `Hello! This is a test message from your *Trimma Admin Settings Panel*.\n\nYour Telegram Bot API configuration is working.\n\nApp API ID: ${config.apiId || "not set"}\nProduction DC: ${config.productionDc}`;

  try {
    const result = await sendTelegramText(config.botToken, chatId, testMessage);
    if (!result.success) {
      return { success: false, error: formatTelegramTestError(chatId, result.error || "Failed to send.") };
    }
    return result;
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Telegram test failed.",
    };
  }
}

function formatTelegramTestError(chatId: string, error: string): string {
  const lower = error.toLowerCase();
  if (lower.includes("chat not found")) {
    return `Bad Request: chat not found. Chat ID "${chatId}" is wrong or this user has not tapped Start on your bot yet. Clear the field, open your bot in Telegram, tap Start, click Detect, Save, then test again.`;
  }
  return error;
}

async function getTelegramMessagingConfig() {
  const config = await getTelegramConfig();
  return config;
}

export async function sendTelegramReservationPaidNotification(
  bookingNo: string,
  overrides?: { customerPhone?: string; customerName?: string; serviceName?: string }
) {
  const {
    enabled,
    botToken,
    reservationPaidEnabled,
    templateReservationPaid,
  } = await getTelegramMessagingConfig();

  if (!enabled || !reservationPaidEnabled || !botToken) {
    return { success: true, message: "Disabled" };
  }

  try {
    const booking = await fetchBookingByNumber(bookingNo, "salons(name, phone, owner_email, address, location)");
    if (!booking) return { success: false, error: "Booking record not found." };

    const customer = await fetchCustomerContact(booking.customer_email);
    const customerName = overrides?.customerName || customer?.full_name || "Valued Client";
    const chatId = await resolveTelegramChatId(
      overrides?.customerPhone || customer?.phone,
      undefined,
      booking.customer_email
    );
    if (!chatId) return { success: false, error: "Customer Telegram chat ID is missing.", skipped: true };

    const salonName = booking.salons?.name || "Trimma Partner Salon";
    const serviceName =
      overrides?.serviceName || (await resolveServiceName(booking.id, booking.services?.name));
    const totalAmount = parseFloat(String(booking.amount ?? 0));
    const { depositAmount, balanceAmount } = resolveRoundedReservationAmounts(
      totalAmount,
      booking.total_reservation_fee
    );

    const customerMessage = parseTemplate(templateReservationPaid || D.reservationPaid, {
      customer_name: customerName,
      booking_no: bookingNo,
      salon_name: salonName,
      booking_date: booking.booking_date || "",
      booking_time: booking.booking_time || "",
      service_name: serviceName,
      deposit_paid: depositAmount.toLocaleString(),
      balance_to_pay: balanceAmount.toLocaleString(),
    });

    return await sendTelegramText(botToken, chatId, customerMessage);
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to send Telegram reservation alert.",
    };
  }
}

export async function sendOwnerBookingRequestTelegram(bookingNo: string, paymentStatus = "reservation_paid") {
  const { enabled, botToken, bookingCreatedEnabled, templateBookingCreatedOwner } =
    await getTelegramMessagingConfig();
  if (!enabled || !bookingCreatedEnabled || !botToken) return { success: true, message: "Disabled" };

  try {
    const booking = await fetchBookingByNumber(bookingNo, "salons(name, phone, owner_email)");
    if (!booking) return { success: false, error: "Booking not found." };

    const ownerChatId = await resolveTelegramChatId(
      booking.salons?.phone,
      undefined,
      booking.salons?.owner_email
    );
    if (!ownerChatId) return { success: false, error: "Salon Telegram chat ID is missing.", skipped: true };

    const customer = await fetchCustomerContact(booking.customer_email);
    const ownerMsg = parseTemplate(templateBookingCreatedOwner || D.bookingCreatedOwner, {
      customer_name: customer?.full_name || "Customer",
      salon_name: booking.salons?.name || "Trimma Partner Salon",
      service_name: await resolveServiceName(booking.id, booking.services?.name),
      booking_date: booking.booking_date || "",
      booking_time: booking.booking_time || "",
      payment_status: paymentStatus,
    });

    return await sendTelegramText(botToken, ownerChatId, ownerMsg);
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to send owner booking alert.",
    };
  }
}

export async function sendTelegramNotification(
  bookingNo: string,
  overrides?: { customerPhone?: string; customerName?: string; serviceName?: string }
) {
  const { enabled, botToken, bookingConfirmedEnabled, templateConfirmed } =
    await getTelegramMessagingConfig();
  if (!enabled || !bookingConfirmedEnabled || !botToken) return { success: true, message: "Disabled" };

  try {
    const booking = await fetchBookingByNumber(bookingNo, "salons(name, phone, owner_email, address, location)");
    if (!booking) return { success: false, error: "Booking record not found." };

    const customer = await fetchCustomerContact(booking.customer_email);
    const customerName = overrides?.customerName || customer?.full_name || "Valued Client";
    const chatId = await resolveTelegramChatId(
      overrides?.customerPhone || customer?.phone,
      undefined,
      booking.customer_email
    );
    if (!chatId) return { success: false, error: "Customer Telegram chat ID is missing.", skipped: true };

    const salonName = booking.salons?.name || "Trimma Partner Salon";
    const salonAddress = booking.salons?.address || "";
    const salonLocation = booking.salons?.location || "";
    const serviceName =
      overrides?.serviceName || (await resolveServiceName(booking.id, booking.services?.name));
    const totalAmount = parseFloat(String(booking.amount ?? 0));
    const { depositAmount, balanceAmount } = resolveRoundedReservationAmounts(
      totalAmount,
      booking.total_reservation_fee
    );

    let mapsLink = "";
    if (salonLocation && salonLocation.includes(",")) {
      mapsLink = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(salonLocation.trim())}`;
    } else if (salonAddress) {
      mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(salonName + ", " + salonAddress)}`;
    }

    const customerMessage = parseTemplate(templateConfirmed || D.confirmed, {
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
      maps_link: mapsLink,
    });

    const result = await sendTelegramText(botToken, chatId, customerMessage);
    if (!result.success) return result;

    const ownerChatId = await resolveTelegramChatId(
      booking.salons?.phone,
      undefined,
      booking.salons?.owner_email
    );
    if (ownerChatId) {
      const ownerMessage = `🔔 *BOOKING CONFIRMED* 🔔\n\nYou confirmed the booking from *${customerName}*.\n\n📋 Ref: ${bookingNo}\n📅 Date: ${booking.booking_date}\n⏰ Time: ${booking.booking_time}\n💇 Service: ${serviceName}\n\nPlease prepare for their arrival! ✂️`;
      await sendTelegramText(botToken, ownerChatId, ownerMessage);
    }

    return result;
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to send Telegram confirmation.",
    };
  }
}

export async function sendTelegramCancellationNotification(bookingNo: string) {
  const { enabled, botToken, bookingCancelledEnabled, templateCancelled } =
    await getTelegramMessagingConfig();
  if (!enabled || !bookingCancelledEnabled || !botToken) return { success: true, message: "Disabled" };

  try {
    const booking = await fetchBookingByNumber(bookingNo, "salons(name)");
    if (!booking) return { success: false, error: "Booking not found." };

    const customer = await fetchCustomerContact(booking.customer_email);
    const chatId = await resolveTelegramChatId(customer?.phone, undefined, booking.customer_email);
    if (!chatId) return { success: false, error: "Customer Telegram chat ID is missing.", skipped: true };

    const cancelMessage = parseTemplate(templateCancelled || D.cancelled, {
      customer_name: customer?.full_name || "Valued Client",
      salon_name: booking.salons?.name || "Trimma Partner Salon",
      booking_date: booking.booking_date || "",
      booking_time: booking.booking_time || "",
      service_name: booking.services?.name || "Premium Styling Service",
    });

    return await sendTelegramText(botToken, chatId, cancelMessage);
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to send Telegram cancellation.",
    };
  }
}

export async function sendTelegramNoShowNotification(bookingNo: string) {
  const { enabled, botToken, bookingCancelledEnabled } = await getTelegramMessagingConfig();
  if (!enabled || !bookingCancelledEnabled || !botToken) return { success: true, message: "Disabled" };

  try {
    const booking = await fetchBookingByNumber(bookingNo, "salons(name)");
    if (!booking) return { success: false, error: "Booking not found." };

    const customer = await fetchCustomerContact(booking.customer_email);
    const chatId = await resolveTelegramChatId(customer?.phone, undefined, booking.customer_email);
    if (!chatId) return { success: false, error: "Customer Telegram chat ID is missing.", skipped: true };

    const noShowMessage = parseTemplate(D.noShow, {
      customer_name: customer?.full_name || "Valued Client",
      salon_name: booking.salons?.name || "Trimma Partner Salon",
      booking_date: booking.booking_date || "",
      booking_time: booking.booking_time || "",
      service_name: booking.services?.name || "Premium Styling Service",
    });

    return await sendTelegramText(botToken, chatId, noShowMessage);
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to send Telegram no-show alert.",
    };
  }
}

export async function sendTelegramRescheduleNotification(bookingNo: string) {
  const { enabled, botToken, bookingRescheduledEnabled, templateRescheduled } =
    await getTelegramMessagingConfig();
  if (!enabled || !bookingRescheduledEnabled || !botToken) return { success: true, message: "Disabled" };

  try {
    const booking = await fetchBookingByNumber(bookingNo, "salons(name, phone, owner_email, address, location)");
    if (!booking) return { success: false, error: "Booking record not found." };

    const customer = await fetchCustomerContact(booking.customer_email);
    const chatId = await resolveTelegramChatId(customer?.phone, undefined, booking.customer_email);
    if (!chatId) return { success: false, error: "Customer Telegram chat ID is missing.", skipped: true };

    const salonName = booking.salons?.name || "Trimma Partner Salon";
    const salonAddress = booking.salons?.address || "";
    const salonLocation = booking.salons?.location || "";
    let mapsLink = "";
    if (salonLocation && salonLocation.includes(",")) {
      mapsLink = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(salonLocation.trim())}`;
    } else if (salonAddress) {
      mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(salonName + ", " + salonAddress)}`;
    }

    const rescheduleMessage = parseTemplate(templateRescheduled || D.rescheduled, {
      customer_name: customer?.full_name || "Valued Client",
      salon_name: salonName,
      booking_date: booking.booking_date || "",
      booking_time: booking.booking_time || "",
      service_name: booking.services?.name || "Premium Styling Service",
      salon_address: salonAddress,
      maps_link: mapsLink,
    });

    return await sendTelegramText(botToken, chatId, rescheduleMessage);
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to send Telegram reschedule alert.",
    };
  }
}

export async function sendBookingCreatedTelegramAlert(bookingNo: string) {
  const {
    enabled,
    botToken,
    bookingCreatedEnabled,
    templateBookingCreatedCustomer,
    templateBookingCreatedOwner,
  } = await getTelegramMessagingConfig();
  if (!enabled || !bookingCreatedEnabled || !botToken) return { success: false, message: "Disabled" };

  try {
    const booking = await fetchBookingByNumber(bookingNo, "salons(name, phone, owner_email)");
    if (!booking) return { success: false };

    const customer = await fetchCustomerContact(booking.customer_email);
    const customerChatId = await resolveTelegramChatId(
      customer?.phone,
      undefined,
      booking.customer_email
    );
    if (!customerChatId) return { success: false, error: "Customer Telegram chat ID is missing.", skipped: true };

    const customerName = customer?.full_name || "Customer";
    const salonName = booking.salons?.name || "Trimma Partner Salon";
    const serviceName = await resolveServiceName(booking.id, booking.services?.name);

    const customerMsg = parseTemplate(templateBookingCreatedCustomer || D.bookingCreatedCustomer, {
      customer_name: customerName,
      salon_name: salonName,
      service_name: serviceName,
      booking_date: booking.booking_date || "",
      booking_time: booking.booking_time || "",
    });

    await sendTelegramText(botToken, customerChatId, customerMsg);

    const ownerChatId = await resolveTelegramChatId(
      booking.salons?.phone,
      undefined,
      booking.salons?.owner_email
    );
    if (ownerChatId) {
      const ownerMsg = parseTemplate(templateBookingCreatedOwner || D.bookingCreatedOwner, {
        customer_name: customerName,
        salon_name: salonName,
        service_name: serviceName,
        booking_date: booking.booking_date || "",
        booking_time: booking.booking_time || "",
        payment_status: booking.payment_status || "unpaid",
      });
      await sendTelegramText(botToken, ownerChatId, ownerMsg);
    }

    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Telegram booking created alert failed.",
    };
  }
}

export async function sendReviewRequestTelegramAlert(bookingNo: string) {
  const { enabled, botToken, templateReview, bookingReviewEnabled } =
    await getTelegramMessagingConfig();
  if (!enabled || !bookingReviewEnabled || !botToken) return { success: false };

  try {
    const { data: booking } = await getSupabaseAdmin()
      .from("bookings")
      .select("*, salons(name, slug)")
      .eq("booking_no", bookingNo)
      .single();
    if (!booking) return { success: false };

    const customer = await fetchCustomerContact(booking.customer_email);
    const chatId = await resolveTelegramChatId(customer?.phone, undefined, booking.customer_email);
    if (!chatId) return { success: false, error: "Customer Telegram chat ID is missing.", skipped: true };

    const { buildCustomerReviewLink } = await import("@/lib/reviews");
    const msg = parseTemplate(templateReview || D.review, {
      customer_name: customer?.full_name || "Valued Client",
      salon_name: booking.salons?.name || "our salon",
      review_link: buildCustomerReviewLink(booking.id),
    });

    return await sendTelegramText(botToken, chatId, msg);
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Telegram review request failed.",
    };
  }
}

export async function sendOnboardingInviteTelegramAlert(
  salonId: string,
  phone: string,
  ownerGmail: string,
  salonName: string,
  slug?: string | null
) {
  const normalizedGmail = normalizeEmail(ownerGmail);
  const cleanPhone = cleanPhoneNumber(phone);

  if (normalizedGmail) {
    try {
      await assignSalonOwnerRoleByAdminClient(
        createSupabaseAdminClient(),
        normalizedGmail,
        salonName + " Owner",
        cleanPhone || ""
      );
    } catch (roleErr: unknown) {
      return {
        success: false,
        error:
          "Failed to assign salon owner role: " +
          (roleErr instanceof Error ? roleErr.message : "unknown error"),
      };
    }
  }

  const { enabled, botToken, onboardingInviteEnabled, templateOnboardingInvite } =
    await getTelegramMessagingConfig();
  if (!enabled || !onboardingInviteEnabled || !botToken) {
    return { success: false, error: "Disabled or missing credentials" };
  }

  const chatId = await resolveTelegramChatId(phone);
  if (!chatId) return { success: false, error: "Recipient Telegram chat ID is missing.", skipped: true };

  const loginLink = normalizedGmail
    ? `${APP_BASE_URL}/login?email=${encodeURIComponent(normalizedGmail)}&next=${encodeURIComponent("/dashboard/profile")}`
    : `${APP_BASE_URL}/login?next=${encodeURIComponent("/onboarding")}`;
  const draftLink = `${APP_BASE_URL}/salons/${slug || salonId}?preview=true`;

  const msg = parseTemplate(templateOnboardingInvite || D.onboardingInvite, {
    salon_name: salonName || "Partner",
    owner_gmail: normalizedGmail || "your verified email",
    login_link: loginLink,
    draft_link: draftLink,
  });

  return await sendTelegramText(botToken, chatId, msg);
}

export async function sendAgentApprovalTelegramAlerts(
  _salonId: string,
  ownerPhone: string,
  salonName: string
) {
  const {
    enabled,
    botToken,
    agentApprovalEnabled,
    adminAlertChatId,
    adminAlertPhone,
    templateAgentApprovalOwner,
    templateAgentApprovalAdmin,
  } = await getTelegramMessagingConfig();
  if (!enabled || !agentApprovalEnabled || !botToken) return { success: false };

  try {
    const ownerChatId = await resolveTelegramChatId(ownerPhone);
    const adminChatId =
      adminAlertChatId || (await resolveTelegramChatId(adminAlertPhone));

    const ownerMsg = parseTemplate(templateAgentApprovalOwner || D.agentApprovalOwner, {
      salon_name: salonName || "Partner Salon",
    });
    const adminMsg = parseTemplate(templateAgentApprovalAdmin || D.agentApprovalAdmin, {
      salon_name: salonName || "Partner Salon",
    });

    if (ownerChatId) await sendTelegramText(botToken, ownerChatId, ownerMsg);
    if (adminChatId) await sendTelegramText(botToken, adminChatId, adminMsg);

    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Telegram agent approval alert failed.",
    };
  }
}

export async function sendAdminApprovalTelegramAlerts(
  _salonId: string,
  ownerPhone: string,
  salonName: string
) {
  const {
    enabled,
    botToken,
    adminApprovalEnabled,
    adminAlertChatId,
    adminAlertPhone,
    templateAdminApprovalOwner,
    templateAdminApprovalAdmin,
  } = await getTelegramMessagingConfig();
  if (!enabled || !adminApprovalEnabled || !botToken) return { success: false };

  try {
    const ownerChatId = await resolveTelegramChatId(ownerPhone);
    const adminChatId =
      adminAlertChatId || (await resolveTelegramChatId(adminAlertPhone));

    const ownerMsg = parseTemplate(templateAdminApprovalOwner || D.adminApprovalOwner, {
      salon_name: salonName || "Partner Salon",
    });
    const adminMsg = parseTemplate(templateAdminApprovalAdmin || D.adminApprovalAdmin, {
      salon_name: salonName || "Partner Salon",
    });

    if (ownerChatId) await sendTelegramText(botToken, ownerChatId, ownerMsg);
    if (adminChatId) await sendTelegramText(botToken, adminChatId, adminMsg);

    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Telegram admin approval alert failed.",
    };
  }
}

export async function sendWelcomeCustomerTelegram(customerName: string, rawPhone: string) {
  const { enabled, botToken, welcomeCustomerEnabled, templateWelcomeCustomer } =
    await getTelegramMessagingConfig();
  if (!enabled || !welcomeCustomerEnabled || !botToken) return { success: false };

  try {
    const chatId = await resolveTelegramChatId(rawPhone);
    if (!chatId) return { success: false, error: "Customer Telegram chat ID is missing.", skipped: true };

    const msg = parseTemplate(templateWelcomeCustomer || D.welcomeCustomer, {
      customer_name: customerName,
      dashboard_link: APP_BASE_URL,
    });

    return await sendTelegramText(botToken, chatId, msg);
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Telegram welcome failed." };
  }
}

export async function sendAgentLeadAssignedTelegram(
  agentName: string,
  rawAgentPhone: string,
  salonName: string,
  options?: {
    salonAddress?: string;
    onboardingStatus?: string;
    dashboardLink?: string;
  }
) {
  const { enabled, botToken, agentLeadAssignedEnabled, templateAgentLeadAssigned } =
    await getTelegramMessagingConfig();
  if (!enabled || !agentLeadAssignedEnabled || !botToken) return { success: false };

  try {
    const chatId = await resolveTelegramChatId(rawAgentPhone);
    if (!chatId) return { success: false, error: "Agent Telegram chat ID is missing.", skipped: true };

    const msg = parseTemplate(templateAgentLeadAssigned || D.agentLeadAssigned, {
      agent_name: agentName,
      salon_name: salonName,
      salon_address: options?.salonAddress || "",
      onboarding_status: options?.onboardingStatus || "Pending",
      dashboard_link: options?.dashboardLink || APP_BASE_URL,
    });

    return await sendTelegramText(botToken, chatId, msg);
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Telegram lead assigned alert failed.",
    };
  }
}

/** Manual appointment reminder — salon owner dashboard (Telegram). */
export async function sendTelegramBookingReminder(bookingNo: string) {
  const { enabled, botToken } = await getTelegramMessagingConfig();
  if (!enabled || !botToken) {
    return { success: false, error: "Telegram alerts are disabled or not configured.", skipped: true };
  }

  try {
    const booking = await fetchBookingByNumber(bookingNo, "salons(name, address, location)");
    if (!booking) return { success: false, error: "Booking record not found." };

    const customer = await fetchCustomerContact(booking.customer_email);
    const customerName = customer?.full_name || "Valued Client";
    const chatId = await resolveTelegramChatId(
      customer?.phone,
      undefined,
      booking.customer_email
    );
    if (!chatId) {
      return { success: false, error: "Customer Telegram chat ID is missing.", skipped: true };
    }

    const salonName = booking.salons?.name || "Trimma Partner Salon";
    const salonAddress = booking.salons?.address || "";
    const salonLocation = booking.salons?.location || "";
    const serviceName = await resolveServiceName(booking.id, booking.services?.name);

    let mapsLink = "";
    if (salonLocation && salonLocation.includes(",")) {
      mapsLink = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(salonLocation.trim())}`;
    } else if (salonAddress) {
      mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(salonName + ", " + salonAddress)}`;
    }

    const customerMessage = parseTemplate(D.appointmentReminder, {
      customer_name: customerName,
      booking_no: bookingNo,
      salon_name: salonName,
      booking_date: booking.booking_date || "",
      booking_time: booking.booking_time || "",
      service_name: serviceName,
      salon_address: salonAddress,
      maps_link: mapsLink,
    });

    return await sendTelegramText(botToken, chatId, customerMessage);
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to send Telegram reminder.",
    };
  }
}

/** Marketing VIP promo blast — plain text Telegram to a linked customer chat. */
export async function sendMarketingPromoTelegram(
  rawPhone: string | null | undefined,
  customerEmail: string,
  messageBody: string
) {
  const { enabled, botToken } = await getTelegramMessagingConfig();
  if (!enabled || !botToken) {
    return { success: false, error: "Telegram alerts are disabled or not configured.", skipped: true };
  }

  try {
    const chatId = await resolveTelegramChatId(rawPhone, undefined, customerEmail);
    if (!chatId) {
      return { success: false, error: "Customer Telegram chat ID is missing.", skipped: true };
    }

    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: messageBody,
        disable_web_page_preview: false,
      }),
    });

    const result = await response.json();
    if (!response.ok || !result.ok) {
      return { success: false, error: formatTelegramApiError(result) };
    }

    return { success: true, messageId: String(result.result?.message_id || "") };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to send Telegram promo.",
    };
  }
}
