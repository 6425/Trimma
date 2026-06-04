import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeEmail } from "@/lib/normalize-email";

/** Mirror agent_territories → agents.territory + agents.territory_id (legacy columns). */
export async function denormalizeAgentTerritoryFields(
  supabase: SupabaseClient,
  agentId: string
): Promise<void> {
  const { data: rows, error } = await supabase
    .from("agent_territories")
    .select("territory_id, created_at, territories ( id, name )")
    .eq("agent_id", agentId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  const names: string[] = [];
  let primaryTerritoryId: string | null = null;

  for (const row of rows || []) {
    const terr = row.territories as
      | { id?: string; name?: string }
      | { id?: string; name?: string }[]
      | null;
    const t = Array.isArray(terr) ? terr[0] : terr;
    if (t?.name && !names.includes(t.name)) names.push(t.name);
    if (!primaryTerritoryId && row.territory_id) {
      primaryTerritoryId = row.territory_id as string;
    }
  }

  const { error: updateError } = await supabase
    .from("agents")
    .update({
      territory: names.length > 0 ? names.join(", ") : null,
      territory_id: primaryTerritoryId,
    })
    .eq("id", agentId);

  if (updateError) throw new Error(updateError.message);
}

export async function resolveAgentIdByEmail(
  supabase: SupabaseClient,
  agentEmail: string
): Promise<string> {
  const normalized = normalizeEmail(agentEmail);
  if (!normalized) throw new Error("Agent email is required.");

  const { data, error } = await supabase
    .from("agents")
    .select("id")
    .eq("user_email", normalized)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data?.id) {
    throw new Error(
      `No agent profile found for ${normalized}. Save agent credentials in Admin → Agents first.`
    );
  }

  return data.id as string;
}
