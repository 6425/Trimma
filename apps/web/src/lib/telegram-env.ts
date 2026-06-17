import { cleanEnvValue } from "@/lib/supabase-server-env";

export const TELEGRAM_ENV_BOT_TOKEN_KEYS = [
  "TELEGRAM_BOT_TOKEN",
  "TRIMMA_TELEGRAM_BOT_TOKEN",
] as const;

export const TELEGRAM_ENV_API_ID_KEYS = ["TELEGRAM_API_ID", "TRIMMA_TELEGRAM_API_ID"] as const;

export const TELEGRAM_ENV_API_HASH_KEYS = [
  "TELEGRAM_API_HASH",
  "TRIMMA_TELEGRAM_API_HASH",
] as const;

export function readTelegramEnvBotToken(): string {
  for (const name of TELEGRAM_ENV_BOT_TOKEN_KEYS) {
    const value = cleanEnvValue(process.env[name]);
    if (value) return value;
  }
  return "";
}

export function readTelegramEnvApiId(): string {
  for (const name of TELEGRAM_ENV_API_ID_KEYS) {
    const value = cleanEnvValue(process.env[name]);
    if (value) return value;
  }
  return "";
}

export function readTelegramEnvApiHash(): string {
  for (const name of TELEGRAM_ENV_API_HASH_KEYS) {
    const value = cleanEnvValue(process.env[name]);
    if (value) return value;
  }
  return "";
}

export function resolveEffectiveTelegramCredentials(
  dbApiId: string,
  dbApiHash: string,
  dbBotToken: string
) {
  const envBotToken = readTelegramEnvBotToken();
  const envApiId = readTelegramEnvApiId();
  const envApiHash = readTelegramEnvApiHash();

  const botToken = envBotToken || (dbBotToken || "").trim();
  const apiId = envApiId || (dbApiId || "").trim();
  const apiHash = envApiHash || (dbApiHash || "").trim();
  const tokenFromEnv = Boolean(envBotToken);
  const apiIdFromEnv = Boolean(envApiId);
  const apiHashFromEnv = Boolean(envApiHash);
  const source =
    tokenFromEnv || apiIdFromEnv || apiHashFromEnv
      ? "vercel"
      : botToken || apiId || apiHash
        ? "database"
        : "none";

  return {
    botToken,
    apiId,
    apiHash,
    source,
    tokenFromEnv,
    apiIdFromEnv,
    apiHashFromEnv,
    databaseBotToken: (dbBotToken || "").trim(),
    databaseApiId: (dbApiId || "").trim(),
    databaseApiHash: (dbApiHash || "").trim(),
  };
}
