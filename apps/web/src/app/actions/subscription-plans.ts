"use server";

import { createServerSupabaseClient } from "@/config/supabase-server";
import {
  DEFAULT_SUBSCRIPTION_PLANS,
  normalizePublicSubscriptionPlans,
} from "@/lib/subscription-pricing";

export type PublicSubscriptionPlan = {
  id: string;
  name: string;
  monthly_price: number | null;
  list_monthly_price: number | null;
  intro_monthly_price: number | null;
  annual_price: number | null;
  discount_percentage: number | null;
  max_staff: number | null;
  max_services: number | null;
  max_images: number | null;
  max_promotion_packages: number | null;
  feature_flags: {
    allowed_categories_limit?: number;
    allowed_promotion_types_limit?: number;
    features?: string[];
    pricing_copy_monthly?: string;
    pricing_copy_annual?: string;
  } | null;
};

const PLAN_ORDER = ["beginner", "starter", "pro", "elite"];

function sortSubscriptionPlans(plans: PublicSubscriptionPlan[]): PublicSubscriptionPlan[] {
  return [...plans].sort((left, right) => {
    const leftRank = PLAN_ORDER.indexOf(left.name.toLowerCase());
    const rightRank = PLAN_ORDER.indexOf(right.name.toLowerCase());
    const safeLeftRank = leftRank === -1 ? PLAN_ORDER.length : leftRank;
    const safeRightRank = rightRank === -1 ? PLAN_ORDER.length : rightRank;

    if (safeLeftRank !== safeRightRank) return safeLeftRank - safeRightRank;
    return left.name.localeCompare(right.name);
  });
}

export async function getPublicSubscriptionPlans() {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("subscription_plans")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      return {
        success: false as const,
        error: error.message,
        plans: sortSubscriptionPlans(
          normalizePublicSubscriptionPlans(DEFAULT_SUBSCRIPTION_PLANS as PublicSubscriptionPlan[])
        ),
      };
    }

    const rawPlans =
      data && data.length > 0
        ? (data as PublicSubscriptionPlan[])
        : (DEFAULT_SUBSCRIPTION_PLANS as PublicSubscriptionPlan[]);

    // The public policy is authoritative: stale database prices must never
    // expose a charge while all packages are in the free-access programme.
    const plans = sortSubscriptionPlans(normalizePublicSubscriptionPlans(rawPlans));

    return { success: true as const, error: null, plans };
  } catch (err) {
    return {
      success: false as const,
      error: err instanceof Error ? err.message : "Could not load subscription plans.",
      plans: sortSubscriptionPlans(
        normalizePublicSubscriptionPlans(DEFAULT_SUBSCRIPTION_PLANS as PublicSubscriptionPlan[])
      ),
    };
  }
}
