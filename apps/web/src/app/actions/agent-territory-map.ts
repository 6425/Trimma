"use server";

import { createSupabaseAdminClient } from "@/config/supabase-admin";
import {
  buildAgentTerritories,
  buildTerritorySearchScopes,
  businessMatchesTerritoryScopes,
  ensureAgentRecord,
  findAgentRecord,
  resolveAgentMapAgentId,
  resolveTerritorySearchScope,
  territorySearchOrClause,
} from "@/lib/agent-territory-resolve";
import { getAgentOperationalEmails } from "@/lib/agent-hierarchy";
import { requireAgentFromCookies } from "@/lib/server-agent-auth";
import {
  fetchGooglePlaceProfile,
  formatGoogleWorkingHoursText,
  inferTrimmaCategoryFromGoogleTypes,
  parseGoogleAddressParts,
} from "@/lib/google-place-profile";
import { getGoogleMapsApiKey } from "@/lib/google-place-images";

const DEFAULT_GOOGLE_CATEGORY_TERMS = [
  "hair salon",
  "beauty salon",
  "barber shop",
  "spa",
];

const FALLBACK_GOOGLE_TERRITORIES = ["Colombo", "Western Province", "Sri Lanka"];

function normalizeDbSalonRow(row: Record<string, unknown>) {
  return {
    id: String(row.id || row.slug || ""),
    slug: String(row.slug || row.id || ""),
    name: String(row.name || "Unnamed"),
    category: String(row.category || "General"),
    address: (row.address as string | null) || null,
    city: (row.city as string | null) || null,
    district: (row.district as string | null) || null,
    province: (row.province as string | null) || null,
    phone: (row.phone as string | null) || null,
    website: null,
    map_url: null,
    latitude: row.latitude == null ? null : Number(row.latitude),
    longitude: row.longitude == null ? null : Number(row.longitude),
    location: (row.location as string | null) || null,
    logo_url: (row.logo_url as string | null) || null,
    is_verified: Boolean(row.is_verified),
    rating: Number(row.rating) || 0,
    review_count: Number(row.review_count) || 0,
    working_hours: "",
    summary: "",
    price_level: null,
    status: String(row.status || "active"),
    assign_to: (row.assign_to as string | null) || null,
  };
}

function buildGoogleSearchQueries(
  territoryNames: string[],
  categories: string[],
  businessName?: string
): string[] {
  const queries = new Set<string>();
  const territories =
    territoryNames.length > 0 ? territoryNames : FALLBACK_GOOGLE_TERRITORIES;

  if (businessName?.trim()) {
    for (const territoryName of territories) {
      queries.add(`${businessName.trim()} in ${territoryName}, Sri Lanka`);
    }
    return [...queries].slice(0, 8);
  }

  const terms =
    categories.length > 0
      ? categories.slice(0, 4)
      : DEFAULT_GOOGLE_CATEGORY_TERMS;

  for (const territoryName of territories) {
    for (const term of terms) {
      queries.add(`${term} in ${territoryName}, Sri Lanka`);
    }
  }

  return [...queries].slice(0, 12);
}

function normalizeBusinessName(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function businessNameMatches(
  placeName: string | null | undefined,
  search: string
): boolean {
  if (!search) return true;
  if (!placeName) return false;
  const place = normalizeBusinessName(placeName);
  const term = normalizeBusinessName(search);
  if (!term) return true;
  return place.includes(term) || term.includes(place);
}

function geoFallbackFromTerritoryLabel(territoryName: string): {
  city: string;
  district: string;
  province: string;
} {
  const label = territoryName.trim();
  if (!label) return { city: "", district: "", province: "" };

  if (/\bprovince\b/i.test(label)) {
    return { city: "", district: "", province: label };
  }

  const scope = resolveTerritorySearchScope(label);
  if (scope) {
    const districtMatch = scope.districtNames.find(
      (name) => name.toLowerCase() === label.toLowerCase()
    );
    if (districtMatch) {
      return {
        city: "",
        district: districtMatch,
        province: scope.provinceNames[0] || "",
      };
    }

    const cityMatch = scope.cityNames.find(
      (name) => name.toLowerCase() === label.toLowerCase()
    );
    if (cityMatch) {
      return {
        city: cityMatch,
        district: scope.districtNames[0] || "",
        province: scope.provinceNames[0] || "",
      };
    }
  }

  return { city: label, district: "", province: "" };
}

function mapGooglePlace(
  place: any,
  category: string,
  territoryName: string,
  profile: Awaited<ReturnType<typeof fetchGooglePlaceProfile>> = null
) {
  const resolvedCategory =
    inferTrimmaCategoryFromGoogleTypes(profile?.types || place.types, category) || category;
  const phone =
    profile?.international_phone_number ||
    profile?.formatted_phone_number ||
    place.formatted_phone_number ||
    null;
  const addressParts = profile
    ? parseGoogleAddressParts(profile)
    : { city: null, district: null, province: null, postalCode: null };
  const territoryGeo = geoFallbackFromTerritoryLabel(territoryName);

  return {
    id: place.place_id,
    slug: place.place_id,
    name: profile?.name || place.name,
    category: resolvedCategory,
    address: profile?.formatted_address || place.formatted_address,
    city: addressParts.city || territoryGeo.city,
    district: addressParts.district || territoryGeo.district,
    province: addressParts.province || territoryGeo.province,
    phone,
    website: profile?.website || null,
    map_url: profile?.url || (place.place_id ? `https://www.google.com/maps/place/?q=place_id:${place.place_id}` : null),
    latitude: profile?.geometry?.location?.lat || place.geometry?.location?.lat || null,
    longitude: profile?.geometry?.location?.lng || place.geometry?.location?.lng || null,
    location: null,
    logo_url: place.icon || null,
    is_verified: false,
    rating: profile?.rating || place.rating || 0,
    review_count: profile?.user_ratings_total || place.user_ratings_total || 0,
    working_hours: formatGoogleWorkingHoursText(profile?.opening_hours) || "",
    summary: profile?.editorial_summary?.overview || "",
    price_level: profile?.price_level ?? null,
    status: "google_lead",
  };
}

async function fetchGoogleTextSearch(query: string, apiKey: string) {
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.status === "OK" && data.results) return data.results;
    if (data.status && data.status !== "ZERO_RESULTS") {
      console.warn(
        `[fetchGoogleTextSearch] ${data.status}${data.error_message ? `: ${data.error_message}` : ""} — query: ${query}`
      );
    }
  } catch (err) {
    console.error("Google Places API error:", err);
  }
  return [];
}

