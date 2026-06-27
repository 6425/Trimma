import { toDateInputValue } from "@/lib/promotion-package-dates";
import { isDummySalonRecord } from "@/lib/salon-list-filters";

function formatLocalDateInput(now = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export type DealSalon = {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  district: string | null;
  province: string | null;
  category: string | null;
  logo_url: string | null;
  status: string | null;
  is_verified: boolean | null;
  public_visibility: string | null;
};

export type SalonDealRow = {
  id: string;
  salon_id: string;
  name: string;
  description: string | null;
  package_price: number;
  original_price: number;
  included_services: string[];
  start_date: string | null;
  end_date: string | null;
  status: string | null;
  promotion_type: string | null;
  promotion_type_id: string | null;
  image_url: string | null;
  salon: DealSalon | null;
};

export type CategoryOption = {
  id: string;
  name: string;
  slug: string;
};

export function parseIncludedServices(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  return [];
}

export function isSalonPubliclyVisible(salon: DealSalon | null | undefined): boolean {
  if (!salon?.slug) return false;
  if (isDummySalonRecord(salon)) return false;
  if (salon.public_visibility === "hidden") return false;
  return salon.status === "active" || salon.status === "verified" || salon.is_verified === true;
}

export function isDealCurrentlyActive(
  startDate: string | null | undefined,
  endDate: string | null | undefined,
  now = new Date()
): boolean {
  const today = formatLocalDateInput(now);
  const start = startDate ? toDateInputValue(startDate) : null;
  const end = endDate ? toDateInputValue(endDate) : null;
  if (start && today < start) return false;
  if (end && today > end) return false;
  return true;
}

export function isPublishedDeal(
  deal: Pick<SalonDealRow, "status" | "start_date" | "end_date" | "salon">,
  now = new Date()
): boolean {
  if ((deal.status || "").toLowerCase() !== "active") return false;
  if (!isSalonPubliclyVisible(deal.salon)) return false;
  return isDealCurrentlyActive(deal.start_date, deal.end_date, now);
}

export type SalonPromotionPackage = {
  id: string;
  name: string;
  description: string | null;
  package_price: number;
  original_price: number;
  included_services: string[];
  start_date: string | null;
  end_date: string | null;
  status: string | null;
  promotion_type: string | null;
  image_url: string | null;
};

export function isActivePromotionPackage(
  pkg: Pick<SalonPromotionPackage, "status" | "start_date" | "end_date">,
  now = new Date()
): boolean {
  if ((pkg.status || "").toLowerCase() !== "active") return false;
  return isDealCurrentlyActive(pkg.start_date, pkg.end_date, now);
}

export function mapSalonPromotionRows(packages: any[]): SalonPromotionPackage[] {
  return packages
    .map((pkg) => ({
      id: pkg.id,
      name: pkg.name,
      description: pkg.description ?? null,
      package_price: Number(pkg.package_price ?? 0),
      original_price: Number(pkg.original_price ?? 0),
      included_services: parseIncludedServices(pkg.included_services),
      start_date: pkg.start_date ?? null,
      end_date: pkg.end_date ?? null,
      status: pkg.status ?? null,
      promotion_type: pkg.promotion_type ?? null,
      image_url: typeof pkg.image_url === "string" && pkg.image_url.trim() ? pkg.image_url.trim() : null,
    }))
    .filter((pkg) => isActivePromotionPackage(pkg));
}

export function resolveServiceIdsFromNames(
  includedNames: string[],
  services: Array<{ id: string; name: string }>
): string[] {
  const ids: string[] = [];
  for (const name of includedNames) {
    const match = services.find(
      (service) => service.name.toLowerCase().trim() === name.toLowerCase().trim()
    );
    if (match && !ids.includes(match.id)) {
      ids.push(match.id);
    }
  }
  return ids;
}

export function getDealLocationLabel(salon: DealSalon | null | undefined): string {
  if (!salon) return "Sri Lanka";
  return [salon.city, salon.district, salon.province].filter(Boolean).join(", ") || "Sri Lanka";
}

export function getDealLocationKey(salon: DealSalon | null | undefined): string {
  if (!salon) return "other";
  return (salon.city || salon.district || salon.province || "Other").trim();
}

export function normalizeDealRows(
  packages: any[],
  salonsById: Map<string, DealSalon>
): SalonDealRow[] {
  return packages
    .map((pkg) => {
      const salon = salonsById.get(pkg.salon_id) || null;
      return {
        id: pkg.id,
        salon_id: pkg.salon_id,
        name: pkg.name,
        description: pkg.description ?? null,
        package_price: Number(pkg.package_price ?? 0),
        original_price: Number(pkg.original_price ?? 0),
        included_services: parseIncludedServices(pkg.included_services),
        start_date: pkg.start_date ?? null,
        end_date: pkg.end_date ?? null,
        status: pkg.status ?? null,
        promotion_type: pkg.promotion_type ?? null,
        promotion_type_id: pkg.promotion_type_id ?? null,
        image_url: typeof pkg.image_url === "string" && pkg.image_url.trim() ? pkg.image_url.trim() : null,
        salon,
      } satisfies SalonDealRow;
    })
    .filter((deal) => isPublishedDeal(deal));
}

export function groupDealsByLocation(deals: SalonDealRow[]): Record<string, SalonDealRow[]> {
  const groups: Record<string, SalonDealRow[]> = {};
  for (const deal of deals) {
    const key = getDealLocationKey(deal.salon);
    if (!groups[key]) groups[key] = [];
    groups[key].push(deal);
  }
  return Object.fromEntries(
    Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
  );
}

export function getDealDiscountPercent(
  deal: Pick<SalonDealRow, "original_price" | "package_price">
): number {
  if (deal.original_price <= 0 || deal.package_price >= deal.original_price) return 0;
  return Math.round(((deal.original_price - deal.package_price) / deal.original_price) * 100);
}

export function pickTopDiscountDeals(deals: SalonDealRow[], limit = 4): SalonDealRow[] {
  return [...deals]
    .sort((a, b) => getDealDiscountPercent(b) - getDealDiscountPercent(a))
    .slice(0, limit);
}
