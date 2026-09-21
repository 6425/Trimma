"use server";

import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { verifyAccessToken } from "@/lib/auth/verify-access-token";
import { resolveTrimmaUserRoleServer } from "@/lib/trimma-role-server";
import { forceSalonOwnerUpgrade } from "@/lib/force-salon-owner-upgrade";
import {
  rankOnboardingBusinessMatches,
  type OnboardingBusinessSearchInput,
} from "@/lib/onboarding-business-match";
import {
  insertOnboardingSalonLead,
  type OnboardingLeadFormInput,
} from "@/lib/onboarding-lead-insert";
import { mirrorOnboardingLeadToSalonRequests } from "@/lib/salon-request-insert";
import { isSalonClaimable } from "@/lib/salon-public-listing";
import { notifyAgentLeadAssigned } from "@/lib/agent-lead-notifications";
import { APP_BASE_URL } from "@/lib/email/config";
import { sendTriggeredEmail } from "@/app/actions/email-settings";
import type { SalonDuplicateRow } from "@/lib/salon-discovery-dedup";
import { isRealGooglePlaceId } from "@/lib/salon-discovery-dedup";
import { applySalonSlugOnNameChange } from "@/lib/salon-profile-save";
import { sanitizeText } from "@/lib/sanitize-input";
import { notifyOwnerDraftCreated } from "@/app/actions/salon-onboarding-notifications";
import { validateManualListingLocation } from "@/lib/listing-generation-mutations";

const SEARCH_COLUMNS =
  "id,name,slug,category,city,district,province,address,phone,place_id,business_info_extended,owner_email,owner_gmail,is_verified,onboarding_status,status,public_visibility,booking_enabled,source_type,latitude,longitude";

export type OnboardingBusinessResult = {
  id: string;
  name: string;
  slug: string | null;
  category: string | null;
  city: string | null;
  district: string | null;
  province: string | null;
  address: string | null;
  phoneHint: string | null;
  matchReasons: string[];
  claimable: boolean;
  alreadyManaged: boolean;
};

export type OnboardingNewBusinessInput = OnboardingBusinessSearchInput & {
  categoryId: string;
  province: string;
  district: string;
  city?: string;
  address: string;
  website?: string;
  mapUrl?: string;
  latitude?: string;
  longitude?: string;
  description?: string;
  logoUrl?: string;
  heroUrl?: string;
};

function cleanSearchText(value: string | undefined, maxLength = 100): string {
  return String(value || "")
    .replace(/[%,()_*]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function cleanLongText(value: string | undefined, maxLength: number): string {
  return String(value || "").trim().slice(0, maxLength);
}

function cleanOptionalUrl(value: string | undefined, label: string): string | null {
  const raw = String(value || "").trim().slice(0, 2_000);
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error();
    return url.toString();
  } catch {
    throw new Error(`${label} must be a valid http or https URL.`);
  }
}

function cleanOptionalCoordinate(
  value: string | undefined,
  label: string,
  min: number,
  max: number
): number | null {
  const raw = String(value || "").trim();
  if (!raw) return null;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    throw new Error(`${label} must be between ${min} and ${max}.`);
  }
  return parsed;
}

function phoneHint(value: unknown): string | null {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.length < 4) return null;
  return `•••• ${digits.slice(-4)}`;
}

function isSearchableSalon(row: SalonDuplicateRow): boolean {
  const status = String(row.status || "").toLowerCase();
  const onboardingStatus = String(row.onboarding_status || "").toUpperCase();
  return status !== "rejected" && onboardingStatus !== "LISTING_REJECTED";
}

async function loadSearchRows(input: OnboardingBusinessSearchInput): Promise<SalonDuplicateRow[]> {
  const supabase = createSupabaseAdminClient();
  const listingId = cleanSearchText(input.listingId, 80);
  const placeId = cleanSearchText(input.placeId, 180);
  const businessName = cleanSearchText(input.businessName);
  const town = cleanSearchText(input.town);
  const phoneDigits = String(input.phone || "").replace(/\D/g, "").slice(-9);
  const queries: PromiseLike<{ data: unknown[] | null; error: { message: string } | null }>[] = [];

  if (listingId) {
    queries.push(supabase.from("salons").select(SEARCH_COLUMNS).eq("id", listingId).limit(1));
  }
  if (placeId) {
    queries.push(supabase.from("salons").select(SEARCH_COLUMNS).eq("place_id", placeId).limit(5));
  }
  if (businessName.length >= 2) {
    queries.push(
      supabase.from("salons").select(SEARCH_COLUMNS).ilike("name", `%${businessName}%`).limit(50)
    );
    const firstWord = businessName.split(" ").find((word) => word.length >= 3);
    if (firstWord && firstWord.toLowerCase() !== businessName.toLowerCase()) {
      queries.push(
        supabase.from("salons").select(SEARCH_COLUMNS).ilike("name", `%${firstWord}%`).limit(50)
      );
    }
  }
  if (town.length >= 2) {
    queries.push(supabase.from("salons").select(SEARCH_COLUMNS).ilike("city", `%${town}%`).limit(60));
    queries.push(supabase.from("salons").select(SEARCH_COLUMNS).ilike("district", `%${town}%`).limit(60));
    queries.push(supabase.from("salons").select(SEARCH_COLUMNS).ilike("address", `%${town}%`).limit(60));
  }
  if (phoneDigits.length >= 7) {
    queries.push(
      supabase.from("salons").select(SEARCH_COLUMNS).ilike("phone", `%${phoneDigits.slice(-7)}%`).limit(30)
    );
  }

  const settled = await Promise.all(queries);
  const rows = new Map<string, SalonDuplicateRow>();
  for (const result of settled) {
    if (result.error) throw new Error(result.error.message);
    for (const raw of result.data || []) {
      const row = raw as SalonDuplicateRow;
      const id = String(row.id || "");
      if (id && isSearchableSalon(row)) rows.set(id, row);
    }
  }
  return [...rows.values()];
}

