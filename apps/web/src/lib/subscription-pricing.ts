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
  discount_percentage?: number | string | null;
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

export function getDiscountPercentage(plan: SubscriptionPlanPricing): number {
  return toNumber(plan.discount_percentage);
}

export function getIntroMonthlyPrice(plan: SubscriptionPlanPricing): number {
  const intro = toNumber(plan.intro_monthly_price);
  if (intro > 0) return intro;
  const monthly = toNumber(plan.monthly_price);
  if (monthly > 0) return monthly;
  const list = getListMonthlyPrice(plan);
  const discount = getDiscountPercentage(plan);
  if (list > 0 && discount > 0) return Math.round(list * (1 - discount / 100));
  return list;
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

/** Canonical entry-level plan id (legacy Free → Beginner). */
export const DEFAULT_ENTRY_PLAN_ID = "f0000000-0000-0000-0000-000000000001";
export const DEFAULT_ENTRY_PLAN_NAME = "Beginner";

/** Canonical defaults when Supabase is offline or rows are missing. */
export const DEFAULT_SUBSCRIPTION_PLANS = [
  {
    id: DEFAULT_ENTRY_PLAN_ID,
    name: DEFAULT_ENTRY_PLAN_NAME,
    list_monthly_price: 3000,
    intro_monthly_price: 2250,
    monthly_price: 2250,
    annual_price: 21600,
    discount_percentage: 25,
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
    discount_percentage: 25,
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
    discount_percentage: 25,
    max_staff: 10,
    max_services: 20,
    max_images: 10,
    max_promotion_packages: 6,
    feature_flags: {
      allowed_categories_limit: 10,
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
    discount_percentage: 25,
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

/**
 * Stale production rows may still be named Free (or Beginner/entry id at LKR 0).
 * Pricing UI should show Beginner @ 2250 / 25% even before SQL is applied.
 */
export function needsEntryPlanDisplayOverride(
  plan: SubscriptionPlanPricing & { id?: string | null; name?: string | null }
): boolean {
  const name = (plan.name || "").trim().toLowerCase();
  if (name === "free") return true;

  const zeroPrices = getListMonthlyPrice(plan) === 0 && getIntroMonthlyPrice(plan) === 0;
  if (!zeroPrices) return false;

  const id = plan.id || "";
  return id === DEFAULT_ENTRY_PLAN_ID || name === "beginner" || name === "";
}

/** Overlay canonical Beginner pricing onto a stale Free / zero-price entry row. */
export function normalizePublicSubscriptionPlan<
  T extends SubscriptionPlanPricing & { id?: string | null; name?: string | null },
>(plan: T): T {
  if (!needsEntryPlanDisplayOverride(plan)) return plan;

  const beginner = DEFAULT_SUBSCRIPTION_PLANS[0];
  return {
    ...plan,
    id: plan.id || beginner.id,
    name: DEFAULT_ENTRY_PLAN_NAME,
    list_monthly_price: beginner.list_monthly_price,
    intro_monthly_price: beginner.intro_monthly_price,
    monthly_price: beginner.monthly_price,
    annual_price: beginner.annual_price,
    discount_percentage: beginner.discount_percentage,
  };
}

export function normalizePublicSubscriptionPlans<
  T extends SubscriptionPlanPricing & { id?: string | null; name?: string | null },
>(plans: T[]): T[] {
  return plans.map((plan) => normalizePublicSubscriptionPlan(plan));
}