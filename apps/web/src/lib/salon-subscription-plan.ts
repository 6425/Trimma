import type { SupabaseClient } from "@supabase/supabase-js";
import { parseFeatureFlags, type SubscriptionFeatureFlags } from "@/lib/parse-feature-flags";
import { DEFAULT_ENTRY_PLAN_ID, DEFAULT_ENTRY_PLAN_NAME } from "@/lib/subscription-pricing";

export type SalonSubscriptionPlan = Record<string, unknown> & {
  id?: string;
  name?: string;
  feature_flags?: unknown;
  max_services?: number;
  max_staff?: number;
};

export function getAllowedCategoriesLimit(
  flags: SubscriptionFeatureFlags,
  planName?: string | null
): number {
  const raw = flags.allowed_categories_limit;
  if (typeof raw === "number" && raw > 0) {
    return raw >= 999 ? 999 : raw;
  }

  const name = (planName || "").trim().toLowerCase();
  if (name === "starter") return 5;
  if (name === "pro" || name === "elite") return 999;
  return 2;
}

export async function ensureSalonSubscriptionPlan(
  supabase: SupabaseClient,
  salonId: string,
  currentPlanId?: string | null
): Promise<{ planId: string | null; plan: SalonSubscriptionPlan | null; updatedSalon: boolean }> {
  if (currentPlanId) {
    const { data: existingPlan, error } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("id", currentPlanId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (existingPlan) {
      return { planId: currentPlanId, plan: existingPlan as SalonSubscriptionPlan, updatedSalon: false };
    }
  }

  const { data: entryPlanById, error: entryPlanByIdError } = await supabase
    .from("subscription_plans")
    .select("*")
    .eq("id", DEFAULT_ENTRY_PLAN_ID)
    .maybeSingle();
  if (entryPlanByIdError) throw new Error(entryPlanByIdError.message);

  let plan = entryPlanById as SalonSubscriptionPlan | null;
  if (!plan?.id) {
    const { data: entryPlanByName, error: entryPlanByNameError } = await supabase
      .from("subscription_plans")
      .select("*")
      .in("name", [DEFAULT_ENTRY_PLAN_NAME, "Free"])
      .order("monthly_price", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (entryPlanByNameError) throw new Error(entryPlanByNameError.message);
    plan = entryPlanByName as SalonSubscriptionPlan | null;
  }
  if (!plan?.id) {
    const { data: fallbackPlan, error: fallbackError } = await supabase
      .from("subscription_plans")
      .select("*")
      .order("monthly_price", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (fallbackError) throw new Error(fallbackError.message);
    plan = (fallbackPlan as SalonSubscriptionPlan | null) ?? null;
  }

  if (!plan?.id) {
    return { planId: null, plan: null, updatedSalon: false };
  }

  const { error: updateError } = await supabase
    .from("salons")
    .update({ subscription_plan_id: plan.id })
    .eq("id", salonId);
  if (updateError) throw new Error(updateError.message);

  return { planId: String(plan.id), plan, updatedSalon: true };
}

export function sliceAllowedCategories<T extends { id: string }>(
  categories: T[],
  flags: SubscriptionFeatureFlags,
  planName?: string | null
): T[] {
  const limit = getAllowedCategoriesLimit(flags, planName);
  if (limit >= 999) return categories;
  return categories.slice(0, limit);
}

export function readPlanFlags(plan: SalonSubscriptionPlan | null | undefined): SubscriptionFeatureFlags {
  return parseFeatureFlags(plan?.feature_flags);
}