function toPublicResult(
  match: ReturnType<typeof rankOnboardingBusinessMatches>[number]
): OnboardingBusinessResult {
  const row = match.row;
  const claimable = isSalonClaimable(row);
  return {
    id: String(row.id || ""),
    name: String(row.name || "Business on Trimma"),
    slug: row.slug ? String(row.slug) : null,
    category: row.category ? String(row.category) : null,
    city: row.city ? String(row.city) : null,
    district: row.district ? String(row.district) : null,
    province: row.province ? String(row.province) : null,
    address: row.address ? String(row.address) : null,
    phoneHint: phoneHint(row.phone),
    matchReasons: match.reasons,
    claimable,
    alreadyManaged: !claimable,
  };
}

async function verifyOnboardingUser(accessToken: string) {
  const verified = await verifyAccessToken(accessToken);
  if (!verified) throw new Error("Your Google session has expired. Please sign in again.");

  const role =
    (await resolveTrimmaUserRoleServer(verified.userId, verified.email)) ?? "customer";
  if (role === "admin" || role === "agent" || role === "regional_head") {
    throw new Error("Use the dedicated Admin or Partner portal for this account.");
  }
  return { verified, role };
}

function validateBusinessSearchInput(input: OnboardingBusinessSearchInput): string | null {
  const hasDirectListing = Boolean(cleanSearchText(input.listingId, 80));
  const hasPlaceId = Boolean(cleanSearchText(input.placeId, 180));
  const name = cleanSearchText(input.businessName);
  const town = cleanSearchText(input.town);
  const phone = String(input.phone || "").replace(/\D/g, "");
  if (!hasDirectListing && !hasPlaceId && name.length < 2 && phone.length < 7 && town.length < 2) {
    return "Enter a business name, phone number, or town to search.";
  }
  return null;
}

/** Public, sanitized discovery used before Google sign-in. */
export async function searchPublicOnboardingBusinesses(input: OnboardingBusinessSearchInput) {
  try {
    const validationError = validateBusinessSearchInput(input);
    if (validationError) return { success: false as const, error: validationError };
    const rows = await loadSearchRows(input);
    const matches = rankOnboardingBusinessMatches(rows, input).slice(0, 8).map(toPublicResult);
    return { success: true as const, matches };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Could not search Trimma listings.",
    };
  }
}

export async function searchOnboardingBusinesses(
  accessToken: string,
  input: OnboardingBusinessSearchInput
) {
  try {
    await verifyOnboardingUser(accessToken);
    const validationError = validateBusinessSearchInput(input);
    if (validationError) return { success: false as const, error: validationError };

    const rows = await loadSearchRows(input);
    const matches = rankOnboardingBusinessMatches(rows, input).slice(0, 8).map(toPublicResult);
    return { success: true as const, matches };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Could not search Trimma listings.",
    };
  }
}

