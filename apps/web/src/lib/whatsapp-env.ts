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

  const phoneId = envPhoneId || dbPhone;
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
