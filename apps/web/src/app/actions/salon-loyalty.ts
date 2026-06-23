"use server";

import { isSalonDbSuccess, salonDbFailure, withSalonDb } from "@/lib/with-salon-db";
import {
  DEFAULT_SALON_LOYALTY_RULES,
  LOYALTY_RULES_DB_HINT,
  buildVisitCountsByEmail,
  countCustomersPerTier,
  normalizeSalonLoyaltyRules,
  type LoyaltyTierKey,
  type SalonLoyaltyRule,
} from "@/lib/salon-loyalty";

type LoyaltyRuleRow = {
  tier_key: string;
  tier_label: string;
  min_visits: number;
  enabled: boolean;
  sort_order: number;
};

function mapLoyaltyRows(rows: LoyaltyRuleRow[]): SalonLoyaltyRule[] {
  return normalizeSalonLoyaltyRules(
    rows.map((row) => ({
      tier_key: row.tier_key as LoyaltyTierKey,
      tier_label: row.tier_label,
      min_visits: row.min_visits,
      enabled: row.enabled,
      sort_order: row.sort_order,
    }))
  );
}

async function loadOrSeedLoyaltyRules(
  supabase: Parameters<Parameters<typeof withSalonDb>[0]>[0],
  salonId: string
): Promise<SalonLoyaltyRule[]> {
  const { data, error } = await supabase
    .from("salon_loyalty_rules")
    .select("tier_key, tier_label, min_visits, enabled, sort_order")
    .eq("salon_id", salonId)
    .order("sort_order", { ascending: true });

  if (error) {
    if (error.message.toLowerCase().includes("does not exist")) {
      throw new Error(LOYALTY_RULES_DB_HINT);
    }
    throw new Error(error.message);
  }

  if (data && data.length > 0) {
    return mapLoyaltyRows(data as LoyaltyRuleRow[]);
  }

  const now = new Date().toISOString();
  const seedRows = DEFAULT_SALON_LOYALTY_RULES.map((rule) => ({
    salon_id: salonId,
    tier_key: rule.tier_key,
    tier_label: rule.tier_label,
    min_visits: rule.min_visits,
    enabled: rule.enabled,
    sort_order: rule.sort_order,
    updated_at: now,
  }));

  const { data: inserted, error: insertError } = await supabase
    .from("salon_loyalty_rules")
    .insert(seedRows)
    .select("tier_key, tier_label, min_visits, enabled, sort_order");

  if (insertError) throw new Error(insertError.message);
  return mapLoyaltyRows((inserted || []) as LoyaltyRuleRow[]);
}

export async function fetchSalonLoyaltyRules() {
  const result = await withSalonDb(async (supabase, ctx) => {
    const rules = await loadOrSeedLoyaltyRules(supabase, ctx.salonId);
    return { rules };
  });

  if (!isSalonDbSuccess(result)) {
    return salonDbFailure(result, LOYALTY_RULES_DB_HINT);
  }

  return { success: true as const, ...result.data };
}

export type SaveSalonLoyaltyRuleInput = {
  tier_key: LoyaltyTierKey;
  min_visits: number;
  enabled?: boolean;
};

export async function saveSalonLoyaltyRules(updates: SaveSalonLoyaltyRuleInput[]) {
  const result = await withSalonDb(async (supabase, ctx) => {
    const existing = await loadOrSeedLoyaltyRules(supabase, ctx.salonId);
    const updateMap = new Map(updates.map((row) => [row.tier_key, row]));
    const now = new Date().toISOString();

    const rows = existing.map((rule) => {
      const patch = updateMap.get(rule.tier_key);
      const minVisits = Math.max(1, Math.floor(Number(patch?.min_visits ?? rule.min_visits) || 1));
      return {
        salon_id: ctx.salonId,
        tier_key: rule.tier_key,
        tier_label: rule.tier_label,
        min_visits: minVisits,
        enabled: patch?.enabled ?? rule.enabled,
        sort_order: rule.sort_order,
        updated_at: now,
      };
    });

    const { error } = await supabase
      .from("salon_loyalty_rules")
      .upsert(rows, { onConflict: "salon_id,tier_key" });

    if (error) throw new Error(error.message);

    return { rules: mapLoyaltyRows(rows as LoyaltyRuleRow[]) };
  });

  if (!isSalonDbSuccess(result)) {
    return salonDbFailure(result, LOYALTY_RULES_DB_HINT);
  }

  return { success: true as const, ...result.data };
}

export async function fetchSalonCrmPage() {
  const result = await withSalonDb(async (supabase, ctx) => {
    const [bookingsRes, rules] = await Promise.all([
      supabase
        .from("bookings")
        .select("customer_email, amount, status, created_at, booking_date, booking_no")
        .eq("salon_id", ctx.salonId)
        .order("created_at", { ascending: false }),
      loadOrSeedLoyaltyRules(supabase, ctx.salonId),
    ]);

    if (bookingsRes.error) throw new Error(bookingsRes.error.message);

    const bookings = bookingsRes.data || [];
    const visitCountsByEmail = buildVisitCountsByEmail(bookings);
    const tierCounts = countCustomersPerTier(Object.values(visitCountsByEmail), rules);

    const recentActivity = bookings.slice(0, 5).map((booking) => ({
      client: booking.customer_email || "Walk-in Customer",
      note: `Booking ${booking.booking_no || "—"} · LKR ${booking.amount ?? 0} · ${booking.status}`,
      date: new Date(booking.created_at).toLocaleDateString(),
    }));

    return {
      rules,
      tierCounts,
      totalClients: Object.keys(visitCountsByEmail).length,
      recentActivity,
    };
  });

  if (!isSalonDbSuccess(result)) {
    return salonDbFailure(result, LOYALTY_RULES_DB_HINT);
  }

  return { success: true as const, ...result.data };
}
