"use server";

import { revalidatePath } from "next/cache";
import { revalidateMarketplaceListingPages } from "@/lib/listing-marketplace-revalidate";
import { adminDbFailure, isAdminDbSuccess, withAdminDb } from "@/lib/with-admin-db";
import { requirePlatformAdminFromCookies } from "@/lib/server-admin-auth";
import {
  LISTING_CAPTURE_SALON_DEFAULTS,
} from "@/lib/salon-listing-pipeline";
import {
  publishListingSalonRecord,
  startBookingOnboardingFromListingRecord,
  unpublishListingSalonRecord,
} from "@/lib/listing-generation-mutations";
import { notifyAgentOfSalonAssignment } from "@/app/actions/salon-onboarding-notifications";
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
    await publishListingSalonRecord(supabase, salonId);
  });

  if (!isAdminDbSuccess(result)) return adminDbFailure(result);
  revalidateMarketplaceListingPages();
  return { success: true as const };
}

export async function unpublishListingSalon(salonId: string) {
  const auth = await requirePlatformAdminFromCookies();
  if ("error" in auth) return { success: false as const, error: auth.error };

  const result = await withAdminDb(async (supabase) => {
    await unpublishListingSalonRecord(supabase, salonId);
  });

  if (!isAdminDbSuccess(result)) return adminDbFailure(result);
  revalidateMarketplaceListingPages();
  return { success: true as const };
}

export async function startBookingOnboardingFromListing(input: {
  salonId: string;
  assignAgent?: boolean;
  salonRequestId?: string | null;
  ownerEmail?: string | null;
}) {
  const auth = await requirePlatformAdminFromCookies();
  if ("error" in auth) return { success: false as const, error: auth.error };

  const result = await withAdminDb(async (supabase) => {
    const { assignedAgent } = await startBookingOnboardingFromListingRecord(supabase, input);
    if (assignedAgent) {
      try {
        await notifyAgentOfSalonAssignment(input.salonId);
      } catch (notifyError) {
        console.warn("[listing-generation] agent notify skipped:", notifyError);
      }
    }
  });

  if (!isAdminDbSuccess(result)) return adminDbFailure(result);
  revalidatePath("/admin/listing-generation/queue");
  revalidatePath("/admin/leads");
  return { success: true as const };
}

export async function connectSalonRequestToListing(input: {
  salonRequestId: string;
  salonId: string;
  assignAgent?: boolean;
}) {
  const auth = await requirePlatformAdminFromCookies();
  if ("error" in auth) return { success: false as const, error: auth.error };

  const linkResult = await withAdminDb(async (supabase) => {
    const { data: request, error: reqError } = await supabase
      .from("salon_requests")
      .select("id, email, business_name")
      .eq("id", input.salonRequestId)
      .maybeSingle();

    if (reqError) throw new Error(reqError.message);
    if (!request?.id) throw new Error("Salon request not found.");

    const { error } = await supabase
      .from("salon_requests")
      .update({
        salon_id: input.salonId,
        admin_notes: `listing_salon:${input.salonId}`,
      })
      .eq("id", input.salonRequestId);

    if (error) throw new Error(error.message);
  });

  if (!isAdminDbSuccess(linkResult)) return adminDbFailure(linkResult);

  return startBookingOnboardingFromListing({
    salonId: input.salonId,
    salonRequestId: input.salonRequestId,
    assignAgent: input.assignAgent,
    ownerEmail: undefined,
  });
}

export { LISTING_CAPTURE_SALON_DEFAULTS };
