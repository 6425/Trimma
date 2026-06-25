import { APP_BASE_URL } from "@/lib/email/config";

export const FACEBOOK_GRAPH_VERSION = "v19.0";

export const FACEBOOK_PAGE_SCOPES = [
  "pages_show_list",
  "pages_read_engagement",
  "pages_manage_posts",
] as const;

type GraphError = {
  message?: string;
  type?: string;
  code?: number;
};

type GraphPayload = {
  error?: GraphError;
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  data?: unknown;
  id?: string;
};

export type FacebookAppConfig = {
  appId: string;
  appSecret: string;
  redirectUri: string;
};

export type FacebookPageAccount = {
  id: string;
  name: string;
  access_token: string;
  category?: string;
};

export function getFacebookAppConfig(): FacebookAppConfig | null {
  const appId =
    process.env.FACEBOOK_APP_ID?.trim() ||
    process.env.META_APP_ID?.trim() ||
    process.env.FB_APP_ID?.trim() ||
    "";
  const appSecret =
    process.env.FACEBOOK_APP_SECRET?.trim() ||
    process.env.META_APP_SECRET?.trim() ||
    process.env.FB_APP_SECRET?.trim() ||
    "";
  const redirectUri =
    process.env.FACEBOOK_REDIRECT_URI?.trim() ||
    `${APP_BASE_URL}/api/facebook/callback`;

  if (!appId || !appSecret) return null;

  return { appId, appSecret, redirectUri };
}

export function requireFacebookAppConfig(): FacebookAppConfig {
  const config = getFacebookAppConfig();
  if (!config) {
    throw new Error(
      "Facebook app credentials are missing. Set FACEBOOK_APP_ID and FACEBOOK_APP_SECRET in apps/web/.env."
    );
  }
  return config;
}

function graphBaseUrl(path: string): string {
  return `https://graph.facebook.com/${FACEBOOK_GRAPH_VERSION}/${path}`;
}

function readGraphError(payload: GraphPayload, fallback: string): string {
  return payload.error?.message || fallback;
}

export function buildFacebookOAuthUrl(state: string): string {
  const { appId, redirectUri } = requireFacebookAppConfig();
  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    state,
    scope: FACEBOOK_PAGE_SCOPES.join(","),
    response_type: "code",
  });
  return `https://www.facebook.com/${FACEBOOK_GRAPH_VERSION}/dialog/oauth?${params.toString()}`;
}

export async function exchangeFacebookCodeForUserToken(code: string): Promise<
  | { success: true; accessToken: string; expiresIn?: number }
  | { success: false; error: string }
> {
  const { appId, appSecret, redirectUri } = requireFacebookAppConfig();
  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    client_secret: appSecret,
    code,
  });

  const response = await fetch(`${graphBaseUrl("oauth/access_token")}?${params.toString()}`, {
    cache: "no-store",
  });
  const payload = (await response.json()) as GraphPayload;

  if (!response.ok || payload.error || !payload.access_token) {
    return {
      success: false,
      error: readGraphError(payload, "Could not exchange Facebook authorization code."),
    };
  }

  return {
    success: true,
    accessToken: payload.access_token,
    expiresIn: payload.expires_in,
  };
}

export async function exchangeFacebookLongLivedUserToken(shortLivedToken: string): Promise<
  | { success: true; accessToken: string; expiresIn?: number }
  | { success: false; error: string }
> {
  const { appId, appSecret } = requireFacebookAppConfig();
  const params = new URLSearchParams({
    grant_type: "fb_exchange_token",
    client_id: appId,
    client_secret: appSecret,
    fb_exchange_token: shortLivedToken,
  });

  const response = await fetch(`${graphBaseUrl("oauth/access_token")}?${params.toString()}`, {
    cache: "no-store",
  });
  const payload = (await response.json()) as GraphPayload;

  if (!response.ok || payload.error || !payload.access_token) {
    return {
      success: false,
      error: readGraphError(payload, "Could not exchange Facebook user token for a long-lived token."),
    };
  }

  return {
    success: true,
    accessToken: payload.access_token,
    expiresIn: payload.expires_in,
  };
}

