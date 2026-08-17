/** Fallback labels when the categories table is empty or still loading. */
export const ADMIN_LEAD_DISCOVERY_CATEGORY_FALLBACKS = [
  "Barber Salon",
  "Bridal & Beauty",
  "Nail Studio",
  "Spa & Wellness",
  "Men's Grooming",
  "Skincare Clinics",
  "Tattoo Studio",
  "Yoga Studio",
];

const RETIRED_LEAD_CATEGORY_NAMES = new Set([
  "beauty parlours",
  "beauty parlors",
  "kids family",
  "kids and family",
]);

function isRetiredLeadCategoryName(name: string): boolean {
  const key = name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  return RETIRED_LEAD_CATEGORY_NAMES.has(key);
}

export type AdminLeadCategoryOption = {
  value: string;
  label: string;
};

export function normalizeAdminLeadCategoryOptions(names: string[] | null | undefined): AdminLeadCategoryOption[] {
  const fromDb = [...new Set((names || []).filter(Boolean))].filter((name) => !isRetiredLeadCategoryName(name));
  const source = fromDb.length ? fromDb : ADMIN_LEAD_DISCOVERY_CATEGORY_FALLBACKS;
  const merged = [...new Set(source)].sort((a, b) => a.localeCompare(b));

  return merged.map((name) => ({ value: name, label: name }));
}
