import { cleanEnvValue } from "@/lib/supabase-server-env";
import { APP_BASE_URL } from "@/lib/email/config";
import { getFacebookPlatformCredentialsSync } from "@/lib/facebook-platform-credentials";

/** Meta labels this "App ID" in the developer console. */
export const FACEBOOK_APP_ID_ENV_KEYS = [
  "FACEBOOK_APP_ID",
  "APPID",
  "APP_ID",
  "META_APP_ID",
  "FB_APP_ID",
  "FACEBOOK_APPID",
  "FACEBOOK_CLIENT_ID",
  "CLIENT_ID",
  "NEXT_PUBLIC_FACEBOOK_APP_ID",
] as const;

/** Meta labels this "App Secret" in the developer console. */
export const FACEBOOK_APP_SECRET_ENV_KEYS = [
  "FACEBOOK_APP_SECRET",
  "APP_SECRET",
  "APPSECRET",
  "META_APP_SECRET",
  "FB_APP_SECRET",
  "FACEBOOK_APPSECRET",
  "FACEBOOK_CLIENT_SECRET",
  "CLIENT_SECRET",
] as const;

export const FACEBOOK_REDIRECT_URI_ENV_KEYS = [
  "FACEBOOK_REDIRECT_URI",
  "FACEBOOK_AUTH_CALLBACK_URL",
  "FACEBOOK_CALLBACK_URL",
  "AUTH_CALLBACK_URL",
] as const;

function readFirstEnv(keys: readonly string[]): string {
  for (const name of keys) {
    const value = cleanEnvValue(process.env[name]);
    if (value) return value;
  }
  return "";
}

export function readFacebookAppId(): string {
  const cached = getFacebookPlatformCredentialsSync()?.appId?.trim();
  if (cached) return cached;
  return readFirstEnv(FACEBOOK_APP_ID_ENV_KEYS);
}

export function readFacebookAppSecret(): string {
  const cached = getFacebookPlatformCredentialsSync()?.appSecret?.trim();
  if (cached) return cached;
  return readFirstEnv(FACEBOOK_APP_SECRET_ENV_KEYS);
}

export const FACEBOOK_OAUTH_CALLBACK_PATH = "/facebook/callback/auth";

/** Registered in Meta for beta + live OAuth. */
export const TRIMMA_FACEBOOK_OAUTH_REDIRECTS = [
  "https://beta.trimma.io/facebook/callback/auth",
  "https://www.trimma.io/facebook/callback/auth",
] as const;

function buildRedirectFromOrigin(origin: string): string {
  return `${origin.replace(/\/$/, "")}${FACEBOOK_OAUTH_CALLBACK_PATH}`;
}

export function readFacebookRedirectUri(requestOrigin?: string): string {
  // OAuth must use the same host the user is on (beta vs live), not a fixed admin URI.
  if (requestOrigin) {
    return buildRedirectFromOrigin(requestOrigin);
  }

  const cached = getFacebookPlatformCredentialsSync()?.redirectUri?.trim();
  if (cached) return cached.replace(/\/$/, "");

  const explicit = readFirstEnv(FACEBOOK_REDIRECT_URI_ENV_KEYS);
  if (explicit) return explicit.replace(/\/$/, "");

  const vercelUrl = cleanEnvValue(process.env.VERCEL_URL);
  if (vercelUrl) {
    const protocol = vercelUrl.includes("localhost") ? "http" : "https";
    return buildRedirectFromOrigin(`${protocol}://${vercelUrl.replace(/\/$/, "")}`);
  }

  return buildRedirectFromOrigin(APP_BASE_URL.replace(/\/$/, ""));
}

export function hasFacebookAppCredentials(): boolean {
  return Boolean(readFacebookAppId() && readFacebookAppSecret());
}
