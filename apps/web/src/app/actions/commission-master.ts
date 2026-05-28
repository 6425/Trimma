"use server";

import { adminDbFailure, isAdminDbSuccess, withAdminDb } from "@/lib/with-admin-db";

export type BookingCommissionInput = {
  platform: number;
  salon: number;
  payhere: number;
  previousId?: string | null;
};

export type SubscriptionCommissionInput = {
  platform: number;
  agent: number;
  previousId?: string | null;
};

export type CommissionRuleInput = {
  id: string;
  name: string;
  rule_type: string;
  rate: number;
  tier_min?: number | null;
  tier_max?: number | null;
};

export async function saveBookingCommissionMaster(input: BookingCommissionInput) {
  if (input.platform + input.salon + input.payhere !== 23) {
    return { success: false as const, error: "Platform + Salon + PayHere must equal 23%." };
  }

  const result = await withAdminDb(async (supabase) => {
    if (input.previousId) {
      const { error } = await supabase
        .from("commission_master")
        .update({ active: false })
        .eq("id", input.previousId);
      if (error) throw new Error(error.message);
    }

    const { error } = await supabase.from("commission_master").insert({
      commission_type: "booking",
      platform_percentage: input.platform,
      salon_percentage: input.salon,
      payhere_percentage: input.payhere,
      agent_percentage: 0,
      active: true,
    });
    if (error) throw new Error(error.message);
  });

  if (!isAdminDbSuccess(result)) return adminDbFailure(result);
  return { success: true as const };
}

export async function saveSubscriptionCommissionMaster(input: SubscriptionCommissionInput) {
  if (input.platform + input.agent !== 100) {
    return { success: false as const, error: "Platform + Agent must equal 100%." };
  }

  const result = await withAdminDb(async (supabase) => {
    if (input.previousId) {
      const { error } = await supabase
        .from("commission_master")
        .update({ active: false })
        .eq("id", input.previousId);
      if (error) throw new Error(error.message);
    }

    const { error } = await supabase.from("commission_master").insert({
      commission_type: "subscription",
      platform_percentage: input.platform,
      salon_percentage: 0,
      agent_percentage: input.agent,
      active: true,
    });
    if (error) throw new Error(error.message);
  });

  if (!isAdminDbSuccess(result)) return adminDbFailure(result);
  return { success: true as const };
}

export async function saveCommissionRules(rules: CommissionRuleInput[]) {
  const editable = (rules || []).filter((rule) => rule.id && !String(rule.id).startsWith("default-"));
  if (editable.length === 0) {
    return {
      success: false as const,
      error: "No editable commission rules in the database. Add rows to commission_rules first.",
    };
  }

  const result = await withAdminDb(async (supabase) => {
    for (const rule of editable) {
      const { error } = await supabase
        .from("commission_rules")
        .update({
          name: rule.name,
          rule_type: rule.rule_type,
          rate: rule.rate,
          tier_min: rule.tier_min ?? 0,
          tier_max: rule.tier_max ?? null,
        })
        .eq("id", rule.id);
      if (error) throw new Error(error.message);
    }
  });

  if (!isAdminDbSuccess(result)) return adminDbFailure(result);
  return { success: true as const };
}
