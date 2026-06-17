"use server";

import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { APP_BASE_URL } from "@/lib/email/config";
import { normalizeEmail } from "@/lib/normalize-email";
import { getTelegramConfig, validateTelegramCredentials } from "@/app/actions/telegram";
import {
  buildTelegramDeepLink,
  buildTelegramWebhookSecret,
  createTelegramConnectToken,
  getTelegramLinkStatusForEmail,
  processTelegramConnectUpdates,
  readTelegramWebhookSecret,
} from "@/lib/telegram-connect-core";

function getSupabase() {
  return createSupabaseAdminClient();
}

export async function getTelegramConnectStatus(userEmail: string) {
  try {
    const email = normalizeEmail(userEmail);
    if (!email) return { success: false as const, error: "Invalid account email." };

    const config = await getTelegramConfig();
    const status = await getTelegramLinkStatusForEmail(getSupabase(), email);
    const validation = config.botToken ? await validateTelegramCredentials() : { valid: false as const };

    return {
      success: true as const,
      linked: status.linked,
      chatId: status.chatId,
      telegramEnabled: config.enabled === true,
      botUsername: validation.valid ? validation.botUsername : undefined,
    };
  } catch (err: unknown) {
    return {
      success: false as const,
      error: err instanceof Error ? err.message : "Could not load Telegram link status.",
    };
  }
}

export async function createTelegramConnectLink(userEmail: string) {
  try {
    const email = normalizeEmail(userEmail);
    if (!email) return { success: false as const, error: "Invalid account email." };

    const config = await getTelegramConfig();
    if (!config.enabled || !config.botToken) {
      return { success: false as const, error: "Telegram notifications are not enabled yet." };
    }

    const validation = await validateTelegramCredentials();
    if (!validation.valid || !validation.botUsername) {
      return { success: false as const, error: validation.error || "Telegram bot is not configured." };
    }

    const { token } = await createTelegramConnectToken(getSupabase(), email);
    const url = buildTelegramDeepLink(validation.botUsername, token);

    return {
      success: true as const,
      url,
      botUsername: validation.botUsername,
    };
  } catch (err: unknown) {
    return {
      success: false as const,
      error: err instanceof Error ? err.message : "Could not create Telegram connect link.",
    };
  }
}

/** Polls recent bot messages to finish a pending connect for this user. */
export async function syncTelegramConnectForUser(userEmail: string) {
  try {
    const email = normalizeEmail(userEmail);
    if (!email) return { success: false as const, error: "Invalid account email." };

    const existing = await getTelegramLinkStatusForEmail(getSupabase(), email);
    if (existing.linked) {
      return { success: true as const, linked: true, chatId: existing.chatId };
    }

    const config = await getTelegramConfig();
    if (!config.botToken) {
      return { success: false as const, error: "Telegram bot is not configured." };
    }

    const response = await fetch(
      `https://api.telegram.org/bot${config.botToken}/getUpdates?limit=50&allowed_updates=${encodeURIComponent(
        JSON.stringify(["message", "edited_message"])
      )}`
    );
    const payload = await response.json();
    if (!response.ok || !payload.ok) {
      return {
        success: false as const,
        error: payload.description || "Could not sync Telegram connection.",
      };
    }

    const linkedResults = await processTelegramConnectUpdates(getSupabase(), payload.result || []);
    const matched = linkedResults.find((row) => row.linked && row.email === email);
    if (matched?.linked) {
      return { success: true as const, linked: true, chatId: matched.chatId };
    }

    const status = await getTelegramLinkStatusForEmail(getSupabase(), email);
    return { success: true as const, linked: status.linked, chatId: status.chatId };
  } catch (err: unknown) {
    return {
      success: false as const,
      error: err instanceof Error ? err.message : "Telegram sync failed.",
    };
  }
}

export async function registerTelegramBotWebhook(botTokenOverride?: string) {
  const config = await getTelegramConfig();
  const botToken = botTokenOverride?.trim() || config.botToken;
  if (!botToken) return { success: false as const, error: "Bot token missing." };

  const webhookUrl = `${APP_BASE_URL}/api/telegram/webhook`;
  const secret = buildTelegramWebhookSecret(botToken);

  try {
    const params = new URLSearchParams({
      url: webhookUrl,
      secret_token: secret,
      allowed_updates: JSON.stringify(["message", "edited_message"]),
    });

    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/setWebhook?${params.toString()}`
    );
    const result = await response.json();
    if (!response.ok || !result.ok) {
      return { success: false as const, error: result.description || "Webhook registration failed." };
    }

    return { success: true as const, webhookUrl, usesCustomSecret: Boolean(readTelegramWebhookSecret()) };
  } catch (err: unknown) {
    return {
      success: false as const,
      error: err instanceof Error ? err.message : "Webhook registration failed.",
    };
  }
}
