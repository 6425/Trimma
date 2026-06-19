import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeEmail } from "@/lib/normalize-email";
import {
  SRI_LANKA_PROVINCES,
  slugifyLocation,
  type SriLankaDistrict,
  type SriLankaProvince,
} from "@/lib/sri-lanka-locations";
import { findAuthUserIdByEmail } from "@/lib/sync-user-role";

export type TerritorySearchScope = {
  label: string;
  provinceNames: string[];
  districtNames: string[];
  cityNames: string[];
};

type GeoHaystackBusiness = {
  name?: string | null;
  address?: string | null;
  city?: string | null;
  district?: string | null;
  province?: string | null;
  location?: string | null;
};

function scopeFromProvince(province: SriLankaProvince, label: string): TerritorySearchScope {
  return {
    label,
    provinceNames: [province.name],
    districtNames: province.districts.map((d) => d.name),
    cityNames: province.districts.flatMap((d) => d.cities),
  };
}

function scopeFromDistrict(
  province: SriLankaProvince,
  district: SriLankaDistrict,
  label: string
): TerritorySearchScope {
  return {
    label,
    provinceNames: [province.name],
    districtNames: [district.name],
    cityNames: district.cities,
  };
}

function normalizeTerritoryToken(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Map an assigned territory label to canonical Sri Lanka province/district/city tokens. */
export function resolveTerritorySearchScope(territoryName: string): TerritorySearchScope | null {
  const normalized = normalizeTerritoryToken(territoryName);
  if (!normalized) return null;

  for (const province of SRI_LANKA_PROVINCES) {
    const provinceTokens = [
      normalizeTerritoryToken(province.name),
      normalizeTerritoryToken(province.shortName),
      normalizeTerritoryToken(province.dbSlug.replace(/-/g, " ")),
    ];
    if (provinceTokens.includes(normalized)) {
      return scopeFromProvince(province, territoryName);
    }
  }

  const provinceMatches = SRI_LANKA_PROVINCES.filter((province) => {
    const full = normalizeTerritoryToken(province.name);
    const short = normalizeTerritoryToken(province.shortName);
    return normalized.includes(full) || full.includes(normalized) || normalized === short;
  }).sort((a, b) => b.name.length - a.name.length);

  if (provinceMatches.length > 0) {
    const best = provinceMatches[0];
    const runnerUp = provinceMatches[1];
    if (!runnerUp || best.name.length > runnerUp.name.length) {
      return scopeFromProvince(best, territoryName);
    }
  }

  for (const province of SRI_LANKA_PROVINCES) {
    for (const district of province.districts) {
      const districtToken = normalizeTerritoryToken(district.name);
      const districtSlug = slugifyLocation(district.name);
      if (
        normalized === districtToken ||
        slugifyLocation(normalized) === districtSlug ||
        normalized.includes(districtToken)
      ) {
        return scopeFromDistrict(province, district, territoryName);
      }

      for (const city of district.cities) {
        const cityToken = normalizeTerritoryToken(city);
        if (normalized === cityToken || normalized.includes(cityToken)) {
          return scopeFromDistrict(province, district, territoryName);
        }
      }
    }
  }

  return null;
}

export function buildTerritorySearchScopes(territoryNames: string[]): TerritorySearchScope[] {
  const scopes: TerritorySearchScope[] = [];
  for (const name of territoryNames) {
    const scope = resolveTerritorySearchScope(name);
    if (scope) {
      scopes.push(scope);
      continue;
    }

    const safe = name.replace(/[%_]/g, "").trim();
    if (safe) {
      scopes.push({
        label: safe,
        provinceNames: [safe],
        districtNames: [safe],
        cityNames: [safe],
      });
    }
  }
  return scopes;
}

function haystackIncludesToken(haystack: string, token: string): boolean {
  const normalizedToken = normalizeTerritoryToken(token);
  if (!normalizedToken) return false;
  if (haystack.includes(normalizedToken)) return true;

  const slugToken = slugifyLocation(token).replace(/-/g, " ");
  return slugToken.length > 0 && haystack.includes(slugToken);
}

function provinceMatchesHaystack(haystack: string, provinceName: string): boolean {
  const normalizedProvince = normalizeTerritoryToken(provinceName);

  if (normalizedProvince === "central province") {
    return haystack.includes("central province") && !haystack.includes("north central");
  }
  if (normalizedProvince === "north central province") {
    return haystack.includes("north central");
  }
  if (normalizedProvince === "north western province") {
    return haystack.includes("north western") || haystack.includes("north-western");
  }

  return haystackIncludesToken(haystack, provinceName);
}

export function businessMatchesTerritoryScopes(
  business: GeoHaystackBusiness,
  scopes: TerritorySearchScope[]
): boolean {
  if (scopes.length === 0) return true;

  const haystack = normalizeTerritoryToken(
    `${business.province || ""} ${business.district || ""} ${business.city || ""} ${business.address || ""} ${business.location || ""}`
  );

  return scopes.some((scope) => {
    if (scope.provinceNames.some((name) => provinceMatchesHaystack(haystack, name))) {
      return true;
    }
    if (scope.districtNames.some((name) => haystackIncludesToken(haystack, name))) {
      return true;
    }
    if (scope.cityNames.some((name) => haystackIncludesToken(haystack, name))) {
      return true;
    }
    return haystackIncludesToken(haystack, scope.label);
  });
}

export function territorySearchOrClause(names: string[]): string | null {
  const scopes = buildTerritorySearchScopes(names);
  const clauses: string[] = [];

  for (const scope of scopes) {
    if (scope.districtNames.length > 0) {
      const districtList = scope.districtNames.map((name) => `"${name.replace(/"/g, "")}"`).join(",");
      clauses.push(`district.in.(${districtList})`);
    }
    for (const cityName of scope.cityNames) {
      const safe = cityName.replace(/[%_,"]/g, "");
      if (safe) clauses.push(`city.ilike.%${safe}%`);
    }
    for (const provinceName of scope.provinceNames) {
      const safe = provinceName.replace(/[%_,"]/g, "");
      if (safe) clauses.push(`province.ilike.%${safe}%`);
    }
  }

  return clauses.length ? [...new Set(clauses)].join(",") : null;
}

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
