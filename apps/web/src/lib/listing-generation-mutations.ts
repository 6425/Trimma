import type { SupabaseClient } from "@supabase/supabase-js";
import { getAdminActorEmail } from "@/lib/server-admin-auth";
import { isMissingDbSchemaError } from "@/lib/with-admin-db";
import { fetchAllByIdCursor } from "@/lib/supabase-fetch-all";
import {
  BOOKING_ONBOARDING_ENTRY_STATUS,
  LISTING_CAPTURE_SALON_DEFAULTS,
  LISTING_ONBOARDING_STATUS,
  LISTING_PUBLISH_SALON_UPDATES,
  isListingPipelineSalon,
} from "@/lib/salon-listing-pipeline";
import { isValidFeaturedPeriod, parseFeaturedDate } from "@/lib/listing-featured";
import { resolveOnboardingAgentForSalon } from "@/lib/salon-onboarding-paths";
import { slugifySalonName } from "@/lib/google-place-profile";
import { SRI_LANKA_PROVINCES } from "@/lib/sri-lanka-locations";

export type ManualListingCaptureInput = {
  name: string;
  category: string;
  province: string;
  district: string;
  city?: string | null;
  address: string;
  phone?: string | null;
  website?: string | null;
  mapUrl?: string | null;
  placeId?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  description?: string | null;
  logoUrl?: string | null;
  heroUrl?: string | null;
};

function cleanManualListingText(value: unknown, maxLength: number): string {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, maxLength);
}

function cleanManualListingLongText(value: unknown, maxLength: number): string {
  return String(value || "").trim().slice(0, maxLength);
}

function cleanManualListingUrl(value: unknown, label: string): string | null {
  const raw = cleanManualListingText(value, 2_000);
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error();
    return url.toString();
  } catch {
    throw new Error(`${label} must be a valid http or https URL.`);
  }
}

function cleanManualCoordinate(
  value: number | null | undefined,
  label: string,
  min: number,
  max: number
): number | null {
  if (value == null) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    throw new Error(`${label} must be between ${min} and ${max}.`);
  }
  return parsed;
}

function validateManualListingLocation(province: string, district: string, city: string): void {
  const provinceRow = SRI_LANKA_PROVINCES.find((item) => item.name === province);
  if (!provinceRow) throw new Error("Select a valid province.");
  const districtRow = provinceRow.districts.find((item) => item.name === district);
  if (!districtRow) throw new Error("Select a district within the chosen province.");
  if (city && !districtRow.cities.includes(city)) {
    throw new Error("Select a city within the chosen district.");
  }
}

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

async function createUniqueManualListingSlug(
  supabase: SupabaseClient,
  businessName: string
): Promise<string> {
  const base = slugifySalonName(businessName) || "manual-listing";
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const suffix = crypto.randomUUID().slice(0, 8);
    const candidate = `${base}-${suffix}`;
    const { data, error } = await supabase
      .from("salons")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data?.id) return candidate;
  }
  throw new Error("Could not generate a unique listing URL. Please try again.");
}