export async function beginOnboardingBusinessClaim(
  accessToken: string,
  input: { salonId: string; phone: string; town?: string }
) {
  try {
    const { verified } = await verifyOnboardingUser(accessToken);
    const salonId = cleanSearchText(input.salonId, 80);
    const claimantPhone = cleanSearchText(input.phone, 40);
    if (!salonId) throw new Error("Choose a business to claim.");
    if (claimantPhone.replace(/\D/g, "").length < 9) {
      throw new Error("Enter a valid WhatsApp or business phone number before continuing.");
    }

    const supabase = createSupabaseAdminClient();
    const { data: listing, error: listingError } = await supabase
      .from("salons")
      .select(SEARCH_COLUMNS)
      .eq("id", salonId)
      .maybeSingle();

    if (listingError || !listing || !isSearchableSalon(listing as SalonDuplicateRow)) {
      throw new Error("This Trimma listing is no longer available.");
    }
    if (!isSalonClaimable(listing)) {
      throw new Error("This business is already managed. Contact Trimma support if ownership has changed.");
    }

    const { data: existingRequests } = await supabase
      .from("salon_requests")
      .select("id")
      .eq("email", verified.email.toLowerCase())
      .eq("inquiry_type", "Business Listing Claim")
      .ilike("message", `%Trimma listing ID: ${salonId}%`)
      .in("status", ["new", "reviewing", "contacted"])
      .limit(1);

    if (existingRequests?.length) {
      return {
        success: true as const,
        alreadySubmitted: true,
        message: "Your ownership claim is already awaiting Trimma verification.",
      };
    }

    const ownerName = String(
      verified.userMetadata?.full_name ||
        verified.userMetadata?.name ||
        verified.userMetadata?.first_name ||
        verified.email.split("@")[0]
    ).trim();
    const city = String(listing.city || input.town || listing.district || "").trim();
    const district = String(listing.district || input.town || city || "Sri Lanka").trim();
    const province = String(listing.province || "Sri Lanka").trim();
    const address = String(listing.address || [city, district].filter(Boolean).join(", ") || "Sri Lanka").trim();
    const formData: OnboardingLeadFormInput = {
      claimSalonId: salonId,
      businessName: String(listing.name || "Business on Trimma"),
      ownerName,
      email: verified.email,
      whatsapp: claimantPhone,
      province,
      district,
      city,
      address,
      latitude: listing.latitude == null ? null : Number(listing.latitude),
      longitude: listing.longitude == null ? null : Number(listing.longitude),
      notes: "Ownership claim started from the universal Google onboarding search.",
    };

    const { id: leadId, assignedAgent, isWaitingList } = await insertOnboardingSalonLead(
      supabase,
      formData
    );
    await mirrorOnboardingLeadToSalonRequests(supabase, formData, leadId);

    await supabase.from("onboarding_logs").insert({
      salon_id: salonId,
      actor_email: verified.email,
      action: "BUSINESS_CLAIM_REQUESTED",
      notes: assignedAgent
        ? `Ownership claim submitted and routed to ${assignedAgent}.`
        : "Ownership claim submitted without a matching field agent; Trimma admin review is required.",
    });

    const salonAddress = [address, city, district, province].filter(Boolean).join(", ");
    await Promise.allSettled([
      sendTriggeredEmail({
        triggerId: "partner-lead-received",
        to: verified.email,
        variables: {
          owner_name: ownerName,
          salon_name: formData.businessName,
          salon_address: salonAddress,
        },
        rateLimitKey: `partner-lead:${leadId}`,
        idempotencyKey: `partner-lead/${leadId}`,
      }),
      assignedAgent
        ? notifyAgentLeadAssigned(supabase, {
            salonId: leadId,
            salonName: formData.businessName,
            salonAddress,
            assignToEmail: assignedAgent,
            onboardingStatus: "ASSIGNED_TO_AGENT",
            dashboardLink: `${APP_BASE_URL}/agent/leads`,
          })
        : Promise.resolve(),
    ]);

    return {
      success: true as const,
      alreadySubmitted: false,
      leadId,
      isWaitingList,
      message: "Ownership verification has started. Trimma will contact you before dashboard access is granted.",
    };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Could not start ownership verification.",
    };
  }
}