async function enrichGooglePlacesWithProfiles(
  places: any[],
  apiKey: string
): Promise<Array<{ place: any; profile: Awaited<ReturnType<typeof fetchGooglePlaceProfile>> }>> {
  const unique = new Map<string, any>();
  for (const place of places) {
    if (place?.place_id && !unique.has(place.place_id)) {
      unique.set(place.place_id, place);
    }
  }

  return Promise.all(
    [...unique.values()].map(async (place) => {
      const profile = await fetchGooglePlaceProfile(place.place_id, apiKey);
      return { place, profile };
    })
  );
}

async function resolveTerritoryNames(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  territoryIds: string[]
) {
  const realIds = territoryIds.filter((id) => !id.startsWith("primary-"));
  const primaryNames = territoryIds
    .filter((id) => id.startsWith("primary-"))
    .map((id) => id.replace("primary-", ""));

  let terrNames = [...primaryNames];

  if (realIds.length > 0) {
    const { data: terrs } = await supabase.from("territories").select("name").in("id", realIds);
    if (terrs?.length) {
      terrNames = [...terrNames, ...terrs.map((t) => t.name)];
    }
  }

  return [...new Set(terrNames.filter(Boolean))];
}

async function resolveEffectiveTerritoryNames(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  auth: { email: string; userId: string; role: string },
  territoryIds: string[]
): Promise<string[]> {
  const terrNames = await resolveTerritoryNames(supabase, territoryIds);
  if (terrNames.length > 0) return terrNames;

  const operationalEmails = await getAgentOperationalEmails(
    supabase,
    auth.email,
    auth.userId,
    auth.role
  );
  const { data: salons } = await supabase
    .from("salons")
    .select("province, district, city")
    .in("assign_to", operationalEmails);

  const names = new Set<string>();
  for (const salon of salons || []) {
    for (const part of [salon.city, salon.district, salon.province]) {
      const trimmed = part?.trim();
      if (trimmed) names.add(trimmed);
    }
  }

  return [...names];
}

function applyTerritoryScope<T extends Record<string, unknown>>(
  rows: T[],
  territoryNames: string[]
): T[] {
  if (territoryNames.length === 0) return rows;
  const scopes = buildTerritorySearchScopes(territoryNames);
  return rows.filter((row) => businessMatchesTerritoryScopes(row as any, scopes));
}

export async function getAgentMapData() {
  const auth = await requireAgentFromCookies();
  if ("error" in auth) return { success: false as const, error: auth.error };

  const supabase = createSupabaseAdminClient();

  let agentRow = await findAgentRecord(supabase, auth.email, auth.userId);
  try {
    agentRow = (await ensureAgentRecord(supabase, auth.email, auth.userId)) || agentRow;
  } catch {
    // Still serve map data from agent_territories / assigned salons without blocking the page.
  }

  const territories = await buildAgentTerritories(supabase, auth.email, agentRow);
  const { data: catData } = await supabase.from("categories").select("name").order("name");

  return {
    success: true as const,
    agentId: resolveAgentMapAgentId(auth.email, agentRow),
    territories,
    categories: [...new Set((catData || []).map((c) => c.name).filter(Boolean))],
  };
}