export async function createManualListingSalonRecord(
  supabase: SupabaseClient,
  input: ManualListingCaptureInput
): Promise<{ salonId: string; name: string }> {
  const name = cleanManualListingText(input.name, 200);
  const category = cleanManualListingText(input.category, 120);
  const province = cleanManualListingText(input.province, 120);
  const district = cleanManualListingText(input.district, 120);
  const city = cleanManualListingText(input.city, 120);
  const address = cleanManualListingLongText(input.address, 500);
  const phone = cleanManualListingText(input.phone, 50) || null;
  const placeId = cleanManualListingText(input.placeId, 255) || null;
  const description = cleanManualListingLongText(input.description, 4_000) || null;
  const website = cleanManualListingUrl(input.website, "Website");
  const suppliedMapUrl = cleanManualListingUrl(input.mapUrl, "Google Maps URL");
  const logoUrl = cleanManualListingUrl(input.logoUrl, "Logo URL");
  const heroUrl = cleanManualListingUrl(input.heroUrl, "Hero image URL");
  const latitude = cleanManualCoordinate(input.latitude, "Latitude", -90, 90);
  const longitude = cleanManualCoordinate(input.longitude, "Longitude", -180, 180);

  if (!name) throw new Error("Business name is required.");
  if (!category) throw new Error("Trimma category is required.");
  if (!address) throw new Error("Full address is required.");
  if ((latitude === null) !== (longitude === null)) {
    throw new Error("Enter both latitude and longitude, or leave both empty.");
  }
  validateManualListingLocation(province, district, city);

  if (placeId) {
    const { data: samePlace, error } = await supabase
      .from("salons")
      .select("id, name")
      .eq("place_id", placeId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (samePlace?.id) {
      throw new Error(`This Google Place is already saved as ${samePlace.name || "an existing listing"}.`);
    }
  }

  const { data: nearbyRows, error: nearbyError } = await supabase
    .from("salons")
    .select("id, name, address")
    .eq("district", district)
    .limit(300);
  if (nearbyError) throw new Error(nearbyError.message);

  const normalizedName = name.toLocaleLowerCase();
  const normalizedAddress = address.toLocaleLowerCase();
  const duplicate = (nearbyRows || []).find((row) => {
    const sameName = String(row.name || "").trim().toLocaleLowerCase() === normalizedName;
    const sameAddress = String(row.address || "").trim().toLocaleLowerCase() === normalizedAddress;
    return sameName && sameAddress;
  });
  if (duplicate?.id) {
    throw new Error(`A listing with this name and address already exists: ${duplicate.name || name}.`);
  }

  const slug = await createUniqueManualListingSlug(supabase, name);
  const capturedAt = new Date().toISOString();
  const mapUrl =
    suppliedMapUrl ||
    (placeId
      ? `https://www.google.com/maps/place/?q=place_id:${encodeURIComponent(placeId)}`
      : null);
  const businessInfoExtended: Record<string, unknown> = {
    trimma_categories: [category],
    listing_capture_category: category,
    listing_captured_at: capturedAt,
    manual_capture: true,
  };
  if (placeId) businessInfoExtended.google_place_id = placeId;
  if (mapUrl) businessInfoExtended.google_maps_url = mapUrl;

  const { data: created, error: insertError } = await supabase
    .from("salons")
    .insert({
      name,
      slug,
      category,
      province,
      district,
      city: city || null,
      address,
      phone,
      website,
      map_url: mapUrl,
      place_id: placeId,
      latitude,
      longitude,
      description,
      summary: description,
      logo_url: logoUrl,
      hero_url: heroUrl,
      cover_url: heroUrl,
      owner_email: null,
      owner_gmail: null,
      subscription_plan_id: null,
      ...LISTING_CAPTURE_SALON_DEFAULTS,
      business_info_extended: businessInfoExtended,
    })
    .select("id, name")
    .single();

  if (insertError) throw new Error(insertError.message);
  if (!created?.id) throw new Error("The listing was saved but no listing ID was returned.");

  await tryInsertOnboardingLog(supabase, {
    salon_id: String(created.id),
    action: "LISTING_CAPTURED_MANUALLY",
    notes: `Manually added to the Pending listing queue (${category} · ${city || district}).`,
  });

  return { salonId: String(created.id), name: String(created.name || name) };
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

export async function setListingFeaturedRecord(
  supabase: SupabaseClient,
  salonId: string,
  featured: boolean,
  period?: { startsAt?: string | null; endsAt?: string | null }
): Promise<void> {
  const { data: salon, error: fetchError } = await supabase
    .from("salons")
    .select("id, name, source_type, onboarding_status")
    .eq("id", salonId)
    .maybeSingle();

  if (fetchError) throw new Error(fetchError.message);
  if (!salon?.id) throw new Error("Salon not found.");
  if (!isListingPipelineSalon(salon)) {
    throw new Error("This salon is not in the listing generation pipeline.");
  }
  if (salon.onboarding_status !== LISTING_ONBOARDING_STATUS.PUBLISHED) {
    throw new Error("Publish the listing before featuring it on the marketplace.");
  }

  if (featured) {
    const startsAt = parseFeaturedDate(period?.startsAt);
    const endsAt = parseFeaturedDate(period?.endsAt);
    if (!isValidFeaturedPeriod(startsAt, endsAt)) {
      throw new Error("Featured start and end dates are required, and end must be on or after start.");
    }
    await updateSalonWithOptionalColumns(supabase, salonId, {
      is_featured: true,
      featured_starts_at: startsAt,
      featured_ends_at: endsAt,
    }).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      if (isMissingDbSchemaError(message)) {
        throw new Error("Run packages/db/FEATURED_LISTING_PERIOD.sql in Supabase before featuring listings.");
      }
      throw error;
    });
  } else {
    await updateSalonWithOptionalColumns(supabase, salonId, {
      is_featured: false,
      featured_starts_at: null,
      featured_ends_at: null,
    });
  }

  await tryInsertOnboardingLog(supabase, {
    salon_id: salonId,
    action: featured ? "LISTING_FEATURED" : "LISTING_UNFEATURED",
    notes: featured
      ? `Pinned as a featured marketplace listing from ${period?.startsAt} to ${period?.endsAt}.`
      : "Removed from featured marketplace listings.",
  });
}

