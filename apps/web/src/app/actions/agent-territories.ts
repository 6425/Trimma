"use server";

import { adminDbFailure, isAdminDbSuccess, withAdminDb } from "@/lib/with-admin-db";
import {
  denormalizeAgentTerritoryFields,
  resolveAgentIdByEmail,
} from "@/lib/agent-territory-admin-sync";

export async function fetchTerritoriesCatalog() {
  const result = await withAdminDb(async (supabase) => {
    const { data, error } = await supabase
      .from("territories")
      .select("id, name, type, slug, parent_id")
      .order("name");
    if (error) throw new Error(error.message);
    return { territories: data || [] };
  });

  if (!isAdminDbSuccess(result)) return adminDbFailure(result);
  return { success: true as const, territories: result.data.territories };
}

export async function assignAgentTerritory(agentEmail: string, territoryId: string) {
  if (!agentEmail?.trim() || !territoryId) {
    return { success: false as const, error: "Agent email and territory are required." };
  }

  const result = await withAdminDb(async (supabase) => {
    const agentId = await resolveAgentIdByEmail(supabase, agentEmail.trim());
    const { error } = await supabase.from("agent_territories").insert({
      agent_id: agentId,
      territory_id: territoryId,
    });
    if (error) {
      if (error.code === "23505") {
        throw new Error("This territory is already assigned to that agent.");
      }
      throw new Error(error.message);
    }
    await denormalizeAgentTerritoryFields(supabase, agentId);
  });

  if (!isAdminDbSuccess(result)) return adminDbFailure(result);
  return { success: true as const };
}

export async function removeAgentTerritory(agentEmail: string, territoryId: string) {
  if (!agentEmail?.trim() || !territoryId) {
    return { success: false as const, error: "Agent email and territory are required." };
  }

  const result = await withAdminDb(async (supabase) => {
    const agentId = await resolveAgentIdByEmail(supabase, agentEmail.trim());
    const { error } = await supabase
      .from("agent_territories")
      .delete()
      .eq("agent_id", agentId)
      .eq("territory_id", territoryId);
    if (error) throw new Error(error.message);
    await denormalizeAgentTerritoryFields(supabase, agentId);
  });

  if (!isAdminDbSuccess(result)) return adminDbFailure(result);
  return { success: true as const };
}

export async function syncAgentTerritories(agentEmail: string, territoryIds: string[]) {
  if (!agentEmail?.trim()) {
    return { success: false as const, error: "Agent email is required." };
  }

  const uniqueIds = [...new Set((territoryIds || []).filter(Boolean))];

  const result = await withAdminDb(async (supabase) => {
    const agentId = await resolveAgentIdByEmail(supabase, agentEmail.trim());

    const { data: currentRows, error: fetchError } = await supabase
      .from("agent_territories")
      .select("territory_id")
      .eq("agent_id", agentId);

    if (fetchError) throw new Error(fetchError.message);

    const currentIds = new Set((currentRows || []).map((row) => row.territory_id as string));
    const nextIds = new Set(uniqueIds);

    const toRemove = [...currentIds].filter((id) => !nextIds.has(id));
    const toAdd = [...nextIds].filter((id) => !currentIds.has(id));

    if (toRemove.length > 0) {
      const { error } = await supabase
        .from("agent_territories")
        .delete()
        .eq("agent_id", agentId)
        .in("territory_id", toRemove);
      if (error) throw new Error(error.message);
    }

    if (toAdd.length > 0) {
      const { error } = await supabase.from("agent_territories").insert(
        toAdd.map((territory_id) => ({
          agent_id: agentId,
          territory_id,
        }))
      );
      if (error) throw new Error(error.message);
    }

    await denormalizeAgentTerritoryFields(supabase, agentId);
  });

  if (!isAdminDbSuccess(result)) return adminDbFailure(result);
  return { success: true as const };
}
