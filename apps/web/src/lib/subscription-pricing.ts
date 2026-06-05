/**
 * Trimma subscription pricing model:
 * - list_monthly_price: standard monthly rate before intro discount
 * - monthly_price: intro monthly rate (25% off list)
 * - annual_price: total billed once per year (annual_monthly_rate × 12)
 */

export type SubscriptionPlanPricing = {
  name?: string | null;
  monthly_price?: number | string | null;
  list_monthly_price?: number | string | null;
  intro_monthly_price?: number | string | null;
  annual_price?: number | string | null;
};

export const INTRO_DISCOUNT_PERCENT = 25;

export function toNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined || value === "") return 0;
  const n = typeof value === "number" ? value : parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

export function getListMonthlyPrice(plan: SubscriptionPlanPricing): number {
  const list = toNumber(plan.list_monthly_price);
  if (list > 0) return list;
  const monthly = toNumber(plan.monthly_price);
  if (monthly > 0) return monthly;
  return 0;
}

export function getIntroMonthlyPrice(plan: SubscriptionPlanPricing): number {
  const intro = toNumber(plan.intro_monthly_price);
  if (intro > 0) return intro;
  const monthly = toNumber(plan.monthly_price);
  if (monthly > 0) return monthly;
  const list = getListMonthlyPrice(plan);
  if (list > 0) return Math.round(list * (1 - INTRO_DISCOUNT_PERCENT / 100));
  return 0;
}

/** Monthly equivalent when billed annually (annual_price ÷ 12). */
export function getAnnualMonthlyRate(plan: SubscriptionPlanPricing): number {
  const annualTotal = toNumber(plan.annual_price);
  if (annualTotal > 0) return annualTotal / 12;
  return 0;
}

export function getAnnualTotal(plan: SubscriptionPlanPricing): number {
  return toNumber(plan.annual_price);
}

export function getDisplayMonthlyPrice(
  plan: SubscriptionPlanPricing,
  billingCycle: "monthly" | "annual"
): number {
  if (getListMonthlyPrice(plan) === 0 && getIntroMonthlyPrice(plan) === 0) return 0;
  if (billingCycle === "annual") return getAnnualMonthlyRate(plan);
  return getIntroMonthlyPrice(plan);
}

export function getCheckoutAmount(
  plan: SubscriptionPlanPricing,
  billingCycle: "monthly" | "annual"
): number {
  if (billingCycle === "annual") return getAnnualTotal(plan);
  return getIntroMonthlyPrice(plan);
}

export function getAnnualSavingsPercent(plan: SubscriptionPlanPricing): number {
  const introMonthly = getIntroMonthlyPrice(plan);
  const annualMonthly = getAnnualMonthlyRate(plan);
  if (introMonthly <= 0 || annualMonthly <= 0) return 0;
  return Math.round(((introMonthly - annualMonthly) / introMonthly) * 100);
}

export function formatLkr(amount: number, fractionDigits = 0): string {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(amount);
}

export function formatPromotionPackageLimit(value: number | string | null | undefined): string {
  const n = toNumber(value);
  if (n >= 9999) return "Unlimited";
  return String(n);
}

/** Canonical defaults when Supabase is offline or rows are missing. */
export const DEFAULT_SUBSCRIPTION_PLANS = [
  {
    id: "f0000000-0000-0000-0000-000000000001",
    name: "Free",
    list_monthly_price: 0,
    intro_monthly_price: 0,
    monthly_price: 0,
    annual_price: 0,
    max_staff: 2,
    max_services: 6,
    max_images: 3,
    max_promotion_packages: 2,
    feature_flags: {
      allowed_categories_limit: 2,
      allowed_promotion_types_limit: 2,
      features: [
        "Staff Management",
        "FB/WA Integration",
        "Free Gmail Integration",
        "Free Google Business Page",
        "Performance Insights",
        "Salon Dashboard with QR",
      ],
    },
  },
  {
    id: "f0000000-0000-0000-0000-000000000002",
    name: "Starter",
    list_monthly_price: 5000,
    intro_monthly_price: 3750,
    monthly_price: 3750,
    annual_price: 36000,
    max_staff: 5,
    max_services: 12,
    max_images: 6,
    max_promotion_packages: 4,
    feature_flags: {
      allowed_categories_limit: 5,
      allowed_promotion_types_limit: 4,
      features: [
        "Staff Management",
        "FB/WA Integration",
        "Free Gmail Integration",
        "Free Google Business Page",
        "Performance Insights",
        "Salon Dashboard with QR",
      ],
    },
  },
  {
    id: "f0000000-0000-0000-0000-000000000003",
    name: "Pro",
    list_monthly_price: 10000,
    intro_monthly_price: 7500,
    monthly_price: 7500,
    annual_price: 60000,
    max_staff: 10,
    max_services: 20,
    max_images: 12,
    max_promotion_packages: 6,
    feature_flags: {
      allowed_categories_limit: 999,
      allowed_promotion_types_limit: 6,
      features: [
        "Staff Management",
        "FB/WA Integration",
        "Free Gmail Integration",
        "Free Google Business Page",
        "Performance Insights",
        "Salon Dashboard with QR",
      ],
    },
  },
  {
    id: "f0000000-0000-0000-0000-000000000004",
    name: "Elite",
    list_monthly_price: 10000,
    intro_monthly_price: 7500,
    monthly_price: 7500,
    annual_price: 60000,
    max_staff: 30,
    max_services: 9999,
    max_images: 30,
    max_promotion_packages: 12,
    feature_flags: {
      allowed_categories_limit: 999,
      allowed_promotion_types_limit: 12,
      features: [
        "Staff Management",
        "FB/WA Integration",
        "Free Gmail Integration",
        "Free Google Business Page",
        "Performance Insights",
        "Salon Dashboard with QR",
      ],
    },
  },
];
