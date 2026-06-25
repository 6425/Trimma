"use server";

import { createSupabaseAdminClient } from "@/config/supabase-admin";
import {
  buildFacebookOAuthUrl,
  exchangeFacebookCodeForUserToken,
  exchangeFacebookLongLivedUserToken,
  fetchFacebookManagedPages,
  getFacebookAppConfig,
  publishFacebookPageFeedPost,
} from "@/lib/facebook-graph";
import { createFacebookOAuthState } from "@/lib/facebook-oauth-state";
import {
  getSalonFacebookIntegration,
  resolveSalonBookingUrl,
  upsertSalonFacebookIntegration,
} from "@/lib/salon-facebook-integration";
import {
  isSalonDbSuccess,
  salonDbFailure,
  withSalonDb,
} from "@/lib/with-salon-db";

function normalizeFacebookPageUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export async function getFacebookConnectStatus() {
  const result = await withSalonDb(async (supabase, ctx) => {
    const integration = await getSalonFacebookIntegration(supabase, ctx.salon);
    const config = getFacebookAppConfig();
    const pendingPages = (integration.pending_pages || []).map((page) => ({
      id: page.id,
      name: page.name,
      category: page.category || null,
    }));

    const ext =
      ctx.salon.business_info_extended &&
      typeof ctx.salon.business_info_extended === "object" &&
      !Array.isArray(ctx.salon.business_info_extended)
        ? (ctx.salon.business_info_extended as Record<string, unknown>)
        : {};

    return {
      configured: Boolean(config),
      connected: integration.facebook_connected === true && Boolean(integration.facebook_page_id),
      pageId: integration.facebook_page_id,
      pageName: integration.facebook_page_name,
      pageUrl: integration.facebook_page_url || (typeof ext.facebook_url === "string" ? ext.facebook_url : null),
      connectedAt: integration.facebook_connected_at,
      needsPageSelection: pendingPages.length > 0 && !integration.facebook_page_id,
      pendingPages,
      bookingCtaEnabled: integration.booking_cta_enabled,
      bookingCtaLabel: integration.booking_cta_label,
      autoPublishPromos: integration.auto_publish_promos,
      salonBookingUrl: resolveSalonBookingUrl(ctx.salon),
      scopes: ["pages_show_list", "pages_read_engagement", "pages_manage_posts"],
    };
  });

  if (!isSalonDbSuccess(result)) return salonDbFailure(result);
  return { success: true as const, ...result.data };
}

export async function saveFacebookIntegrationSettings(input: {
  facebookPageUrl?: string;
  bookingCtaEnabled?: boolean;
  bookingCtaLabel?: string;
  autoPublishPromos?: boolean;
}) {
  const result = await withSalonDb(async (supabase, ctx) => {
    const pageUrl = input.facebookPageUrl != null ? normalizeFacebookPageUrl(input.facebookPageUrl) : undefined;
    const bookingCtaLabel = input.bookingCtaLabel?.trim();

    if (pageUrl && !/^https?:\/\//i.test(pageUrl)) {
      throw new Error("Facebook Page URL must be a valid http(s) link.");
    }

    await upsertSalonFacebookIntegration(supabase, ctx.salonId, {
      facebook_page_url: pageUrl ?? undefined,
      booking_cta_enabled: input.bookingCtaEnabled,
      booking_cta_label: bookingCtaLabel || undefined,
      auto_publish_promos: input.autoPublishPromos,
    });

    if (pageUrl) {
      const ext =
        ctx.salon.business_info_extended &&
        typeof ctx.salon.business_info_extended === "object" &&
        !Array.isArray(ctx.salon.business_info_extended)
          ? (ctx.salon.business_info_extended as Record<string, unknown>)
          : {};

      await supabase
        .from("salons")
        .update({
          business_info_extended: {
            ...ext,
            facebook_url: pageUrl,
            updated_at: new Date().toISOString(),
            last_updated_by: "Owner",
          },
        })
        .eq("id", ctx.salonId);
    }

    return { saved: true };
  });

  if (!isSalonDbSuccess(result)) return salonDbFailure(result);
  return { success: true as const, ...result.data };
}

export async function createFacebookConnectUrl() {
  const result = await withSalonDb(async (_supabase, ctx) => {
    if (!getFacebookAppConfig()) {
      throw new Error("Facebook integration is not available yet. Trimma platform credentials are being configured.");
    }

    const state = createFacebookOAuthState(ctx.salonId);
    return { url: buildFacebookOAuthUrl(state) };
  });

  if (!isSalonDbSuccess(result)) return salonDbFailure(result);
  return { success: true as const, ...result.data };
}

