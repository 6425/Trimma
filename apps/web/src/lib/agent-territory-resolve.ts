import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeEmail } from "@/lib/normalize-email";
import { findAuthUserIdByEmail } from "@/lib/sync-user-role";

export type AgentTerritoryItem = {
  id: string;
  name: string;
  type?: string;
  slug?: string;
};

export type AgentRow = {
  id: string;
  territory?: string | null;
  territory_id?: string | null;
  commission_rate?: number | null;
} | null;

function pushTerritory(
  territories: AgentTerritoryItem[],
  item: { id?: string; name?: string; type?: string; slug?: string }
) {
  if (!item.name) return;
  if (territories.some((t) => t.name === item.name)) return;
  territories.push({
    id: item.id || `primary-${item.name}`,
    name: item.name,
    type: item.type,
    slug: item.slug,
  });
}

/** Find agents row by user_id (preferred) or user_email per DB schema. */
export async function findAgentRecord(
  supabase: SupabaseClient,
  email: string,
  userId?: string | null
): Promise<AgentRow> {
  const selectAgent = async (
    filter: { column: "user_id" | "user_email"; value: string; ilike?: boolean }
  ): Promise<AgentRow> => {
    let query = supabase.from("agents").select("id, territory, territory_id, commission_rate");
    query = filter.ilike
      ? query.ilike(filter.column, filter.value)
      : query.eq(filter.column, filter.value);
    const { data, error } = await query.maybeSingle();
    if (error || !data?.id) return null;
    return data;
  };

  if (userId) {
    const byUserId = await selectAgent({ column: "user_id", value: userId });
    if (byUserId) return byUserId;
  }

  const normalized = normalizeEmail(email);
  if (!normalized) return null;

  const byEmail = await selectAgent({ column: "user_email", value: normalized });
  if (byEmail) return byEmail;

  return selectAgent({ column: "user_email", value: normalized, ilike: true });
}

/**
 * Build territory list per schema:
 * agent_territories → territories, agents.territory_id, agents.territory text,
 * then province/district/city from salons.assign_to.
 */
export async function buildAgentTerritories(
  supabase: SupabaseClient,
  email: string,
  agentRow: AgentRow
): Promise<AgentTerritoryItem[]> {
  const territories: AgentTerritoryItem[] = [];
  const agentId = agentRow?.id;

  if (agentId) {
    const { data: territoryData } = await supabase
      .from("agent_territories")
      .select("territory_id, territories ( id, name, type, slug )")
      .eq("agent_id", agentId);

    if (territoryData?.length) {
      territoryData.forEach((t) => {
        const terr = t.territories as
          | { id?: string; name?: string; type?: string; slug?: string }
          | { id?: string; name?: string; type?: string; slug?: string }[]
          | null;
        const row = Array.isArray(terr) ? terr[0] : terr;
        pushTerritory(territories, row || {});
      });
    }
  }

  if (agentRow?.territory_id) {
    const { data: linked } = await supabase
      .from("territories")
      .select("id, name, type, slug")
      .eq("id", agentRow.territory_id)
      .maybeSingle();
    if (linked) pushTerritory(territories, linked);
  }

  if (agentRow?.territory) {
    agentRow.territory
      .split(",")
      .map((n) => n.trim())
      .filter(Boolean)
      .forEach((name) => {
        pushTerritory(territories, { id: `primary-${name}`, name, type: "primary" });
      });
  }

  if (territories.length === 0) {
    const normalized = normalizeEmail(email) || email;
    const { data: salons } = await supabase
      .from("salons")
      .select("province, district, city")
      .or(`assign_to.eq.${normalized},assign_to.ilike.${normalized}`);

    const regionNames = new Set<string>();
    for (const salon of salons || []) {
      for (const part of [salon.city, salon.district, salon.province]) {
        const trimmed = part?.trim();
        if (trimmed) regionNames.add(trimmed);
      }
    }

    regionNames.forEach((name) => {
      pushTerritory(territories, { id: `primary-${name}`, name, type: "assigned" });
    });
  }

  return territories;
}

export function formatAgentTerritoryLabel(territories: AgentTerritoryItem[]): string {
  if (!territories.length) return "No territory assigned";
  return territories.map((t) => t.name).join(" · ");
}

export function resolveAgentMapAgentId(email: string, agentRow: AgentRow): string {
  return agentRow?.id || `virtual-${email}`;
}

/** Ensure agents row exists (server/admin). Links user_id + user_email from schema. */
export async function ensureAgentRecord(
  supabase: SupabaseClient,
  email: string,
  userId?: string | null
): Promise<AgentRow> {
  const resolvedUserId =
    userId || (await findAuthUserIdByEmail(supabase, email));
  const existing = await findAgentRecord(supabase, email, resolvedUserId);
  if (existing?.id) {
    if (resolvedUserId) {
      await supabase
        .from("agents")
        .update({
          user_id: resolvedUserId,
          user_email: normalizeEmail(email) || email,
        })
        .eq("id", existing.id);
    }
    return existing;
  }

  const { data: created, error: insertError } = await supabase
    .from("agents")
    .insert({
      user_id: resolvedUserId || null,
      user_email: normalizeEmail(email) || email,
      status: "active",
      commission_rate: 10,
    })
    .select("id, territory, territory_id")
    .single();

  if (insertError) {
    return findAgentRecord(supabase, email, resolvedUserId);
  }

  return created;
}

/** Territory name tokens for map search (city/province/district/address). */
export function territorySearchOrClause(names: string[]): string | null {
  const clauses: string[] = [];
  for (const name of names) {
    const safe = name.replace(/[%_]/g, "");
    if (!safe) continue;
    clauses.push(
      `city.ilike.%${safe}%`,
      `district.ilike.%${safe}%`,
      `province.ilike.%${safe}%`,
      `address.ilike.%${safe}%`
    );
  }
  return clauses.length ? clauses.join(",") : null;
}
