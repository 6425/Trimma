import type { PublicSubscriptionPlan } from "@/app/actions/subscription-plans";
import {
  formatLkr,
  formatPromotionPackageLimit,
  getAnnualMonthlyRate,
  getAnnualSavingsPercent,
  getAnnualTotal,
  getDiscountPercentage,
  getIntroMonthlyPrice,
  getListMonthlyPrice,
  type SubscriptionPlanPricing,
} from "@/lib/subscription-pricing";

export const PRICING_COPY_TOKENS = [
  "{{name}}",
  "{{list_monthly_price}}",
  "{{intro_monthly_price}}",
  "{{annual_total}}",
  "{{annual_monthly_rate}}",
  "{{discount_percentage}}",
  "{{annual_savings_percent}}",
  "{{max_staff}}",
  "{{max_services}}",
  "{{max_images}}",
  "{{max_promotion_packages}}",
  "{{allowed_categories}}",
] as const;

export const DEFAULT_PRICING_COPY_MONTHLY =
  "Introduction monthly rate. Standard rate {{list_monthly_price}}/mo.";

export const DEFAULT_PRICING_COPY_ANNUAL =
  "{{annual_monthly_rate}}/mo equivalent when paid yearly. Billed as {{annual_total}} annually.";

export const DEFAULT_PRICING_COPY_FREE_MONTHLY =
  "Perfect for independent stylists starting out. Standard value {{list_monthly_price}}/mo — introductory access at {{intro_monthly_price}}/mo.";

type PricingCopyPlan = SubscriptionPlanPricing & {
  name?: string | null;
  max_staff?: number | string | null;
  max_services?: number | string | null;
  max_images?: number | string | null;
  max_promotion_packages?: number | string | null;
  feature_flags?: {
    allowed_categories_limit?: number;
    pricing_copy_monthly?: string;
    pricing_copy_annual?: string;
  } | null;
};

function formatCategoriesLimit(limit: number | undefined): string {
  if (!limit || limit >= 999) return "All Categories";
  return `${limit} Allowed`;
}

function formatServicesLimit(value: number | string | null | undefined): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return "0";
  if (n >= 9999) return "Unlimited";
  return String(n);
}

export function buildPricingMergeContext(plan: PricingCopyPlan) {
  const listMonthly = getListMonthlyPrice(plan);
  const introMonthly = getIntroMonthlyPrice(plan);
  const annualTotal = getAnnualTotal(plan);
  const annualMonthly = getAnnualMonthlyRate(plan);
  const catLimit = plan.feature_flags?.allowed_categories_limit;

  return {
    name: plan.name || "Plan",
    list_monthly_price: formatLkr(listMonthly),
    intro_monthly_price: formatLkr(introMonthly),
    annual_total: formatLkr(annualTotal, 2),
    annual_monthly_rate: formatLkr(annualMonthly),
    discount_percentage: String(getDiscountPercentage(plan)),
    annual_savings_percent: String(getAnnualSavingsPercent(plan)),
    max_staff: String(plan.max_staff ?? 0),
    max_services: formatServicesLimit(plan.max_services),
    max_images: String(plan.max_images ?? 0),
    max_promotion_packages: formatPromotionPackageLimit(plan.max_promotion_packages),
    allowed_categories: formatCategoriesLimit(catLimit),
  };
}

export function renderPricingCopy(
  template: string,
  plan: PricingCopyPlan
): string {
  const context = buildPricingMergeContext(plan);
  return template.replace(/\{\{([a-z_]+)\}\}/g, (_match, key: string) => {
    return context[key as keyof typeof context] ?? "";
  });
}

export function getPlanPricingCopy(
  plan: PublicSubscriptionPlan,
  billingCycle: "monthly" | "annual"
): string {
  const listMonthly = getListMonthlyPrice(plan);
  const introMonthly = getIntroMonthlyPrice(plan);
  const isFree = listMonthly === 0 && introMonthly === 0;
  const customMonthly = plan.feature_flags?.pricing_copy_monthly?.trim();
  const customAnnual = plan.feature_flags?.pricing_copy_annual?.trim();

  if (billingCycle === "annual") {
    const template = customAnnual || DEFAULT_PRICING_COPY_ANNUAL;
    return renderPricingCopy(template, plan);
  }

  if (isFree) {
    const template = customMonthly || DEFAULT_PRICING_COPY_FREE_MONTHLY;
    return renderPricingCopy(template, plan);
  }

  const template = customMonthly || DEFAULT_PRICING_COPY_MONTHLY;
  return renderPricingCopy(template, plan);
}

export function buildPricingPageFaqs(plans: PublicSubscriptionPlan[]) {
  const paidPlans = plans.filter((plan) => getIntroMonthlyPrice(plan) > 0);
  const examplePlan =
    paidPlans.find((plan) => plan.name.toLowerCase() === "starter") || paidPlans[0];

  const introExample = examplePlan
    ? `${examplePlan.name} ${formatLkr(getIntroMonthlyPrice(examplePlan))} instead of ${formatLkr(getListMonthlyPrice(examplePlan))}`
    : "discounted introduction rates on monthly billing";

  const unlimitedPlans = plans
    .filter((plan) => (plan.feature_flags?.allowed_categories_limit ?? 0) >= 999)
    .map((plan) => `${plan.name}`)
    .join(" and ");

  const categoryAnswer = unlimitedPlans
    ? `To keep Trimma search highly optimized, tiers restrict how many global category directories your salon can list in. ${unlimitedPlans} include all categories.`
    : "To keep Trimma search highly optimized, tiers restrict the number of different global category directories your salon can list in.";

  return [
    {
      q: "How does introduction pricing work?",
      a: `Monthly plans show their discounted introduction rate (e.g. ${introExample}). Annual plans are billed as a single yearly total based on a lower monthly equivalent.`,
    },
    {
      q: "What are Service Category Limits?",
      a: categoryAnswer,
    },
    {
      q: "Is there a lock-in contract?",
      a: "No contracts. Trimma is pay-as-you-go. Cancel online at any time with zero termination fees.",
    },
    {
      q: "Do the prices include taxes?",
      a: "All prices shown on this page are inclusive of platform services and VAT, ensuring complete billing transparency.",
    },
  ];
}

export function getStrikethroughMonthlyPrice(plan: PricingCopyPlan): string | null {
  const listMonthly = getListMonthlyPrice(plan);
  const introMonthly = getIntroMonthlyPrice(plan);
  if (listMonthly <= 0) return null;
  if (listMonthly <= introMonthly) return null;
  return `${formatLkr(listMonthly)}/mo`;
}
