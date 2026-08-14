"use server";

import { revalidatePath } from "next/cache";
import { adminDbFailure, isAdminDbSuccess, withAdminDb } from "@/lib/with-admin-db";
import { requirePlatformAdminFromCookies } from "@/lib/server-admin-auth";
import {
  BOOKING_ONBOARDING_ENTRY_STATUS,
  LISTING_CAPTURE_SALON_DEFAULTS,
  LISTING_ONBOARDING_STATUS,
  LISTING_PUBLISH_SALON_UPDATES,
  isListingPipelineSalon,
} from "@/lib/salon-listing-pipeline";
import { resolveOnboardingAgentForSalon } from "@/lib/salon-onboarding-paths";
import { notifyAgentOfSalonAssignment } from "@/app/actions/salon-onboarding-notifications";
import { insertOnboardingLog } from "@/app/actions/admin-operations";
import {
  loadListingGenerationQueueRows,
  type ListingQueueRow,
} from "@/lib/listing-generation-queue";

export type { ListingQueueRow };

export async function fetchListingGenerationQueue() {
  const result = await withAdminDb(async (supabase) => loadListingGenerationQueueRows(supabase));

  if (!isAdminDbSuccess(result)) return adminDbFailure(result);
  return { success: true as const, rows: result.data };
}

export async function publishListingSalon(salonId: string) {
  const auth = await requirePlatformAdminFromCookies();
  if ("error" in auth) return { success: false as const, error: auth.error };

  const result = await withAdminDb(async (supabase) => {
    const { data: salon, error: fetchError } = await supabase
      .from("salons")
      .select("id, name, source_type, onboarding_status, category, city, district")
      .eq("id", salonId)
      .maybeSingle();

    if (fetchError) throw new Error(fetchError.message);
    if (!salon?.id) throw new Error("Salon not found.");
    if (!isListingPipelineSalon(salon)) {
      throw new Error("This salon is not in the listing generation pipeline.");
    }

    const { error } = await supabase
      .from("salons")
      .update({
        ...LISTING_PUBLISH_SALON_UPDATES,
      })
      .eq("id", salonId);

    if (error) throw new Error(error.message);

    await insertOnboardingLog({
      salon_id: salonId,
      action: "LISTING_PUBLISHED",
      notes: `Published to marketplace (${salon.category || "Uncategorized"} · ${salon.city || salon.district || "Sri Lanka"}). Booking remains off until booking onboarding starts.`,
    });
  });

  if (!isAdminDbSuccess(result)) return adminDbFailure(result);
  revalidatePath("/admin/listing-generation/queue");
  revalidatePath("/");
  return { success: true as const };
}

export async function unpublishListingSalon(salonId: string) {
  const auth = await requirePlatformAdminFromCookies();
  if ("error" in auth) return { success: false as const, error: auth.error };

  const result = await withAdminDb(async (supabase) => {
    const { error } = await supabase
      .from("salons")
      .update({
        onboarding_status: LISTING_ONBOARDING_STATUS.CAPTURED,
        public_visibility: "hidden",
      })
      .eq("id", salonId)
      .eq("source_type", "LISTING_GENERATION");

    if (error) throw new Error(error.message);

    await insertOnboardingLog({
      salon_id: salonId,
      action: "LISTING_UNPUBLISHED",
      notes: "Removed from public marketplace listing; data retained in listing queue.",
    });
  });

  if (!isAdminDbSuccess(result)) return adminDbFailure(result);
  revalidatePath("/admin/listing-generation/queue");
  revalidatePath("/");
  return { success: true as const };
}

/**
 * Convergence point: listing pipeline or salon request → shared booking onboarding.
 * Optionally assigns a territory agent (same as agent pipeline from this step onward).
 */
export async function startBookingOnboardingFromListing(input: {
  salonId: string;
  assignAgent?: boolean;
  salonRequestId?: string | null;
  ownerEmail?: string | null;
}) {
  const auth = await requirePlatformAdminFromCookies();
  if ("error" in auth) return { success: false as const, error: auth.error };

  const result = await withAdminDb(async (supabase) => {
    const { data: salon, error: fetchError } = await supabase
      .from("salons")
      .select("id, name, district, city, address, owner_email, owner_gmail, assign_to")
      .eq("id", input.salonId)
      .maybeSingle();

    if (fetchError) throw new Error(fetchError.message);
    if (!salon?.id) throw new Error("Salon not found.");

    const updates: Record<string, unknown> = {
      onboarding_status: BOOKING_ONBOARDING_ENTRY_STATUS,
      owner_invited_at: new Date().toISOString(),
    };

    if (input.ownerEmail?.trim()) {
      updates.owner_email = input.ownerEmail.trim();
    }

    if (input.assignAgent !== false) {
      const agentEmail =
        salon.assign_to ||
        (await resolveOnboardingAgentForSalon(supabase, {
          district: salon.district,
          city: salon.city,
          address: salon.address,
        }));
      if (agentEmail) {
        updates.assign_to = agentEmail;
        updates.onboarding_status = "ASSIGNED_TO_AGENT";
      }
    }

    const { error: updateError } = await supabase.from("salons").update(updates).eq("id", salon.id);
    if (updateError) throw new Error(updateError.message);

    if (input.salonRequestId) {
      await supabase
        .from("salon_requests")
        .update({
          salon_id: salon.id,
          status: "reviewing",
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", input.salonRequestId);
    }

    if (updates.onboarding_status === "ASSIGNED_TO_AGENT" && updates.assign_to) {
      await notifyAgentOfSalonAssignment(String(salon.id));
    }

    await insertOnboardingLog({
      salon_id: salon.id,
      action: "BOOKING_ONBOARDING_STARTED",
      notes: input.salonRequestId
        ? "Booking onboarding started from salon request — merged into shared verification pipeline."
        : "Booking onboarding started from listing generation queue.",
    });
  });

  if (!isAdminDbSuccess(result)) return adminDbFailure(result);
  revalidatePath("/admin/listing-generation/queue");
  revalidatePath("/admin/leads");
  return { success: true as const };
}

/** Link a salon request to an existing captured/published listing and start booking onboarding. */
export async function connectSalonRequestToListing(input: {
  salonRequestId: string;
  salonId: string;
  assignAgent?: boolean;
}) {
  const auth = await requirePlatformAdminFromCookies();
  if ("error" in auth) return { success: false as const, error: auth.error };

  const result = await withAdminDb(async (supabase) => {
    const { data: request, error: reqError } = await supabase
      .from("salon_requests")
      .select("id, email, business_name")
      .eq("id", input.salonRequestId)
      .maybeSingle();

    if (reqError) throw new Error(reqError.message);
    if (!request?.id) throw new Error("Salon request not found.");

    await supabase
      .from("salon_requests")
      .update({
        salon_id: input.salonId,
        admin_notes: `listing_salon:${input.salonId}`,
      })
      .eq("id", input.salonRequestId);
  });

  if (!isAdminDbSuccess(result)) return adminDbFailure(result);

  return startBookingOnboardingFromListing({
    salonId: input.salonId,
    salonRequestId: input.salonRequestId,
    assignAgent: input.assignAgent,
    ownerEmail: undefined,
  });
}

export { LISTING_CAPTURE_SALON_DEFAULTS };
