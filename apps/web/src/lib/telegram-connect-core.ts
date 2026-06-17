import { createHash, randomBytes, timingSafeEqual } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeEmail } from "@/lib/normalize-email";

export const TELEGRAM_CONNECT_PREFIX = "connect_";
const TOKEN_BYTES = 16;
const TOKEN_TTL_MS = 60 * 60 * 1000;

export type TelegramConnectProcessResult =
  | { linked: true; email: string; chatId: string }
  | { linked: false };

export function createTelegramConnectTokenValue(): string {
  return randomBytes(TOKEN_BYTES).toString("hex");
}

export function parseTelegramConnectStartText(text: string | undefined | null): string | null {
  if (!text) return null;
  const trimmed = text.trim();
  const match = trimmed.match(/^\/start\s+connect_([a-f0-9]{32})$/i);
  return match?.[1]?.toLowerCase() || null;
}

export async function purgeExpiredTelegramConnectTokens(supabase: SupabaseClient) {
  await supabase
    .from("telegram_connect_tokens")
    .delete()
    .lt("expires_at", new Date().toISOString());
}

export async function createTelegramConnectToken(
  supabase: SupabaseClient,
  userEmail: string
): Promise<{ token: string; expiresAt: string }> {
  const email = normalizeEmail(userEmail);
  if (!email) throw new Error("A valid account email is required.");

  await purgeExpiredTelegramConnectTokens(supabase);

  const token = createTelegramConnectTokenValue();
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS).toISOString();

  const { error } = await supabase.from("telegram_connect_tokens").insert({
    token,
    user_email: email,
    expires_at: expiresAt,
  });

  if (error) throw new Error(error.message);
  return { token, expiresAt };
}

export async function linkTelegramChatToUser(
  supabase: SupabaseClient,
  userEmail: string,
  chatId: string
) {
  const email = normalizeEmail(userEmail);
  if (!email) throw new Error("Invalid user email.");
  const trimmedChatId = chatId.trim();
  if (!trimmedChatId) throw new Error("Invalid Telegram chat ID.");

  const { error } = await supabase
    .from("users")
    .update({ telegram_chat_id: trimmedChatId })
    .eq("email", email);

  if (!error) return;

  const { error: upsertError } = await supabase.from("users").upsert(
    {
      email,
      telegram_chat_id: trimmedChatId,
      full_name: email.split("@")[0] || "Trimma User",
    },
    { onConflict: "email" }
  );

  if (upsertError) throw new Error(upsertError.message);
}

export async function completeTelegramConnectToken(
  supabase: SupabaseClient,
  token: string,
  chatId: string
): Promise<TelegramConnectProcessResult> {
  const normalizedToken = token.trim().toLowerCase();
  if (!normalizedToken) return { linked: false };

  await purgeExpiredTelegramConnectTokens(supabase);

  const { data: row, error } = await supabase
    .from("telegram_connect_tokens")
    .select("user_email, expires_at")
    .eq("token", normalizedToken)
    .maybeSingle();

  if (error || !row?.user_email) return { linked: false };
  if (new Date(row.expires_at).getTime() < Date.now()) {
    await supabase.from("telegram_connect_tokens").delete().eq("token", normalizedToken);
    return { linked: false };
  }

  const email = normalizeEmail(row.user_email);
  if (!email) return { linked: false };

  await linkTelegramChatToUser(supabase, email, chatId);
  await supabase.from("telegram_connect_tokens").delete().eq("token", normalizedToken);

  return { linked: true, email, chatId };
}

export async function getTelegramLinkStatusForEmail(
  supabase: SupabaseClient,
  userEmail: string
): Promise<{ linked: boolean; chatId: string | null }> {
  const email = normalizeEmail(userEmail);
  if (!email) return { linked: false, chatId: null };

  const { data, error } = await supabase
    .from("users")
    .select("telegram_chat_id")
    .eq("email", email)
    .maybeSingle();

  if (error) {
    const lower = error.message.toLowerCase();
    if (lower.includes("telegram_chat_id") && lower.includes("does not exist")) {
      return { linked: false, chatId: null };
    }
    throw new Error(error.message);
  }

  const chatId = data?.telegram_chat_id?.trim() || null;
  return { linked: Boolean(chatId), chatId };
}

export function buildTelegramDeepLink(botUsername: string, token: string): string {
  const username = botUsername.replace(/^@/, "");
  return `https://t.me/${username}?start=${TELEGRAM_CONNECT_PREFIX}${token}`;
}

export function readTelegramWebhookSecret(): string {
  return (
    process.env.TELEGRAM_WEBHOOK_SECRET?.trim() ||
    process.env.TRIMMA_TELEGRAM_WEBHOOK_SECRET?.trim() ||
    ""
  );
}

export function telegramWebhookSecretsMatch(expected: string, received: string): boolean {
  const expectedBuf = Buffer.from(expected);
  const receivedBuf = Buffer.from(received);
  if (expectedBuf.length !== receivedBuf.length) return false;
  return timingSafeEqual(expectedBuf, receivedBuf);
}

export function buildTelegramWebhookSecret(botToken: string): string {
  const configured = readTelegramWebhookSecret();
  if (configured) return configured;
  return createHash("sha256").update(`trimma-telegram-webhook:${botToken}`).digest("hex").slice(0, 32);
}

export async function processTelegramConnectUpdates(
  supabase: SupabaseClient,
  updates: Array<{
    update_id?: number;
    message?: { text?: string; chat?: { id?: number | string } };
    edited_message?: { text?: string; chat?: { id?: number | string } };
  }>
): Promise<TelegramConnectProcessResult[]> {
  const results: TelegramConnectProcessResult[] = [];

  for (const update of updates) {
    const message = update.message || update.edited_message;
    const token = parseTelegramConnectStartText(message?.text);
    const chatId = message?.chat?.id;
    if (!token || chatId == null) continue;

    const result = await completeTelegramConnectToken(supabase, token, String(chatId));
    if (result.linked) results.push(result);
  }

  return results;
}
