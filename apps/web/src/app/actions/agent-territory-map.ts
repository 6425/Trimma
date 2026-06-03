"use server";

import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { requireAgentFromCookies } from "@/lib/server-agent-auth";

export async function getAgentMapData() {
  const auth = await requireAgentFromCookies();
  if ("error" in auth) return { success: false as const, error: auth.error };
  const user = { email: auth.email };

  const supabase = createSupabaseAdminClient();
  
  // 1. Find the agent's ID and territory
  const { data: agentData, error: agentError } = await supabase
    .from("agents")
    .select("id, territory")
    .eq("user_email", user.email)
    .maybeSingle();

  if (agentError || !agentData?.id) {
    return { success: false as const, error: "Agent not found" };
  }

  // Use the territory string from the agent profile directly
  const primaryTerritoryName = agentData.territory;

  // We can also fetch from agent_territories as a fallback or addition
  const { data: territoryData } = await supabase
    .from("agent_territories")
    .select("territory_id, territories ( id, name, type, slug )")
    .eq("agent_id", agentData.id);

  const territories: any[] = [];
  
  if (territoryData && territoryData.length > 0) {
    territoryData.forEach((t: any) => {
      if (t.territories && !territories.find(existing => existing.name === t.territories.name)) {
        territories.push(t.territories);
      }
    });
  } else if (primaryTerritoryName) {
    // Legacy fallback: split comma-separated string
    const names = primaryTerritoryName.split(",").map((n: string) => n.trim()).filter(Boolean);
    names.forEach((name: string) => {
      if (!territories.find(existing => existing.name === name)) {
        territories.push({
          id: "primary-" + name,
          name: name,
          type: "primary"
        });
      }
    });
  }

  // Return the data
  const { data: catData } = await supabase.from("categories").select("name").order("name");
  const categoryNames = catData?.map(c => c.name) || [];

  return {
    success: true as const,
    agentId: agentData.id,
    territories,
    categories: categoryNames
  };
}

export async function searchBusinessesInTerritories(categories: string[], territoryIds: string[]) {
  const auth = await requireAgentFromCookies();
  if ("error" in auth) return { success: false as const, error: auth.error };

  const supabase = createSupabaseAdminClient();
  
  let terrNames: string[] = [];

  // Build query for local DB
  let query = supabase
    .from("salons")
    .select("id, slug, name, category, address, city, phone, latitude, longitude, location, logo_url, is_verified, rating, review_count, status");

  let leadsQuery = supabase
    .from("salon_leads")
    .select("name, address");

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
      const orClauses = terrNames.map(name => `city.ilike.%${name}%,address.ilike.%${name}%`).join(",");
      if (orClauses) {
        query = query.or(orClauses);
      }
    }
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

    // Merge Google results, avoiding duplicates by name across BOTH salons and salon_leads
    const existingNames = new Set([
      ...businesses.map(b => b.name.toLowerCase()),
      ...(localLeads || []).map(l => l.name.toLowerCase())
    ]);
    
    for (const gb of googleBusinesses) {
      if (!existingNames.has(gb.name.toLowerCase())) {
        businesses.push(gb);
        existingNames.add(gb.name.toLowerCase());
      }
    }
  }

  return {
    success: true as const,
    businesses,
  };
}
