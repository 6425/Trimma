import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { publishFacebookPageFeedPost } from "@/lib/facebook-graph";
import { buildFacebookCatalogCaption } from "@/lib/facebook-caption";
import {
  getSalonFacebookIntegration,
  resolveSalonBookingUrl,
} from "@/lib/salon-facebook-integration";

export type FacebookSyncAction = "created" | "updated" | "deleted";
export type FacebookSyncEntityType = "service" | "promotion_package";
export type FacebookSyncStatus = "pending" | "success" | "failed" | "skipped";

export type FacebookSyncResult = {
  status: FacebookSyncStatus;
  facebookPostId?: string;
  error?: string;
  skippedReason?: string;
};

type LogRow = {
  salon_id: string;
  entity_type: FacebookSyncEntityType;
  entity_id: string | null;
  action: FacebookSyncAction;
  status: FacebookSyncStatus;
  caption?: string;
  facebook_post_id?: string;
  error_message?: string;
};

async function writeSyncLog(row: LogRow) {
  try {
    const supabase = createSupabaseAdminClient();
    await supabase.from("facebook_sync_posts").insert({
      salon_id: row.salon_id,
      entity_type: row.entity_type,
      entity_id: row.entity_id,
      action: row.action,
      status: row.status,
      caption: row.caption || null,
      facebook_post_id: row.facebook_post_id || null,
      error_message: row.error_message || null,
      synced_at: row.status === "success" ? new Date().toISOString() : null,
    });
  } catch (err) {
    console.warn("Could not write facebook_sync_posts log:", err);
  }
}

function isMissingSyncTable(message: string): boolean {
  return message.toLowerCase().includes("facebook_sync_posts");
}