export async function createNewOnboardingBusiness(
  accessToken: string,
  input: OnboardingNewBusinessInput
) {
  try {
    const { verified, role } = await verifyOnboardingUser(accessToken);
    if (role === "salon_owner") {
      return { success: true as const, salonId: null, alreadyOwner: true };
    }

    const businessName = cleanSearchText(input.businessName);
    const phone = cleanSearchText(input.phone, 40);
    const town = cleanSearchText(input.town);
    const placeId = cleanSearchText(input.placeId, 180);
    const categoryId = cleanSearchText(input.categoryId, 80);
    const province = cleanSearchText(input.province, 120);
    const district = cleanSearchText(input.district, 120);
    const city = cleanSearchText(input.city, 120);
    const address = cleanLongText(input.address, 500);
    const description = cleanLongText(input.description, 4_000) || null;
    const website = cleanOptionalUrl(input.website, "Website");
    const suppliedMapUrl = cleanOptionalUrl(input.mapUrl, "Google Maps URL");
    const logoUrl = cleanOptionalUrl(input.logoUrl, "Logo URL");
    const heroUrl = cleanOptionalUrl(input.heroUrl, "Hero image URL");
    const latitude = cleanOptionalCoordinate(input.latitude, "Latitude", -90, 90);
    const longitude = cleanOptionalCoordinate(input.longitude, "Longitude", -180, 180);
    if (businessName.length < 2) throw new Error("Enter the business name before continuing.");
    if (phone.replace(/\D/g, "").length < 9) throw new Error("Enter a valid business phone number.");
    if (town.length < 2) throw new Error("Enter the business town or location.");
    if (!categoryId) throw new Error("Select a Trimma category.");
    if (!province || !district) throw new Error("Select the business province and district.");
    if (address.length < 2) throw new Error("Enter the full business address.");
    if ((latitude === null) !== (longitude === null)) {
      throw new Error("Enter both latitude and longitude, or leave both empty.");
    }
    if (placeId && !isRealGooglePlaceId(placeId)) {
      throw new Error("Enter a valid Google Place ID, or leave it empty.");
    }

    const rows = await loadSearchRows({ businessName, phone, town, placeId });
    const likelyDuplicates = rankOnboardingBusinessMatches(rows, {
      businessName,
      phone,
      town,
      placeId,
    })
      .filter((match) => match.likelyDuplicate)
      .slice(0, 5)
      .map(toPublicResult);

    if (likelyDuplicates.length > 0) {
      return {
        success: false as const,
        duplicateFound: true as const,
        error: "A likely matching business already exists on Trimma. Claim it instead of creating a duplicate.",
        matches: likelyDuplicates,
      };
    }

    const supabase = createSupabaseAdminClient();
    const { data: selectedCategory, error: categoryError } = await supabase
      .from("categories")
      .select("id, name")
      .eq("id", categoryId)
      .maybeSingle();
    if (categoryError) throw new Error(categoryError.message);
    if (!selectedCategory?.id || !selectedCategory.name) {
      throw new Error("Select a valid Trimma category.");
    }
    const locationIds = await validateManualListingLocation(
      supabase,
      province,
      district,
      city
    );
    const mapUrl =
      suppliedMapUrl ||
      (placeId
        ? `https://www.google.com/maps/place/?q=place_id:${encodeURIComponent(placeId)}`
        : null);
    const upgraded = await forceSalonOwnerUpgrade(
      supabase,
      verified.userId,
      verified.email,
      verified.userMetadata?.full_name || verified.userMetadata?.first_name,
      verified.userMetadata?.avatar_url
    );

    const { data: draft, error: draftError } = await supabase
      .from("salons")
      .select("id, business_info_extended")
      .eq("id", upgraded.salonId)
      .maybeSingle();
    if (draftError || !draft) {
      throw new Error(draftError?.message || "Could not load your new salon draft.");
    }

    const existingExtended =
      draft.business_info_extended &&
      typeof draft.business_info_extended === "object" &&
      !Array.isArray(draft.business_info_extended)
        ? (draft.business_info_extended as Record<string, unknown>)
        : {};
    const updatePayload = await applySalonSlugOnNameChange(supabase, upgraded.salonId, {
      name: sanitizeText(businessName),
      phone: sanitizeText(phone),
      category: sanitizeText(String(selectedCategory.name)),
      province: sanitizeText(province),
      province_id: locationIds.provinceId,
      district: sanitizeText(district),
      district_id: locationIds.districtId,
      city: city ? sanitizeText(city) : null,
      city_id: locationIds.cityId,
      address: sanitizeText(address),
      website,
      map_url: mapUrl,
      place_id: placeId || null,
      latitude,
      longitude,
      description,
      summary: description,
      logo_url: logoUrl,
      hero_url: heroUrl,
      cover_url: heroUrl,
      business_info_extended: {
        ...existingExtended,
        onboarding_business_name: sanitizeText(businessName),
        onboarding_phone: sanitizeText(phone),
        onboarding_town: sanitizeText(city || district),
        trimma_categories: [String(selectedCategory.name)],
        self_serve_listing_form: true,
        ...(placeId ? { google_place_id: placeId } : {}),
        ...(mapUrl ? { google_maps_url: mapUrl } : {}),
      },
    });

    const { error: updateError } = await supabase
      .from("salons")
      .update(updatePayload)
      .eq("id", upgraded.salonId);
    if (updateError) throw new Error(updateError.message);

    await supabase.from("onboarding_logs").insert({
      salon_id: upgraded.salonId,
      actor_email: verified.email,
      action: "SELF_SERVE_BUSINESS_CREATED",
      notes: `Private salon draft created after duplicate search: ${businessName}, ${city || district}.`,
    });

    await notifyOwnerDraftCreated({
      salonId: upgraded.salonId,
      salonName: businessName,
      salonAddress: [address, city, district, province].filter(Boolean).join(", "),
      ownerEmail: verified.email,
      ownerName:
        verified.userMetadata?.full_name ||
        verified.userMetadata?.first_name ||
        verified.email.split("@")[0],
    });

    return {
      success: true as const,
      salonId: upgraded.salonId,
      alreadyOwner: false,
    };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Could not start a new business profile.",
    };
  }
}
