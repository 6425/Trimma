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
  
  // 1. Find the agent's ID
  const { data: agentData, error: agentError } = await supabase
    .from("agents")
    .select("id")
    .eq("user_email", user.email)
    .maybeSingle();

  if (agentError || !agentData?.id) {
    return { success: false as const, error: "Agent not found" };
  }

  // 2. Fetch assigned territories
  const { data: territoryData, error: territoryError } = await supabase
    .from("agent_territories")
    .select("territory_id, territories ( id, name, type, slug )")
    .eq("agent_id", agentData.id);

  if (territoryError) {
    return { success: false as const, error: territoryError.message };
  }

  const territories = (territoryData || []).map((t: any) => t.territories).filter(Boolean);

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
    const { data: terrs } = await supabase.from("territories").select("name").in("id", territoryIds);
    if (terrs && terrs.length > 0) {
      const orClauses = terrs.map(t => `city.ilike.%${t.name}%`).join(",");
      if (orClauses) {
        query = query.or(orClauses);
      }
    }
  }

  if (categories.length > 0 && !categories.includes("All Categories")) {
    query = query.in("category", categories);
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
