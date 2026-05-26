import {
  resolveServiceIdsFromNames,
  type SalonPromotionPackage,
} from "@/lib/deals";

type BookableService = {
  id: string;
  name: string;
  duration?: number | string | null;
  duration_min?: number | string | null;
};

export type PromotionBookingResolution = {
  serviceIds: string[];
  anchorServiceId: string | null;
  durationMinutes: number;
  usedAnchor: boolean;
};

function resolveFuzzyServiceIds(
  includedNames: string[],
  services: Array<{ id: string; name: string }>
): string[] {
  const ids: string[] = [];

  for (const included of includedNames) {
    const needle = included.toLowerCase().trim();
    if (!needle) continue;

    const match = services.find((service) => {
      const haystack = service.name.toLowerCase().trim();
      return haystack === needle || haystack.includes(needle) || needle.includes(haystack);
    });

    if (match && !ids.includes(match.id)) {
      ids.push(match.id);
    }
  }

  return ids;
}

export function estimatePromotionDurationMinutes(
  promotion: Pick<SalonPromotionPackage, "included_services">,
  services: BookableService[],
  serviceIds: string[]
): number {
  if (serviceIds.length > 0) {
    return serviceIds.reduce((sum, id) => {
      const service = services.find((item) => item.id === id);
      return sum + parseInt(String(service?.duration || service?.duration_min || 30), 10);
    }, 0);
  }

  return Math.max(60, promotion.included_services.length * 30);
}

export function resolvePromotionBookingServices(
  promotion: SalonPromotionPackage,
  services: BookableService[]
): PromotionBookingResolution {
  let serviceIds = resolveServiceIdsFromNames(promotion.included_services, services);

  if (serviceIds.length === 0) {
    serviceIds = resolveFuzzyServiceIds(promotion.included_services, services);
  }

  let usedAnchor = false;
  if (serviceIds.length === 0 && services.length > 0) {
    serviceIds = [services[0].id];
    usedAnchor = true;
  }

  return {
    serviceIds,
    anchorServiceId: serviceIds[0] || null,
    durationMinutes: estimatePromotionDurationMinutes(promotion, services, serviceIds),
    usedAnchor,
  };
}

export function buildPromotionCheckoutService(
  promotion: SalonPromotionPackage,
  services: BookableService[],
  resolution: PromotionBookingResolution
) {
  const anchor = services.find((service) => service.id === resolution.anchorServiceId);

  return {
    id: resolution.anchorServiceId || promotion.id,
    name: promotion.name,
    description:
      promotion.description ||
      (promotion.included_services.length > 0
        ? `Includes: ${promotion.included_services.join(", ")}`
        : "Promotion package"),
    price: promotion.package_price,
    duration: resolution.durationMinutes,
    duration_min: resolution.durationMinutes,
  };
}
