import type { SupabaseClient } from "@supabase/supabase-js";

export type SalonDuplicateRow = Record<string, unknown> & {
  id?: string;
  name?: string | null;
  city?: string | null;
  district?: string | null;
  province?: string | null;
  address?: string | null;
  phone?: string | null;
  place_id?: string | null;
  onboarding_status?: string | null;
  source_type?: string | null;
  booking_enabled?: boolean | null;
  is_verified?: boolean | null;
  public_visibility?: unknown;
  created_at?: string | null;
  business_info_extended?: unknown;
};

export type DiscoveryDedupStats = {
  created: number;
  updated: number;
  merged: number;
  removed: number;
  skipped: number;
};

export function normalizeSalonNameKey(name: string | null | undefined): string {
  return String(name || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function normalizePhoneKey(phone: string | null | undefined): string {
  return String(phone || "").replace(/\D/g, "").slice(-9);
}

export function normalizeAddressKey(address: string | null | undefined): string {
  return String(address || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function isRealGooglePlaceId(placeId: string | null | undefined): boolean {
  const value = String(placeId || "").trim();
  if (!value) return false;
  if (isSyntheticPlaceId(value)) return false;
  return value.startsWith("ChI") || value.length >= 20;
}

export function isSyntheticPlaceId(placeId: string | null | undefined): boolean {
  const value = String(placeId || "").trim();
  if (!value) return true;
  return /^(csv_|manual_|diag_|temp_|onboarding_|google_)/i.test(value);
}

export function readStoredGooglePlaceId(row: SalonDuplicateRow): string | null {
  const direct = String(row.place_id || "").trim();
  if (direct && isRealGooglePlaceId(direct)) return direct;

  const ext = row.business_info_extended;
  if (ext && typeof ext === "object" && !Array.isArray(ext)) {
    const nested = String((ext as Record<string, unknown>).google_place_id || "").trim();
    if (nested && isRealGooglePlaceId(nested)) return nested;
  }

  return direct || null;
}

export function buildSalonIdentityKey(row: {
  name?: string | null;
  city?: string | null;
  district?: string | null;
  phone?: string | null;
  address?: string | null;
}): string | null {
  const name = normalizeSalonNameKey(row.name);
  if (!name || name === "unnamed salon") return null;

  const location = normalizeSalonNameKey(row.city) || normalizeSalonNameKey(row.district);
  if (!location) return null;

  const phone = normalizePhoneKey(row.phone);
  if (phone.length >= 9) {
    return `${name}|${location}|phone:${phone}`;
  }

  const address = normalizeAddressKey(row.address);
  if (address.length >= 12) {
    return `${name}|${location}|addr:${address.slice(0, 48)}`;
  }

  return `${name}|${location}`;
}

export function dedupeGooglePlacesByPlaceId<T extends { place?: { place_id?: string } }>(
  entries: T[]
): T[] {
  const seen = new Set<string>();
  const deduped: T[] = [];

  for (const entry of entries) {
    const placeId = entry.place?.place_id?.trim();
    if (!placeId) continue;
    if (seen.has(placeId)) continue;
    seen.add(placeId);
    deduped.push(entry);
  }

  return deduped;
}

export function scoreSalonRowForCanonical(row: SalonDuplicateRow): number {
  let score = 0;

  if (isRealGooglePlaceId(readStoredGooglePlaceId(row))) score += 100;
  if (row.is_verified) score += 80;
  if (row.booking_enabled) score += 60;

  const visibility = String(row.public_visibility || "").toLowerCase();
  if (visibility === "public" || visibility === "preview") score += 40;

  const status = String(row.onboarding_status || "");
  if (status && status !== "DISCOVERED") score += 30;
  if (status === "VERIFIED" || status === "LISTING_PUBLISHED") score += 20;

  const ownerEmail = String(row.owner_email || "");
  if (ownerEmail && !ownerEmail.startsWith("draft-")) score += 25;

  if (row.phone) score += 10;
  if (row.address) score += 5;
  if (row.rating) score += 2;

  if (row.created_at) {
    score += Math.max(0, 5 - Math.min(5, Math.floor((Date.now() - Date.parse(row.created_at)) / 86400000 / 30)));
  }

  return score;
}

export function pickCanonicalSalonRow(rows: SalonDuplicateRow[]): SalonDuplicateRow {
  return [...rows].sort((a, b) => scoreSalonRowForCanonical(b) - scoreSalonRowForCanonical(a))[0];
}

export function indexSalonsForDiscoveryDedup(rows: SalonDuplicateRow[]) {
  const byPlaceId = new Map<string, SalonDuplicateRow>();
  const byIdentity = new Map<string, SalonDuplicateRow[]>();

  for (const row of rows) {
    const placeId = readStoredGooglePlaceId(row);
    if (placeId) {
      const existing = byPlaceId.get(placeId);
      if (!existing || scoreSalonRowForCanonical(row) > scoreSalonRowForCanonical(existing)) {
        byPlaceId.set(placeId, row);
      }
    }

    const identity = buildSalonIdentityKey(row);
    if (identity) {
      const bucket = byIdentity.get(identity) || [];
      bucket.push(row);
      byIdentity.set(identity, bucket);
    }
  }

  return { byPlaceId, byIdentity };
}

export function resolveExistingSalonMatch(
  incoming: SalonDuplicateRow,
  indexes: ReturnType<typeof indexSalonsForDiscoveryDedup>
): SalonDuplicateRow | null {
  const placeId = readStoredGooglePlaceId(incoming);
  if (placeId && indexes.byPlaceId.has(placeId)) {
    return indexes.byPlaceId.get(placeId)!;
  }

  const identity = buildSalonIdentityKey(incoming);
  if (!identity) return null;

  const matches = indexes.byIdentity.get(identity) || [];
  if (!matches.length) return null;

  return pickCanonicalSalonRow(matches);
}

export async function loadSalonDuplicateCandidates(
  supabase: SupabaseClient,
  context: { province?: string | null; district?: string | null; city?: string | null },
  placeIds: string[]
): Promise<SalonDuplicateRow[]> {
  const queries: Promise<{ data: SalonDuplicateRow[] | null; error: unknown }>[] = [];

  if (placeIds.length) {
    queries.push(
      Promise.resolve(
        supabase
          .from("salons")
          .select("*")
          .in("place_id", placeIds)
          .then(({ data, error }) => ({ data: (data || []) as SalonDuplicateRow[], error }))
      )
    );
  }

  if (context.district) {
    queries.push(
      Promise.resolve(
        supabase
          .from("salons")
          .select("*")
          .eq("district", context.district)
          .then(({ data, error }) => ({ data: (data || []) as SalonDuplicateRow[], error }))
      )
    );
  } else if (context.city) {
    queries.push(
      Promise.resolve(
        supabase
          .from("salons")
          .select("*")
          .ilike("city", context.city)
          .then(({ data, error }) => ({ data: (data || []) as SalonDuplicateRow[], error }))
      )
    );
  }

  const results = await Promise.all(queries);
  for (const result of results) {
    if (result.error) throw result.error;
  }

  const merged = new Map<string, SalonDuplicateRow>();
  for (const result of results) {
    for (const row of result.data || []) {
      if (row.id) merged.set(String(row.id), row);
    }
  }

  return [...merged.values()];
}

async function salonHasBlockingReferences(supabase: SupabaseClient, salonId: string): Promise<boolean> {
  const checks = await Promise.all([
    supabase.from("bookings").select("id", { count: "exact", head: true }).eq("salon_id", salonId),
    supabase.from("services").select("id", { count: "exact", head: true }).eq("salon_id", salonId),
    supabase.from("salon_staff").select("id", { count: "exact", head: true }).eq("salon_id", salonId),
  ]);

  return checks.some((result) => (result.count || 0) > 0);
}

export async function removeDuplicateSalonRows(
  supabase: SupabaseClient,
  rows: SalonDuplicateRow[]
): Promise<number> {
  const groups = new Map<string, SalonDuplicateRow[]>();

  for (const row of rows) {
    const identity = buildSalonIdentityKey(row);
    const placeId = readStoredGooglePlaceId(row);
    const groupKey = identity
      ? `identity:${identity}`
      : placeId
        ? `place:${placeId}`
        : null;
    if (!groupKey) continue;

    const bucket = groups.get(groupKey) || [];
    bucket.push(row);
    groups.set(groupKey, bucket);
  }

  let removed = 0;

  for (const group of groups.values()) {
    if (group.length < 2) continue;

    const canonical = pickCanonicalSalonRow(group);
    const canonicalId = String(canonical.id || "");
    if (!canonicalId) continue;

    const duplicates = group.filter((row) => String(row.id) !== canonicalId);
    for (const duplicate of duplicates) {
      const duplicateId = String(duplicate.id || "");
      if (!duplicateId) continue;

      const blocked = await salonHasBlockingReferences(supabase, duplicateId);
      if (blocked) {
        await supabase
          .from("salons")
          .update({
            status: "inactive",
            public_visibility: "hidden",
            admin_notes: `Merged duplicate of ${canonical.name || "canonical salon"} (${canonicalId}).`,
          })
          .eq("id", duplicateId);
        removed += 1;
        continue;
      }

      const { error } = await supabase.from("salons").delete().eq("id", duplicateId);
      if (!error) removed += 1;
    }
  }

  return removed;
}
