/** Fallback labels when the categories table is empty or still loading. */
export const ADMIN_LEAD_DISCOVERY_CATEGORY_FALLBACKS = [
  "Barber Salon",
  "Beauty Parlours",
  "Bridal & Beauty",
  "Nail Studio",
  "Spa & Wellness",
  "Men's Grooming",
  "hair salon",
  "beauty salon",
  "barber shop",
];

export type AdminLeadCategoryOption = {
  value: string;
  label: string;
};

export function normalizeAdminLeadCategoryOptions(names: string[] | null | undefined): AdminLeadCategoryOption[] {
  const merged = [
    ...new Set([...(names || []).filter(Boolean), ...ADMIN_LEAD_DISCOVERY_CATEGORY_FALLBACKS]),
  ].sort((a, b) => a.localeCompare(b));

  return merged.map((name) => ({ value: name, label: name }));
}