export async function completeFacebookOAuthCallback(code: string, state: string) {
  const { verifyFacebookOAuthState } = await import("@/lib/facebook-oauth-state");
  const verified = verifyFacebookOAuthState(state);
  if (!verified) {
    return { success: false as const, error: "Invalid or expired Facebook OAuth state." };
  }

  const shortTokenResult = await exchangeFacebookCodeForUserToken(code);
  if (shortTokenResult.success === false) {
    return { success: false as const, error: shortTokenResult.error };
  }

  const longTokenResult = await exchangeFacebookLongLivedUserToken(shortTokenResult.accessToken);
  const userAccessToken =
    longTokenResult.success === true ? longTokenResult.accessToken : shortTokenResult.accessToken;

  const pagesResult = await fetchFacebookManagedPages(userAccessToken);
  if (pagesResult.success === false) {
    return { success: false as const, error: pagesResult.error };
  }

  if (pagesResult.pages.length === 0) {
    return {
      success: false as const,
      error: "No Facebook Pages were returned for this account. Confirm you manage at least one Page.",
    };
  }

  const supabase = createSupabaseAdminClient();

  try {
    if (pagesResult.pages.length === 1) {
      const page = pagesResult.pages[0];
      await upsertSalonFacebookIntegration(supabase, verified.salonId, {
        facebook_connected: true,
        facebook_page_id: page.id,
        facebook_page_name: page.name,
        facebook_page_access_token: page.access_token,
        facebook_user_access_token: userAccessToken,
        pending_pages: [],
        facebook_connected_at: new Date().toISOString(),
      });

      return {
        success: true as const,
        mode: "connected" as const,
        pageId: page.id,
        pageName: page.name,
      };
    }

    await upsertSalonFacebookIntegration(supabase, verified.salonId, {
      facebook_connected: false,
      facebook_page_id: null,
      facebook_page_name: null,
      facebook_page_access_token: null,
      facebook_user_access_token: userAccessToken,
      pending_pages: pagesResult.pages,
      facebook_connected_at: null,
    });

    return {
      success: true as const,
      mode: "select_page" as const,
      pages: pagesResult.pages.map((page) => ({
        id: page.id,
        name: page.name,
        category: page.category || null,
      })),
    };
  } catch (err: unknown) {
    return {
      success: false as const,
      error: err instanceof Error ? err.message : "Could not save Facebook connection.",
    };
  }
}

export async function selectFacebookPage(pageId: string) {
  const result = await withSalonDb(async (supabase, ctx) => {
    const integration = await getSalonFacebookIntegration(supabase, ctx.salon);
    const pending = integration.pending_pages || [];
    const selected = pending.find((page) => page.id === pageId);

    if (!selected) {
      throw new Error("Selected Facebook Page was not found in the pending connection.");
    }

    await upsertSalonFacebookIntegration(supabase, ctx.salonId, {
      facebook_connected: true,
      facebook_page_id: selected.id,
      facebook_page_name: selected.name,
      facebook_page_access_token: selected.access_token,
      pending_pages: [],
      facebook_connected_at: new Date().toISOString(),
    });

    return {
      pageId: selected.id,
      pageName: selected.name,
    };
  });

  if (!isSalonDbSuccess(result)) return salonDbFailure(result);
  return { success: true as const, ...result.data };
}

export async function disconnectFacebookIntegration() {
  const result = await withSalonDb(async (supabase, ctx) => {
    await upsertSalonFacebookIntegration(supabase, ctx.salonId, {
      facebook_connected: false,
      facebook_page_id: null,
      facebook_page_name: null,
      facebook_page_access_token: null,
      facebook_user_access_token: null,
      pending_pages: [],
      facebook_connected_at: null,
    });
    return { disconnected: true };
  });

  if (!isSalonDbSuccess(result)) return salonDbFailure(result);
  return { success: true as const, ...result.data };
}

export async function publishFacebookPagePost(input: {
  message: string;
  scheduledAt?: string;
}) {
  const message = input.message.trim();
  if (!message) {
    return { success: false as const, error: "Post message is required." };
  }

  let scheduledPublishTime: number | undefined;
  if (input.scheduledAt) {
    const parsed = Date.parse(input.scheduledAt);
    if (Number.isNaN(parsed)) {
      return { success: false as const, error: "Scheduled time is invalid." };
    }
    const unix = Math.floor(parsed / 1000);
    const minSchedule = Math.floor(Date.now() / 1000) + 10 * 60;
    const maxSchedule = Math.floor(Date.now() / 1000) + 75 * 24 * 60 * 60;
    if (unix < minSchedule) {
      return {
        success: false as const,
        error: "Scheduled posts must be at least 10 minutes in the future.",
      };
    }
    if (unix > maxSchedule) {
      return {
        success: false as const,
        error: "Scheduled posts must be within the next 75 days.",
      };
    }
    scheduledPublishTime = unix;
  }

  const result = await withSalonDb(async (supabase, ctx) => {
    const integration = await getSalonFacebookIntegration(supabase, ctx.salon);
    const pageId = integration.facebook_page_id;
    const pageAccessToken = integration.facebook_page_access_token;

    if (integration.facebook_connected !== true || !pageId || !pageAccessToken) {
      throw new Error("Connect a Facebook Page before publishing.");
    }

    const publishResult = await publishFacebookPageFeedPost({
      pageId,
      pageAccessToken,
      message,
      scheduledPublishTime,
    });

    if (publishResult.success === false) {
      throw new Error(publishResult.error);
    }

    return {
      postId: publishResult.postId,
      scheduled: scheduledPublishTime != null,
      pageId,
      pageName: integration.facebook_page_name || pageId,
    };
  });

  if (!isSalonDbSuccess(result)) return salonDbFailure(result);
  return { success: true as const, ...result.data };
}
