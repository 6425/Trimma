import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { APP_BASE_URL } from "@/lib/email/config";
import {
  FACEBOOK_APP_ID_ENV_KEYS,
  FACEBOOK_APP_SECRET_ENV_KEYS,
  FACEBOOK_REDIRECT_URI_ENV_KEYS,
} from "@/lib/facebook-env";
import { cleanEnvValue } from "@/lib/supabase-server-env";

const SETTINGS_ID = "00000000-0000-0000-0000-000000000001";
const CACHE_TTL_MS = 60_000;

export type FacebookPlatformCredentials = {
  appId: string;
  appSecret: string;
  redirectUri: string;
  source: "database" | "env" | "none";
};

let cache: FacebookPlatformCredentials | null = null;
let cacheLoadedAt = 0;

function readEnvFirst(keys: readonly string[]): string {
  for (const name of keys) {
    const value = cleanEnvValue(process.env[name]);
    if (value) return value;
  }
  return "";
}

function readEnvRedirectUri(): string {
  const explicit = readEnvFirst(FACEBOOK_REDIRECT_URI_ENV_KEYS);
  if (explicit) return explicit.replace(/\/$/, "");
  return `${APP_BASE_URL.replace(/\/$/, "")}/facebook/callback/auth`;
}

function resolveCredentials(
  dbAppId: string,
  dbAppSecret: string,
  dbRedirectUri: string
): FacebookPlatformCredentials {
  const envAppId = readEnvFirst(FACEBOOK_APP_ID_ENV_KEYS);
  const envAppSecret = readEnvFirst(FACEBOOK_APP_SECRET_ENV_KEYS);
  const envRedirect = readEnvRedirectUri();

  const appId = dbAppId || envAppId;
  const appSecret = dbAppSecret || envAppSecret;
  const redirectUri = dbRedirectUri || envRedirect;

  const source: FacebookPlatformCredentials["source"] = dbAppId || dbAppSecret
    ? "database"
    : appId || appSecret
      ? "env"
      : "none";

  return { appId, appSecret, redirectUri, source };
}

export function getFacebookPlatformCredentialsSync(): FacebookPlatformCredentials | null {
  if (!cache) return null;
  if (Date.now() - cacheLoadedAt > CACHE_TTL_MS) return null;
  return cache;
}

export function clearFacebookPlatformCredentialsCache() {
  cache = null;
  cacheLoadedAt = 0;
}

export function applyFacebookPlatformCredentialsToProcess(creds: FacebookPlatformCredentials) {
  if (creds.appId) process.env.FACEBOOK_APP_ID = creds.appId;
  if (creds.appSecret) process.env.FACEBOOK_APP_SECRET = creds.appSecret;
  if (creds.redirectUri) process.env.FACEBOOK_REDIRECT_URI = creds.redirectUri;
  cache = creds;
  cacheLoadedAt = Date.now();
}

export async function loadFacebookPlatformCredentials(force = false): Promise<FacebookPlatformCredentials> {
  if (!force && cache && Date.now() - cacheLoadedAt < CACHE_TTL_MS) {
    return cache;
  }

  try {
    const { data, error } = await createSupabaseAdminClient()
      .from("global_payment_settings")
      .select("facebook_app_id, facebook_app_secret, facebook_redirect_uri")
      .eq("id", SETTINGS_ID)
      .maybeSingle();

    if (error) throw error;

    const resolved = resolveCredentials(
      String(data?.facebook_app_id || "").trim(),
      String(data?.facebook_app_secret || "").trim(),
      String(data?.facebook_redirect_uri || "").trim()
    );

    applyFacebookPlatformCredentialsToProcess(resolved);
    return resolved;
  } catch (err) {
    console.warn("Failed to load Facebook platform credentials from DB:", err);
    const fallback = resolveCredentials("", "", "");
    applyFacebookPlatformCredentialsToProcess(fallback);
    return fallback;
  }
}
