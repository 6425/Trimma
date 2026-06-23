export type LoyaltyTierKey = "premium" | "elite" | "royal" | "vip";

export type SalonLoyaltyRule = {
  tier_key: LoyaltyTierKey;
  tier_label: string;
  min_visits: number;
  enabled: boolean;
  sort_order: number;
};

export const DEFAULT_SALON_LOYALTY_RULES: SalonLoyaltyRule[] = [
  { tier_key: "premium", tier_label: "Premium Gold", min_visits: 2, enabled: true, sort_order: 1 },
  { tier_key: "elite", tier_label: "Elite Platinum", min_visits: 5, enabled: true, sort_order: 2 },
  { tier_key: "royal", tier_label: "Royal Diamond", min_visits: 10, enabled: true, sort_order: 3 },
  { tier_key: "vip", tier_label: "VIP", min_visits: 5, enabled: true, sort_order: 4 },
];

export const LOYALTY_RULES_DB_HINT =
  "Loyalty rules could not be loaded. Run packages/db/SALON_LOYALTY_RULES_PATCH.sql in Supabase SQL Editor.";

export function bookingCountsAsLoyaltyVisit(status: string | null | undefined): boolean {
  const normalized = (status || "").toLowerCase();
  return !["cancelled", "canceled", "no_show"].includes(normalized);
}

export function normalizeSalonLoyaltyRules(rows: SalonLoyaltyRule[]): SalonLoyaltyRule[] {
  const byKey = new Map<LoyaltyTierKey, SalonLoyaltyRule>();
  for (const row of rows) {
    if (!row?.tier_key) continue;
    byKey.set(row.tier_key, {
      tier_key: row.tier_key,
      tier_label: row.tier_label || row.tier_key,
      min_visits: Math.max(1, Number(row.min_visits) || 1),
      enabled: row.enabled !== false,
      sort_order: Number(row.sort_order) || 0,
    });
  }

  return DEFAULT_SALON_LOYALTY_RULES.map((fallback) => byKey.get(fallback.tier_key) || fallback).sort(
    (a, b) => a.sort_order - b.sort_order
  );
}

export function resolveHighestDisplayTier(
  visits: number,
  rules: SalonLoyaltyRule[]
): SalonLoyaltyRule | null {
  const enabled = rules
    .filter((rule) => rule.enabled && rule.tier_key !== "vip")
    .sort((a, b) => b.min_visits - a.min_visits);

  return enabled.find((rule) => visits >= rule.min_visits) ?? null;
}

export function resolveVipFromVisits(visits: number, rules: SalonLoyaltyRule[]): boolean {
  const vipRule = rules.find((rule) => rule.tier_key === "vip" && rule.enabled);
  if (!vipRule) return false;
  return visits >= vipRule.min_visits;
}

export function countCustomersPerTier(
  visitCounts: number[],
  rules: SalonLoyaltyRule[]
): Record<LoyaltyTierKey, number> {
  const counts: Record<LoyaltyTierKey, number> = {
    premium: 0,
    elite: 0,
    royal: 0,
    vip: 0,
  };

  for (const visits of visitCounts) {
    if (resolveVipFromVisits(visits, rules)) {
      counts.vip += 1;
    }
    const displayTier = resolveHighestDisplayTier(visits, rules);
    if (displayTier) {
      counts[displayTier.tier_key] += 1;
    }
  }

  return counts;
}

export function buildVisitCountsByEmail(
  bookings: Array<{ customer_email?: string | null; status?: string | null }>
): Record<string, number> {
  const visitCounts: Record<string, number> = {};

  for (const booking of bookings) {
    if (!booking.customer_email) continue;
    if (!bookingCountsAsLoyaltyVisit(booking.status)) continue;
    const email = booking.customer_email.toLowerCase();
    visitCounts[email] = (visitCounts[email] || 0) + 1;
  }

  return visitCounts;
}
