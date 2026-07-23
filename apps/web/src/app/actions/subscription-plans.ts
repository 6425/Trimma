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

export async function getPublicSubscriptionPlans() {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("subscription_plans")
      .select("*")
      .order("monthly_price", { ascending: true });

    if (error) {
      return {
        success: false as const,
        error: error.message,
        plans: normalizePublicSubscriptionPlans(
          DEFAULT_SUBSCRIPTION_PLANS as PublicSubscriptionPlan[]
        ),
      };
    }

    const rawPlans =
      data && data.length > 0
        ? (data as PublicSubscriptionPlan[])
        : (DEFAULT_SUBSCRIPTION_PLANS as PublicSubscriptionPlan[]);

    // Safety net: rename Free / zero-price entry tier → Beginner @ 2250 even if DB is stale.
    const plans = normalizePublicSubscriptionPlans(rawPlans);

    return { success: true as const, error: null, plans };
  } catch (err) {
    return {
      success: false as const,
      error: err instanceof Error ? err.message : "Could not load subscription plans.",
      plans: normalizePublicSubscriptionPlans(
        DEFAULT_SUBSCRIPTION_PLANS as PublicSubscriptionPlan[]
      ),
    };
  }
}