export async function applyFeaturedBatchPeriod(
  supabase: SupabaseClient,
  period: { startsAt?: string | null; endsAt?: string | null }
): Promise<{ updatedCount: number }> {
  const startsAt = parseFeaturedDate(period.startsAt);
  const endsAt = parseFeaturedDate(period.endsAt);
  if (!isValidFeaturedPeriod(startsAt, endsAt)) {
    throw new Error("Featured start and end dates are required, and end must be on or after start.");
  }

  let result = await supabase
    .from("salons")
    .update({
      is_featured: true,
      featured_starts_at: startsAt,
      featured_ends_at: endsAt,
    })
    .eq("is_featured", true)
    .eq("onboarding_status", LISTING_ONBOARDING_STATUS.PUBLISHED)
    .select("id");
  if (result.error && isMissingDbSchemaError(result.error.message)) {
    throw new Error("Run packages/db/FEATURED_LISTING_PERIOD.sql in Supabase before featuring listings.");
  }
  if (result.error) throw new Error(result.error.message);

  const ids = (result.data || []).map((row) => String(row.id)).filter(Boolean);
  if (!ids.length) {
    throw new Error("There are no featured salons in the batch yet.");
  }

  await tryInsertOnboardingLog(supabase, {
    salon_id: ids[0],
    action: "LISTING_FEATURED_BATCH",
    notes: `Updated featured batch period for ${ids.length} listed salon${ids.length === 1 ? "" : "s"} from ${startsAt} to ${endsAt}.`,
  });

  return { updatedCount: ids.length };
}

export async function setListingAboutRecord(
  supabase: SupabaseClient,
  salonId: string,
  about: string
): Promise<void> {
  const { data: salon, error: fetchError } = await supabase
    .from("salons")
    .select("id, name, source_type, onboarding_status")
    .eq("id", salonId)
    .maybeSingle();

  if (fetchError) throw new Error(fetchError.message);
  if (!salon?.id) throw new Error("Salon not found.");
  if (!isListingPipelineSalon(salon)) {
    throw new Error("This salon is not in the listing generation pipeline.");
  }
  if (salon.onboarding_status !== LISTING_ONBOARDING_STATUS.PUBLISHED) {
    throw new Error("Publish the listing before editing the About section.");
  }

  const description = about.trim() || null;
  await updateSalonWithOptionalColumns(supabase, salonId, {
    description,
    summary: description,
  });

  await tryInsertOnboardingLog(supabase, {
    salon_id: salonId,
    action: "LISTING_ABOUT_UPDATED",
    notes: description
      ? "Updated the public About the salon section from the listed queue."
      : "Cleared the public About the salon section from the listed queue.",
  });
}
