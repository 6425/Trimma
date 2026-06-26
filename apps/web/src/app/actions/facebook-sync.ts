"use server";

import {
  syncFacebookPromotionChange,
  syncFacebookServiceChange,
} from "@/lib/facebook-sync-engine";
import { isSalonDbSuccess, salonDbFailure, withSalonDb } from "@/lib/with-salon-db";

export type FacebookSyncLogRow = {
  id: string;
  entityType: string;
  entityId: string | null;
  action: string;
  status: string;
  facebookPostId: string | null;
  errorMessage: string | null;
  createdAt: string;
  syncedAt: string | null;
  captionPreview: string | null;
};

export async function getFacebookSyncHistory(limit = 15) {
  const result = await withSalonDb(async (supabase, ctx) => {
    const { data, error } = await supabase
      .from("facebook_sync_posts")
      .select(
        "id, entity_type, entity_id, action, status, facebook_post_id, error_message, created_at, synced_at, caption"
      )
      .eq("salon_id", ctx.salonId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      if (error.message.toLowerCase().includes("facebook_sync_posts")) {
        return { rows: [] as FacebookSyncLogRow[] };
      }
      throw new Error(error.message);
    }

    const rows: FacebookSyncLogRow[] = (data || []).map((row) => ({
      id: String(row.id),
      entityType: String(row.entity_type),
      entityId: row.entity_id ? String(row.entity_id) : null,
      action: String(row.action),
      status: String(row.status),
      facebookPostId: row.facebook_post_id ? String(row.facebook_post_id) : null,
      errorMessage: row.error_message ? String(row.error_message) : null,
      createdAt: String(row.created_at),
      syncedAt: row.synced_at ? String(row.synced_at) : null,
      captionPreview: row.caption ? String(row.caption).slice(0, 120) : null,
    }));

    return { rows };
  });

  if (!isSalonDbSuccess(result)) return salonDbFailure(result);
  return { success: true as const, rows: result.data.rows };
}

export async function syncAllActiveCatalogToFacebook() {
  const result = await withSalonDb(async (supabase, ctx) => {
    const { data: services, error: servicesError } = await supabase
      .from("services")
      .select("id")
      .eq("salon_id", ctx.salonId)
      .eq("status", "active");
    if (servicesError) throw new Error(servicesError.message);

    const { data: packages, error: packagesError } = await supabase
      .from("salon_promotion_packages")
      .select("id")
      .eq("salon_id", ctx.salonId)
      .eq("status", "active");
    if (packagesError) throw new Error(packagesError.message);

    let published = 0;
    let failed = 0;
    let skipped = 0;

    for (const service of services || []) {
      const syncResult = await syncFacebookServiceChange(ctx.salonId, String(service.id), "updated");
      if (syncResult.status === "success") published += 1;
      else if (syncResult.status === "failed") failed += 1;
      else skipped += 1;
    }

    for (const pkg of packages || []) {
      const syncResult = await syncFacebookPromotionChange(ctx.salonId, String(pkg.id), "updated");
      if (syncResult.status === "success") published += 1;
      else if (syncResult.status === "failed") failed += 1;
      else skipped += 1;
    }

    return { published, failed, skipped };
  });

  if (!isSalonDbSuccess(result)) return salonDbFailure(result);
  return { success: true as const, ...result.data };
}
