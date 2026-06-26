import {
  getDiscountedServicePrice,
  getServiceDiscountLabel,
  isServiceDiscountActive,
  type ServiceDiscountFields,
} from "@/lib/service-discount";
import { getPromotionPeriodLabel } from "@/lib/promotion-package-dates";

export type FacebookCaptionInput =
  | {
      kind: "service";
      action: "created" | "updated" | "deleted";
      salonName: string;
      bookingUrl: string;
      service: {
        name: string;
        description?: string | null;
        price?: number | string | null;
        duration_min?: number | null;
        category?: string | null;
        discount_percentage?: number | string | null;
        discount_end_date?: string | null;
      };
    }
  | {
      kind: "promotion_package";
      action: "created" | "updated" | "deleted";
      salonName: string;
      bookingUrl: string;
      pkg: {
        name: string;
        description?: string | null;
        package_price?: number | string | null;
        original_price?: number | string | null;
        included_services?: string[] | null;
        start_date?: string | null;
        end_date?: string | null;
        promotion_type?: string | null;
      };
    };

function formatLkr(amount: number): string {
  return `Rs. ${Math.round(amount).toLocaleString("en-LK")}`;
}

function actionHeadline(action: "created" | "updated" | "deleted", label: string): string {
  if (action === "deleted") return `Update: ${label} is no longer available`;
  if (action === "created") return `New at our salon: ${label}`;
  return `Updated: ${label}`;
}

export function buildFacebookCatalogCaption(input: FacebookCaptionInput): string {
  if (input.kind === "service") {
    const { service, action, salonName, bookingUrl } = input;
    const discountFields: ServiceDiscountFields = {
      price: service.price ?? 0,
      discount_percentage: service.discount_percentage,
      discount_end_date: service.discount_end_date,
    };
    const hasDiscount = isServiceDiscountActive(discountFields);
    const price = hasDiscount ? getDiscountedServicePrice(discountFields) : Number(service.price) || 0;
    const discountLabel = getServiceDiscountLabel(discountFields);

    const lines = [
      action === "deleted" ? "📋 Service update" : "✨ Salon service",
      "",
      actionHeadline(action, service.name),
      "",
    ];

    if (action !== "deleted") {
      if (service.description?.trim()) lines.push(service.description.trim(), "");
      lines.push(`${service.name}`);
      if (price > 0) {
        lines.push(
          hasDiscount && discountLabel
            ? `${formatLkr(price)} (${discountLabel})`
            : formatLkr(price)
        );
      }
      if (service.duration_min) lines.push(`⏱ ${service.duration_min} minutes`);
      if (service.category) lines.push(`Category: ${service.category}`);
      lines.push(
        "",
        "✔ Professional stylists",
        "✔ Easy online booking",
        "",
        `Book instantly with ${salonName} on Trimma:`,
        bookingUrl
      );
    } else {
      lines.push(`Visit ${salonName} on Trimma for our latest services:`, bookingUrl);
    }

    lines.push("", "#HairSalon", "#BeautySalon", "#Trimma");
    return lines.join("\n").trim();
  }

  const { pkg, action, salonName, bookingUrl } = input;
  const price = Number(pkg.package_price) || 0;
  const original = Number(pkg.original_price) || 0;
  const savings = original > price ? original - price : 0;
  const period = getPromotionPeriodLabel(pkg.start_date, pkg.end_date);
  const included = (pkg.included_services || []).filter(Boolean);

  const lines = [
    action === "deleted" ? "📋 Promotion ended" : "🎁 Special offer",
    "",
    actionHeadline(action, pkg.name),
    "",
  ];

  if (action !== "deleted") {
    if (pkg.promotion_type) lines.push(pkg.promotion_type, "");
    if (pkg.description?.trim()) lines.push(pkg.description.trim(), "");
    lines.push(pkg.name);
    if (price > 0) {
      lines.push(original > price ? `${formatLkr(price)} (was ${formatLkr(original)})` : formatLkr(price));
    }
    if (savings > 0) lines.push(`Save ${formatLkr(savings)}`);
    if (period) lines.push(`📅 ${period}`);
    if (included.length > 0) {
      lines.push("", "Includes:");
      for (const item of included.slice(0, 8)) lines.push(`✔ ${item}`);
    }
    lines.push(
      "",
      `Book this offer at ${salonName}:`,
      bookingUrl,
      "",
      "#SalonOffer",
      "#BeautyDeals",
      "#Trimma"
    );
  } else {
    lines.push(`See current offers from ${salonName}:`, bookingUrl);
  }

  return lines.join("\n").trim();
}
