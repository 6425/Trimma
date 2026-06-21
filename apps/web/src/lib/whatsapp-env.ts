import { cleanEnvValue } from "@/lib/supabase-server-env";

/** Vercel/local env names for Meta WhatsApp Phone Number ID (App ID). */
export const WHATSAPP_ENV_PHONE_ID_KEYS = [
  "WHATSAPP_PHONE_NUMBER_ID",
  "META_WHATSAPP_PHONE_NUMBER_ID",
  "WHATSAPP_ID",
  "WHATSAPP_APP_ID",
  "WHATSAPP_BUSINESS_ACCOUNT_ID",
] as const;

export const WHATSAPP_ENV_ACCESS_TOKEN_KEYS = [
  "WHATSAPP_ACCESS_TOKEN",
  "META_WHATSAPP_ACCESS_TOKEN",
  "WHATSAPP_TOKEN",
] as const;

export const TRIMMA_WHATSAPP_PHONE_NUMBER_ID = "1130184513519892";

/** Meta Phone Number IDs are numeric; E.164 display numbers must not be used in API paths. */
export function isLikelyWhatsAppDisplayPhone(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("+")) return true;
  if (/[\s\-()]/.test(trimmed)) return true;

  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return false;

  if (digits.length >= 9 && digits.length <= 13) {
    if (digits.startsWith("94") && digits.length === 11) return true;
    if (digits.length === 9 && digits.startsWith("7")) return true;
    if (digits.length === 10 && digits.startsWith("0")) return true;
  }

  return false;
}

export function sanitizeWhatsAppPhoneNumberId(value: string): string {
  const trimmed = (value || "").trim();
  if (!trimmed) return "";
  if (isLikelyWhatsAppDisplayPhone(trimmed)) {
    return TRIMMA_WHATSAPP_PHONE_NUMBER_ID;
  }
  return trimmed;
}

export function whatsAppPhoneNumberIdMisconfigurationMessage(value: string): string {
  return (
    `"${value.trim()}" is your WhatsApp business phone number, not the Meta Phone Number ID. ` +
    `Use ${TRIMMA_WHATSAPP_PHONE_NUMBER_ID} from Meta Developer Console → WhatsApp → API Setup ` +
    `(or update Vercel WHATSAPP_PHONE_NUMBER_ID to that value).`
  );
}

export function readWhatsAppEnvPhoneId(): string {
  for (const name of WHATSAPP_ENV_PHONE_ID_KEYS) {
    const value = cleanEnvValue(process.env[name]);
    if (value) return value;
  }
  return "";
}

export function readWhatsAppEnvAccessToken(): string {
  for (const name of WHATSAPP_ENV_ACCESS_TOKEN_KEYS) {
    const value = cleanEnvValue(process.env[name]);
    if (value) return value;
  }
  return "";
}

export function hasWhatsAppEnvCredentials(): boolean {
  return Boolean(readWhatsAppEnvAccessToken() || readWhatsAppEnvPhoneId());
}

export function resolveEffectiveWhatsAppCredentials(dbPhoneId: string, dbAccessToken: string) {
  const envPhoneId = readWhatsAppEnvPhoneId();
  const envAccessToken = readWhatsAppEnvAccessToken();
  const dbPhone = (dbPhoneId || "").trim();
  const dbToken = (dbAccessToken || "").trim();

  const rawPhoneId = envPhoneId || dbPhone;
  const phoneId = sanitizeWhatsAppPhoneNumberId(rawPhoneId);
  const accessToken = envAccessToken || dbToken;
  const tokenFromEnv = Boolean(envAccessToken);
  const phoneIdFromEnv = Boolean(envPhoneId);
  const source =
    tokenFromEnv || phoneIdFromEnv
      ? "vercel"
      : accessToken || phoneId
        ? "database"
        : "none";

  return {
    phoneId,
    accountId: phoneId,
    accessToken,
    source,
    tokenFromEnv,
    phoneIdFromEnv,
    databaseAccessToken: dbToken,
    databasePhoneId: dbPhone,
  };
}
