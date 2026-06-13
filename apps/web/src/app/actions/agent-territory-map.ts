"use server";

import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { requireAgentFromCookies } from "@/lib/server-agent-auth";
import {
  buildAgentTerritories,
  ensureAgentRecord,
  findAgentRecord,
  resolveAgentMapAgentId,
  territorySearchOrClause,
} from "@/lib/agent-territory-resolve";
import { normalizeEmail } from "@/lib/normalize-email";

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

function mapGooglePlace(place: any, category: string, territoryName: string) {
  return {
    id: place.place_id,
    slug: place.place_id,
    name: place.name,
    category,
    address: place.formatted_address,
    city: territoryName,
    phone: null,
    latitude: place.geometry?.location?.lat || null,
    longitude: place.geometry?.location?.lng || null,
    location: null,
    logo_url: place.icon || null,
    is_verified: false,
    rating: place.rating || 0,
    review_count: place.user_ratings_total || 0,
    status: "google_lead",
  };
}

async function fetchGoogleTextSearch(query: string, apiKey: string) {
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.status === "OK" && data.results) return data.results;
  } catch (err) {
    console.error("Google Places API error:", err);
  }
  return [];
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
  const terrNames = await resolveTerritoryNames(supabase, territoryIds);

  let query = supabase
    .from("salons")
    .select("id, slug, name, category, address, city, phone, latitude, longitude, location, logo_url, is_verified, rating, review_count, status, assign_to");

  // Apply result limit only after Google merge when searching by business name.
  if (limit > 0 && !trimmedName) query = query.limit(limit);

  const leadsQuery = supabase.from("salon_leads").select("name, address, assign_to");

  // Territory filter applies to broad browse searches, not explicit business-name lookups.
  if (!trimmedName) {
    if (terrNames.length > 0) {
      const orClause = territorySearchOrClause(terrNames);
      if (orClause) query = query.or(orClause);
    } else {
      const email = normalizeEmail(auth.email) || auth.email;
      query = query.or(`assign_to.eq.${email},assign_to.ilike.${email}`);
    }
  }

  if (categories.length > 0 && !categories.includes("All Categories") && !trimmedName) {
    const orClauses = categories.map((cat) => `category.ilike.%${cat}%`).join(",");
    query = query.or(orClauses);
  }

  if (trimmedName) {
    query = query.ilike("name", `%${trimmedName}%`);
  }

  const { data: dbData, error } = await query;
  if (error) {
    return { success: false as const, error: error.message };
  }

  let businesses: any[] = dbData || [];

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (apiKey) {
    const googlePromises: Promise<any[]>[] = [];
    const searchContexts = terrNames.length > 0 ? terrNames : ["Sri Lanka"];

    if (trimmedName) {
      const queries = new Set<string>();
      for (const territoryName of searchContexts) {
        queries.add(`${trimmedName} in ${territoryName}, Sri Lanka`);
        queries.add(`${trimmedName} ${territoryName} Sri Lanka`);
      }
      queries.add(`${trimmedName} Sri Lanka`);
      queries.add(trimmedName);

      for (const searchQuery of queries) {
        googlePromises.push(
          fetchGoogleTextSearch(searchQuery, apiKey).then((results) =>
            results.map((place) => mapGooglePlace(place, "Business", searchContexts[0]))
          )
        );
      }
    } else if (terrNames.length > 0) {
      const searchCategories =
        categories.length > 0 && !categories.includes("All Categories")
          ? categories
          : ["Salon", "Spa"];

      for (const territoryName of terrNames) {
        for (const category of searchCategories) {
          const searchQuery = `${category} in ${territoryName}, Sri Lanka`;
          googlePromises.push(
            fetchGoogleTextSearch(searchQuery, apiKey).then((results) =>
              results.map((place) => mapGooglePlace(place, category, territoryName))
            )
          );
        }
      }
    }

    const googleResultsArray = await Promise.all(googlePromises);
    const googleBusinesses = googleResultsArray.flat();

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
    }
  }

  if (trimmedName) {
    businesses = businesses.filter((b) => businessNameMatches(b.name, trimmedName));
  }

  return {
    success: true as const,
    businesses: limit > 0 ? businesses.slice(0, limit) : businesses,
  };
}
