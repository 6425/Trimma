"use server";

import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { FACEBOOK_GRAPH_VERSION } from "@/lib/facebook-graph";
import {
  applyFacebookPlatformCredentialsToProcess,
  clearFacebookPlatformCredentialsCache,
  loadFacebookPlatformCredentials,
  type FacebookPlatformCredentials,
} from "@/lib/facebook-platform-credentials";
import { readFacebookRedirectUri } from "@/lib/facebook-env";
import { requirePlatformAdminFromCookies } from "@/lib/server-admin-auth";
import { syncFacebookCredentialsToEnvFiles } from "@/lib/sync-facebook-env-file";

const SETTINGS_ID = "00000000-0000-0000-0000-000000000001";

export type FacebookPlatformConfig = {
  appId: string;
  appSecret: string;
  redirectUri: string;
  secretConfigured: boolean;
  source: FacebookPlatformCredentials["source"];
};

async function readStoredSecret(): Promise<string> {
  const { data } = await createSupabaseAdminClient()
    .from("global_payment_settings")
    .select("facebook_app_secret")
    .eq("id", SETTINGS_ID)
    .maybeSingle();

  return String(data?.facebook_app_secret || "").trim();
}

export async function getFacebookPlatformConfig(): Promise<FacebookPlatformConfig> {
  const admin = await requirePlatformAdminFromCookies();
  if ("error" in admin) {
    throw new Error(admin.error);
  }

  const creds = await loadFacebookPlatformCredentials(true);
  const storedSecret = await readStoredSecret();

  return {
    appId: creds.appId,
    appSecret: "",
    redirectUri: creds.redirectUri,
    secretConfigured: Boolean(storedSecret || creds.appSecret),
    source: creds.source,
  };
}

export async function validateStoredFacebookPlatformCredentials() {
  const admin = await requirePlatformAdminFromCookies();
  if ("error" in admin) {
    return { valid: false as const, error: admin.error };
  }

  const creds = await loadFacebookPlatformCredentials(true);
  if (!creds.appId || !creds.appSecret) {
    return {
      valid: false as const,
      error: "Facebook App ID and App Secret are not configured yet.",
    };
  }

  return validateFacebookPlatformCredentials(creds.appId, creds.appSecret);
}

export async function validateFacebookPlatformCredentials(
  appId: string,
  appSecret: string
): Promise<{ valid: true; appName?: string } | { valid: false; error: string }> {
  const trimmedId = appId.trim();
  const trimmedSecret = appSecret.trim();

  if (!trimmedId || !trimmedSecret) {
    return { valid: false, error: "Facebook App ID and App Secret are required." };
  }

  try {
    const params = new URLSearchParams({
      client_id: trimmedId,
      client_secret: trimmedSecret,
      grant_type: "client_credentials",
    });

    const tokenResponse = await fetch(
      `https://graph.facebook.com/${FACEBOOK_GRAPH_VERSION}/oauth/access_token?${params.toString()}`,
      { cache: "no-store" }
    );
    const tokenPayload = (await tokenResponse.json()) as {
      access_token?: string;
      error?: { message?: string };
    };

    if (!tokenResponse.ok || !tokenPayload.access_token) {
      return {
        valid: false,
        error: tokenPayload.error?.message || "Meta rejected the App ID or App Secret.",
      };
    }

    const appResponse = await fetch(
      `https://graph.facebook.com/${FACEBOOK_GRAPH_VERSION}/${trimmedId}?fields=name&access_token=${encodeURIComponent(tokenPayload.access_token)}`,
      { cache: "no-store" }
    );
    const appPayload = (await appResponse.json()) as { name?: string; error?: { message?: string } };

    if (!appResponse.ok) {
      return {
        valid: false,
        error: appPayload.error?.message || "Could not verify the Facebook app.",
      };
    }

    return { valid: true, appName: appPayload.name };
  } catch (err) {
    return {
      valid: false,
      error: err instanceof Error ? err.message : "Failed to validate Facebook credentials.",
    };
  }
}

export async function saveFacebookPlatformSettings(input: {
  appId: string;
  appSecret: string;
  redirectUri: string;
}) {
  const admin = await requirePlatformAdminFromCookies();
  if ("error" in admin) {
    return { success: false as const, error: admin.error };
  }

  const appId = input.appId.trim();
  const redirectUri = (input.redirectUri.trim() || readFacebookRedirectUri()).replace(/\/$/, "");
  let appSecret = input.appSecret.trim();

  if (!appId) {
    return { success: false as const, error: "FACEBOOK_APP_ID is required." };
  }

  if (!redirectUri) {
    return { success: false as const, error: "FACEBOOK_REDIRECT_URI is required." };
  }

  if (!appSecret) {
    appSecret = await readStoredSecret();
  }

  if (!appSecret) {
    return {
      success: false as const,
      error: "FACEBOOK_APP_SECRET is required on first save.",
    };
  }

  const validation = await validateFacebookPlatformCredentials(appId, appSecret);
  if (validation.valid === false) {
    return { success: false as const, error: validation.error };
  }

  const { error } = await createSupabaseAdminClient()
    .from("global_payment_settings")
    .upsert({
      id: SETTINGS_ID,
      facebook_app_id: appId,
      facebook_app_secret: appSecret,
      facebook_redirect_uri: redirectUri,
    });

  if (error) {
    return {
      success: false as const,
      error: error.message || "Failed to save Facebook settings to the database.",
    };
  }

  clearFacebookPlatformCredentialsCache();
  const creds: FacebookPlatformCredentials = {
    appId,
    appSecret,
    redirectUri,
    source: "database",
  };
  applyFacebookPlatformCredentialsToProcess(creds);

  const envSync = syncFacebookCredentialsToEnvFiles({ appId, appSecret, redirectUri });

  return {
    success: true as const,
    appName: validation.appName,
    envFileSynced: envSync.synced,
    envFilePaths: envSync.paths,
    envSyncNote: envSync.skippedReason,
  };
}