export const FACEBOOK_ME_ACCOUNTS_URL =
  process.env.FACEBOOK_ME_ACCOUNTS_URL?.trim() ||
  `https://graph.facebook.com/${FACEBOOK_GRAPH_VERSION}/me/accounts`;

function buildFacebookMeAccountsUrl(userAccessToken: string, withFields: boolean): string {
  const params = new URLSearchParams({
    access_token: userAccessToken,
  });
  if (withFields) {
    params.set("fields", "id,name,access_token,category");
  }
  return `${FACEBOOK_ME_ACCOUNTS_URL}?${params.toString()}`;
}

type MeAccountsPayload = GraphPayload & {
  data?: Array<{
    id?: string;
    name?: string;
    access_token?: string;
    category?: string;
  }>;
};

function parseFacebookManagedPages(payload: MeAccountsPayload): FacebookPageAccount[] | null {
  if (!Array.isArray(payload.data)) return null;

  return payload.data
    .filter((page) => Boolean(page.id && page.access_token && page.name))
    .map((page) => ({
      id: String(page.id),
      name: String(page.name),
      access_token: String(page.access_token),
      category: page.category ? String(page.category) : undefined,
    }));
}

async function requestFacebookManagedPages(url: string): Promise<
  | { success: true; payload: MeAccountsPayload }
  | { success: false; error: string }
> {
  const response = await fetch(url, { cache: "no-store" });
  const payload = (await response.json()) as MeAccountsPayload;

  if (!response.ok || payload.error) {
    return {
      success: false,
      error: readGraphError(payload, "Could not load Facebook Pages for this account."),
    };
  }

  return { success: true, payload };
}

export async function fetchFacebookManagedPages(userAccessToken: string): Promise<
  | { success: true; pages: FacebookPageAccount[] }
  | { success: false; error: string }
> {
  const trimmedToken = userAccessToken.trim();
  if (!trimmedToken) {
    return { success: false, error: "Facebook user access token is missing." };
  }

  // Meta-documented URL: https://graph.facebook.com/v19.0/me/accounts?access_token={USER_TOKEN}
  const metaUrl = buildFacebookMeAccountsUrl(trimmedToken, false);
  const metaResult = await requestFacebookManagedPages(metaUrl);
  if (metaResult.success === true) {
    const pages = parseFacebookManagedPages(metaResult.payload);
    if (pages) {
      return { success: true, pages };
    }
  }

  // Fallback: same endpoint with explicit fields when the bare Meta URL returns an unexpected shape.
  const fieldsUrl = buildFacebookMeAccountsUrl(trimmedToken, true);
  const fieldsResult = await requestFacebookManagedPages(fieldsUrl);
  if (fieldsResult.success === false) {
    return {
      success: false,
      error: metaResult.success === false ? metaResult.error : fieldsResult.error,
    };
  }

  const pages = parseFacebookManagedPages(fieldsResult.payload);
  if (!pages) {
    return {
      success: false,
      error:
        "Facebook Pages response was missing a data array. Confirm pages_show_list scope is granted.",
    };
  }

  return { success: true, pages };
}

export async function publishFacebookPageFeedPost(input: {
  pageId: string;
  pageAccessToken: string;
  message: string;
  scheduledPublishTime?: number;
}): Promise<
  | { success: true; postId: string }
  | { success: false; error: string }
> {
  const body = new URLSearchParams({
    message: input.message,
    access_token: input.pageAccessToken,
  });

  if (input.scheduledPublishTime != null) {
    body.set("published", "false");
    body.set("scheduled_publish_time", String(input.scheduledPublishTime));
  }

  const response = await fetch(graphBaseUrl(`${input.pageId}/feed`), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });
  const payload = (await response.json()) as GraphPayload;

  if (!response.ok || payload.error || !payload.id) {
    return {
      success: false,
      error: readGraphError(payload, "Facebook could not publish this post."),
    };
  }

  return { success: true, postId: String(payload.id) };
}