export async function searchBusinessesInTerritories(
  categories: string[],
  territoryIds: string[],
  limit: number = 0,
  businessName?: string
) {
  const auth = await requireAgentFromCookies();
  if ("error" in auth) return { success: false as const, error: auth.error };

  const supabase = createSupabaseAdminClient();
  const trimmedName = businessName?.trim();
  const selectedTerrNames = await resolveTerritoryNames(supabase, territoryIds);
  const operationalEmails = await getAgentOperationalEmails(
    supabase,
    auth.email,
    auth.userId,
    auth.role
  );
  const googleTerrNames =
    selectedTerrNames.length > 0
      ? selectedTerrNames
      : await resolveEffectiveTerritoryNames(supabase, auth, territoryIds);

  let query = supabase
    .from("salons")
    .select(
      "id, slug, name, category, address, city, district, province, phone, latitude, longitude, location, logo_url, is_verified, rating, review_count, status, assign_to"
    );

  if (limit > 0 && !trimmedName) query = query.limit(Math.max(limit * 3, limit));

  const leadsQuery = supabase.from("salon_leads").select("name, address, assign_to");

  if (selectedTerrNames.length > 0) {
    const orClause = territorySearchOrClause(selectedTerrNames);
    if (orClause) query = query.or(orClause);
  } else if (operationalEmails.length === 1) {
    const email = operationalEmails[0];
    query = query.or(`assign_to.eq.${email},assign_to.ilike.${email}`);
  } else {
    query = query.in("assign_to", operationalEmails);
  }

  if (categories.length > 0 && !trimmedName) {
    const safeCategories = categories
      .map((cat) => cat.trim())
      .filter(Boolean)
      .slice(0, 6);
    if (safeCategories.length === 1) {
      query = query.ilike("category", `%${safeCategories[0]}%`);
    } else if (safeCategories.length > 1) {
      const orClauses = safeCategories
        .map((cat) => `category.ilike.%${cat.replace(/,/g, "")}%`)
        .join(",");
      query = query.or(orClauses);
    }
  }

  if (trimmedName) {
    query = query.ilike("name", `%${trimmedName}%`);
  }

  const { data: dbData, error } = await query;
  if (error) {
    return { success: false as const, error: error.message };
  }

  let businesses: any[] = applyTerritoryScope(
    (dbData || []).map((row) => normalizeDbSalonRow(row as Record<string, unknown>)),
    selectedTerrNames
  );
  const dbCount = businesses.length;
  let googleCount = 0;

  const apiKey = getGoogleMapsApiKey();
  if (apiKey) {
    const searchQueries = buildGoogleSearchQueries(
      googleTerrNames,
      categories,
      trimmedName || undefined
    );
    const googleResultsArray = await Promise.all(
      searchQueries.map((searchQuery) => fetchGoogleTextSearch(searchQuery, apiKey))
    );
    const rawGooglePlaces = googleResultsArray.flat();
    const uniqueGooglePlaces = new Map<string, any>();
    for (const place of rawGooglePlaces) {
      if (place?.place_id && !uniqueGooglePlaces.has(place.place_id)) {
        uniqueGooglePlaces.set(place.place_id, place);
      }
    }

    const enrichedGooglePlaces = await enrichGooglePlacesWithProfiles(
      [...uniqueGooglePlaces.values()].slice(0, Math.max(limit || 12, 24)),
      apiKey
    );

    const googleBusinesses = enrichedGooglePlaces.map(({ place, profile }) =>
      mapGooglePlace(
        place,
        trimmedName ? "Business" : categories[0] || DEFAULT_GOOGLE_CATEGORY_TERMS[0],
        googleTerrNames[0] || FALLBACK_GOOGLE_TERRITORIES[0],
        profile
      )
    );

    const { data: localLeads } = await leadsQuery;

    const salonNames = new Set(businesses.map((b) => b.name.toLowerCase()));
    const leadByName = new Map<string, { assign_to?: string | null }>();
    for (const l of localLeads || []) {
      if (l?.name) leadByName.set(l.name.toLowerCase(), { assign_to: l.assign_to });
    }

    const seenGoogle = new Set<string>();
    for (const gb of googleBusinesses) {
      if (trimmedName && !businessNameMatches(gb.name, trimmedName)) continue;

      const key = (gb.id || gb.name || "").toLowerCase();
      const nameKey = gb.name?.toLowerCase() || "";
      if (salonNames.has(nameKey)) continue;
      if (seenGoogle.has(key)) continue;
      seenGoogle.add(key);

      const lead = leadByName.get(nameKey);
      if (lead) {
        businesses.push({ ...gb, is_taken: true, assign_to: lead.assign_to ?? null });
      } else {
        businesses.push(gb);
      }
      googleCount += 1;
    }
  } else {
    console.warn("[searchBusinessesInTerritories] GOOGLE_API is not configured — Google discovery skipped.");
  }

  if (trimmedName) {
    businesses = businesses.filter((b) => businessNameMatches(b.name, trimmedName));
  }

  return {
    success: true as const,
    businesses: limit > 0 ? businesses.slice(0, limit) : businesses,
    meta: {
      dbCount,
      googleCount,
      googleConfigured: Boolean(apiKey),
    },
  };
}
