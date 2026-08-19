export const FEATURED_TIMEZONE = "Asia/Colombo";

export function todayInFeaturedTimezone(now = new Date()): string {
  return now.toLocaleDateString("en-CA", { timeZone: FEATURED_TIMEZONE });
}

export function parseFeaturedDate(value: unknown): string | null {
  const match = String(value || "")
    .trim()
    .match(/^(\d{4}-\d{2}-\d{2})/);
  return match?.[1] || null;
}

export function isValidFeaturedPeriod(startsAt: unknown, endsAt: unknown): boolean {
  const start = parseFeaturedDate(startsAt);
  const end = parseFeaturedDate(endsAt);
  return Boolean(start && end && start <= end);
}

export function isFeaturedPeriodActive(
  startsAt: unknown,
  endsAt: unknown,
  today = todayInFeaturedTimezone()
): boolean {
  const start = parseFeaturedDate(startsAt);
  const end = parseFeaturedDate(endsAt);
  if (!start || !end) return false;
  return start <= today && today <= end;
}

export type FeaturedListingStatus = "live" | "scheduled" | "expired" | "off";

export function featuredListingStatus(input: {
  is_featured?: boolean | null;
  featured_starts_at?: unknown;
  featured_ends_at?: unknown;
  today?: string;
}): FeaturedListingStatus {
  if (input.is_featured !== true) return "off";
  const start = parseFeaturedDate(input.featured_starts_at);
  const end = parseFeaturedDate(input.featured_ends_at);
  if (!start || !end) return "expired";
  const today = input.today || todayInFeaturedTimezone();
  if (today < start) return "scheduled";
  if (today > end) return "expired";
  return "live";
}

export function isListingFeaturedNow(item: {
  is_featured?: boolean | null;
  isFeatured?: boolean | null;
  featured?: boolean | null;
  featured_starts_at?: unknown;
  featured_ends_at?: unknown;
  featuredStartsAt?: unknown;
  featuredEndsAt?: unknown;
}): boolean {
  const start = item.featured_starts_at ?? item.featuredStartsAt;
  const end = item.featured_ends_at ?? item.featuredEndsAt;
  const hasPeriod = Boolean(parseFeaturedDate(start) && parseFeaturedDate(end));

  if (item.is_featured === true) {
    return isFeaturedPeriodActive(start, end);
  }
  if (hasPeriod) {
    const flagged = item.isFeatured === true || item.featured === true;
    return flagged && isFeaturedPeriodActive(start, end);
  }
  // Mapped UI cards may only carry the already-evaluated featured flag.
  return item.isFeatured === true || item.featured === true;
}

export function formatFeaturedDateRange(startsAt: unknown, endsAt: unknown): string | null {
  const start = parseFeaturedDate(startsAt);
  const end = parseFeaturedDate(endsAt);
  if (!start || !end) return null;
  const format = (value: string) =>
    new Date(`${value}T00:00:00`).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  if (start === end) return format(start);
  return `${format(start)} – ${format(end)}`;
}