async function loadSalon(salonId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("salons")
    .select("id, name, slug")
    .eq("id", salonId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Salon not found.");
  return data as Record<string, unknown>;
}

async function publishCaption(
  salonId: string,
  integration: Awaited<ReturnType<typeof getSalonFacebookIntegration>>,
  caption: string,
  meta: Omit<LogRow, "salon_id" | "status" | "caption" | "facebook_post_id" | "error_message">
): Promise<FacebookSyncResult> {
  const pageId = integration.facebook_page_id;
  const pageToken = integration.facebook_page_access_token;

  if (!pageId || !pageToken) {
    await writeSyncLog({
      ...meta,
      salon_id: salonId,
      status: "skipped",
      caption,
      error_message: "Facebook Page token is missing.",
    });
    return { status: "skipped", skippedReason: "Facebook Page token is missing." };
  }

  const publishResult = await publishFacebookPageFeedPost({
    pageId,
    pageAccessToken: pageToken,
    message: caption,
  });

  if (publishResult.success === false) {
    await writeSyncLog({
      ...meta,
      salon_id: salonId,
      status: "failed",
      caption,
      error_message: publishResult.error,
    });
    return { status: "failed", error: publishResult.error };
  }

  await writeSyncLog({
    ...meta,
    salon_id: salonId,
    status: "success",
    caption,
    facebook_post_id: publishResult.postId,
  });

  return { status: "success", facebookPostId: publishResult.postId };
}

export async function syncFacebookServiceChange(
  salonId: string,
  serviceId: string,
  action: FacebookSyncAction
): Promise<FacebookSyncResult> {
  try {
    const supabase = createSupabaseAdminClient();
    const salon = await loadSalon(salonId);
    const integration = await getSalonFacebookIntegration(supabase, salon);

    if (integration.facebook_connected !== true) {
      return { status: "skipped", skippedReason: "Facebook is not connected." };
    }
    if (integration.auto_publish_services === false) {
      return { status: "skipped", skippedReason: "Auto-publish services is off." };
    }

    if (action !== "deleted") {
      const { data: service, error } = await supabase
        .from("services")
        .select(
          "id, name, description, price, duration_min, category, status, discount_percentage, discount_end_date"
        )
        .eq("id", serviceId)
        .eq("salon_id", salonId)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!service) return { status: "skipped", skippedReason: "Service not found." };
      if (service.status !== "active") {
        return { status: "skipped", skippedReason: "Service is not active." };
      }

      const caption = buildFacebookCatalogCaption({
        kind: "service",
        action,
        salonName: String(salon.name || "Our salon"),
        bookingUrl: resolveSalonBookingUrl(salon),
        service,
      });

      return publishCaption(salonId, integration, caption, {
        entity_type: "service",
        entity_id: serviceId,
        action,
      });
    }

    const { data: service } = await supabase
      .from("services")
      .select("name")
      .eq("id", serviceId)
      .maybeSingle();

    const caption = buildFacebookCatalogCaption({
      kind: "service",
      action: "deleted",
      salonName: String(salon.name || "Our salon"),
      bookingUrl: resolveSalonBookingUrl(salon),
      service: { name: String(service?.name || "Salon service") },
    });

    return publishCaption(salonId, integration, caption, {
      entity_type: "service",
      entity_id: serviceId,
      action: "deleted",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Facebook service sync failed.";
    if (!isMissingSyncTable(message)) {
      await writeSyncLog({
        salon_id: salonId,
        entity_type: "service",
        entity_id: serviceId,
        action,
        status: "failed",
        error_message: message,
      });
    }
    return { status: "failed", error: message };
  }
}

export async function syncFacebookPromotionChange(
  salonId: string,
  packageId: string,
  action: FacebookSyncAction
): Promise<FacebookSyncResult> {
  try {
    const supabase = createSupabaseAdminClient();
    const salon = await loadSalon(salonId);
    const integration = await getSalonFacebookIntegration(supabase, salon);

    if (integration.facebook_connected !== true) {
      return { status: "skipped", skippedReason: "Facebook is not connected." };
    }
    if (integration.auto_publish_promos === false) {
      return { status: "skipped", skippedReason: "Auto-publish promotions is off." };
    }

    if (action !== "deleted") {
      const { data: pkg, error } = await supabase
        .from("salon_promotion_packages")
        .select(
          "id, name, description, package_price, original_price, included_services, start_date, end_date, status, promotion_type"
        )
        .eq("id", packageId)
        .eq("salon_id", salonId)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!pkg) return { status: "skipped", skippedReason: "Promotion package not found." };
      if (pkg.status !== "active") {
        return { status: "skipped", skippedReason: "Promotion package is not active." };
      }

      const included =
        Array.isArray(pkg.included_services)
          ? pkg.included_services.map(String)
          : typeof pkg.included_services === "string"
            ? [pkg.included_services]
            : [];

      const caption = buildFacebookCatalogCaption({
        kind: "promotion_package",
        action,
        salonName: String(salon.name || "Our salon"),
        bookingUrl: resolveSalonBookingUrl(salon),
        pkg: { ...pkg, included_services: included },
      });

      return publishCaption(salonId, integration, caption, {
        entity_type: "promotion_package",
        entity_id: packageId,
        action,
      });
    }

    const { data: pkg } = await supabase
      .from("salon_promotion_packages")
      .select("name")
      .eq("id", packageId)
      .maybeSingle();

    const caption = buildFacebookCatalogCaption({
      kind: "promotion_package",
      action: "deleted",
      salonName: String(salon.name || "Our salon"),
      bookingUrl: resolveSalonBookingUrl(salon),
      pkg: { name: String(pkg?.name || "Promotion package") },
    });

    return publishCaption(salonId, integration, caption, {
      entity_type: "promotion_package",
      entity_id: packageId,
      action: "deleted",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Facebook promotion sync failed.";
    if (!isMissingSyncTable(message)) {
      await writeSyncLog({
        salon_id: salonId,
        entity_type: "promotion_package",
        entity_id: packageId,
        action,
        status: "failed",
        error_message: message,
      });
    }
    return { status: "failed", error: message };
  }
}

/** Non-blocking wrapper — never throws to caller. */
export function queueFacebookServiceSync(
  salonId: string,
  serviceId: string,
  action: FacebookSyncAction
) {
  void syncFacebookServiceChange(salonId, serviceId, action).catch((err) => {
    console.warn("Facebook service sync error:", err);
  });
}

export function queueFacebookPromotionSync(
  salonId: string,
  packageId: string,
  action: FacebookSyncAction
) {
  void syncFacebookPromotionChange(salonId, packageId, action).catch((err) => {
    console.warn("Facebook promotion sync error:", err);
  });
}
