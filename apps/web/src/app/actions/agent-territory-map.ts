"use server";

import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { getSalonAccessTokenFromCookies } from "@/lib/server-salon-auth";

async function getAuthedUser() {
  const accessToken = await getSalonAccessTokenFromCookies();
  if (!accessToken) return null;
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase.auth.getUser(accessToken);
  return data.user || null;
}

export async function getAgentMapData() {
  const user = await getAuthedUser();
  if (!user) return { success: false as const, error: "Not authenticated" };

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

  const territories = [];
  
  if (primaryTerritoryName) {
    territories.push({
      id: "primary-" + primaryTerritoryName,
      name: primaryTerritoryName,
      type: "primary"
    });
  }

  if (territoryData && territoryData.length > 0) {
    territoryData.forEach((t: any) => {
      if (t.territories && !territories.find(existing => existing.name === t.territories.name)) {
        territories.push(t.territories);
      }
    });
  }

  // Return the data
  return {
    success: true as const,
    territories,
  };
}

export async function searchBusinessesInTerritories(categories: string[], territoryIds: string[]) {
  const user = await getAuthedUser();
  if (!user) return { success: false as const, error: "Not authenticated" };

  const supabase = createSupabaseAdminClient();
  
  // Build query
  let query = supabase
    .from("salons")
    .select("id, slug, name, category, address, city, phone, latitude, longitude, location, logo_url, is_verified, rating, review_count, status");

  if (territoryIds.length > 0) {
    // territoryIds might be a mix of UUIDs and "primary-TerritoryName"
    const realIds = territoryIds.filter(id => !id.startsWith("primary-"));
    const primaryNames = territoryIds.filter(id => id.startsWith("primary-")).map(id => id.replace("primary-", ""));
    
    let terrNames: string[] = [...primaryNames];

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
    // If it's a specific category, filter by it. We can do ilike to be safe.
    const orClauses = categories.map(cat => `category.ilike.%${cat}%`).join(",");
    query = query.or(orClauses);
  }

  const { data, error } = await query;

  if (error) {
    return { success: false as const, error: error.message };
  }

  return {
    success: true as const,
    businesses: data || [],
  };
}
