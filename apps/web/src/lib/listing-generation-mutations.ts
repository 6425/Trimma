import type { SupabaseClient } from "@supabase/supabase-js";
import { getAdminActorEmail } from "@/lib/server-admin-auth";
import { isMissingDbSchemaError } from "@/lib/with-admin-db";
import { fetchAllByIdCursor } from "@/lib/supabase-fetch-all";
import {
  BOOKING_ONBOARDING_ENTRY_STATUS,
  LISTING_ONBOARDING_STATUS,
  LISTING_PUBLISH_SALON_UPDATES,
  isListingPipelineSalon,
} from "@/lib/salon-listing-pipeline";
import { resolveOnboardingAgentForSalon } from "@/lib/salon-onboarding-paths";

async function tryInsertOnboardingLog(
  supabase: SupabaseClient,
  input: { salon_id: string; action: string; notes: string }
): Promise<void> {
  try {
    const actorEmail = await getAdminActorEmail();
    const { error } = await supabase.from("onboarding_logs").insert({
      salon_id: input.salon_id,
      actor_email: actorEmail,
      action: input.action,
      notes: input.notes,
    });
    if (error) {
      console.warn("[listing-generation] onboarding log insert skipped:", error.message);
    }
  } catch (logError) {
    console.warn("[listing-generation] onboarding log insert failed:", logError);
  }
}

async function updateSalonWithOptionalColumns(
  supabase: SupabaseClient,
  salonId: string,
  updates: Record<string, unknown>
): Promise<void> {
  let result = await supabase.from("salons").update(updates).eq("id", salonId);
  if (result.error && isMissingDbSchemaError(result.error.message)) {
    const fallback = { ...updates };
    delete fallback.booking_enabled;
    result = await supabase.from("salons").update(fallback).eq("id", salonId);
  }
  if (result.error) throw new Error(result.error.message);
}

export async function publishListingSalonRecord(
  supabase: SupabaseClient,
  salonId: string
): Promise<void> {
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

  await updateSalonWithOptionalColumns(supabase, salonId, {
    ...LISTING_PUBLISH_SALON_UPDATES,
  });

  await tryInsertOnboardingLog(supabase, {
    salon_id: salonId,
    action: "LISTING_PUBLISHED",
    notes: `Published to marketplace (${salon.category || "Uncategorized"} · ${salon.city || salon.district || "Sri Lanka"}). Booking remains off until booking onboarding starts.`,
  });
}

export async function publishAllPendingListingSalonRecords(
  supabase: SupabaseClient
): Promise<{ publishedCount: number }> {
  const pending = await fetchAllByIdCursor(async (afterId, pageSize) => {
    let query = supabase
      .from("salons")
      .select("id")
      .eq("onboarding_status", LISTING_ONBOARDING_STATUS.CAPTURED)
      .eq("source_type", "LISTING_GENERATION")
      .order("id", { ascending: true })
      .limit(pageSize);
    if (afterId) query = query.gt("id", afterId);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data || [];
  });

  const ids = pending.map((row) => String(row.id)).filter(Boolean);
  if (ids.length === 0) return { publishedCount: 0 };

  const updates = { ...LISTING_PUBLISH_SALON_UPDATES };
  for (let i = 0; i < ids.length; i += 100) {
    const chunk = ids.slice(i, i + 100);
    let result = await supabase
      .from("salons")
      .update(updates)
      .in("id", chunk)
      .eq("onboarding_status", LISTING_ONBOARDING_STATUS.CAPTURED)
      .eq("source_type", "LISTING_GENERATION");
    if (result.error && isMissingDbSchemaError(result.error.message)) {
      const fallback = { ...updates };
      delete fallback.booking_enabled;
      result = await supabase
        .from("salons")
        .update(fallback)
        .in("id", chunk)
        .eq("onboarding_status", LISTING_ONBOARDING_STATUS.CAPTURED)
        .eq("source_type", "LISTING_GENERATION");
    }
    if (result.error) throw new Error(result.error.message);
  }

  await tryInsertOnboardingLog(supabase, {
    salon_id: ids[0],
    action: "LISTING_PUBLISHED_ALL",
    notes: `Bulk published ${ids.length} pending listing generation salon(s) to the marketplace. Booking remains off until booking onboarding starts.`,
  });

  return { publishedCount: ids.length };
}

export async function unpublishListingSalonRecord(
  supabase: SupabaseClient,
  salonId: string
): Promise<void> {
  const { error } = await supabase
    .from("salons")
    .update({
      onboarding_status: LISTING_ONBOARDING_STATUS.CAPTURED,
      public_visibility: "hidden",
    })
    .eq("id", salonId)
    .eq("source_type", "LISTING_GENERATION");

  if (error) throw new Error(error.message);

  await tryInsertOnboardingLog(supabase, {
    salon_id: salonId,
    action: "LISTING_UNPUBLISHED",
    notes: "Removed from public marketplace listing; data retained in listing queue.",
  });
}

export async function startBookingOnboardingFromListingRecord(
  supabase: SupabaseClient,
  input: {
    salonId: string;
    assignAgent?: boolean;
    salonRequestId?: string | null;
    ownerEmail?: string | null;
  }
): Promise<{ assignedAgent: boolean }> {
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

  let assignedAgent = false;
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
      assignedAgent = true;
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

  await tryInsertOnboardingLog(supabase, {
    salon_id: salon.id,
    action: "BOOKING_ONBOARDING_STARTED",
    notes: input.salonRequestId
      ? "Booking onboarding started from salon request — merged into shared verification pipeline."
      : "Booking onboarding started from listing generation queue.",
  });

  return { assignedAgent };
}
