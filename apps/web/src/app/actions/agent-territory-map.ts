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
    categories: catData?.map((c) => c.name) || [],
  };
}

export async function searchBusinessesInTerritories(
  categories: string[],
  territoryIds: string[],
  limit: number = 0
) {
  const auth = await requireAgentFromCookies();
  if ("error" in auth) return { success: false as const, error: auth.error };

  const supabase = createSupabaseAdminClient();
  
  let terrNames: string[] = [];

  // Build query for local DB
  let query = supabase
    .from("salons")
    .select("id, slug, name, category, address, city, phone, latitude, longitude, location, logo_url, is_verified, rating, review_count, status, assign_to");

  if (limit > 0) query = query.limit(limit);

  let leadsQuery = supabase
    .from("salon_leads")
    .select("name, address, assign_to");

  if (territoryIds.length > 0) {
    const realIds = territoryIds.filter(id => !id.startsWith("primary-"));
    const primaryNames = territoryIds.filter(id => id.startsWith("primary-")).map(id => id.replace("primary-", ""));
    
    terrNames = [...primaryNames];

    if (realIds.length > 0) {
      const { data: terrs } = await supabase.from("territories").select("name").in("id", realIds);
      if (terrs && terrs.length > 0) {
        terrNames = [...terrNames, ...terrs.map(t => t.name)];
      }
    }

    if (terrNames.length > 0) {
      const orClause = territorySearchOrClause(terrNames);
      if (orClause) query = query.or(orClause);
    }
  }

  if (terrNames.length === 0) {
    const email = normalizeEmail(auth.email) || auth.email;
    query = query.or(`assign_to.eq.${email},assign_to.ilike.${email}`);
  }

  if (categories.length > 0 && !categories.includes("All Categories")) {
    const orClauses = categories.map(cat => `category.ilike.%${cat}%`).join(",");
    query = query.or(orClauses);
  }

  const { data: dbData, error } = await query;
  if (error) {
    return { success: false as const, error: error.message };
  }

  const businesses: any[] = dbData || [];

  // Search Google Places API if a specific category is selected
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (apiKey && terrNames.length > 0) {
    const searchCategories = categories.length > 0 && !categories.includes("All Categories") 
      ? categories 
      : ["Salon", "Spa"]; // default search terms if all

    const googlePromises = [];

    for (const territoryName of terrNames) {
      for (const category of searchCategories) {
        const searchQuery = encodeURIComponent(`${category} in ${territoryName}, Sri Lanka`);
        const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${searchQuery}&key=${apiKey}`;
        
        googlePromises.push(
          fetch(url)
            .then(res => res.json())
            .then(data => {
              if (data.status === "OK" && data.results) {
                return data.results.map((place: any) => ({
                  id: place.place_id,
                  slug: place.place_id,
                  name: place.name,
                  category: category,
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
                  status: "google_lead" // special status for map leads
                }));
              }
              return [];
            })
            .catch(err => {
              console.error("Google Places API error:", err);
              return [];
            })
        );
      }
    }

    const googleResultsArray = await Promise.all(googlePromises);
    const googleBusinesses = googleResultsArray.flat();

    const { data: localLeads } = await leadsQuery;

    // Salons already in our DB are shown as their own rows, so skip Google dups of them.
    const salonNames = new Set(businesses.map(b => b.name.toLowerCase()));

    // Manual leads (salon_leads) aren't shown as rows, so surface their Google match
    // and flag it as "already taken" instead of hiding it.
    const leadByName = new Map<string, { assign_to?: string | null }>();
    for (const l of localLeads || []) {
      if (l?.name) leadByName.set(l.name.toLowerCase(), { assign_to: l.assign_to });
    }

    const seenGoogle = new Set<string>();
    for (const gb of googleBusinesses) {
      const key = gb.name.toLowerCase();
      if (salonNames.has(key)) continue; // already represented by a salon row
      if (seenGoogle.has(key)) continue; // de-dup within Google results
      seenGoogle.add(key);

      const lead = leadByName.get(key);
      if (lead) {
        businesses.push({ ...gb, is_taken: true, assign_to: lead.assign_to ?? null });
      } else {
        businesses.push(gb);
      }
    }
  }

  return {
    success: true as const,
    businesses: limit > 0 ? businesses.slice(0, limit) : businesses,
  };
}
