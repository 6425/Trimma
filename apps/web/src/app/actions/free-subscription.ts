"use server";

import { revalidatePath } from "next/cache";
import {
  isSalonDbSuccess,
  salonDbFailure,
  withSalonDb,
} from "@/lib/with-salon-db";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type FreeSubscriptionRpcRow = {
  start_date?: unknown;
  end_date?: unknown;
  status?: unknown;
};

export async function activateFreeSubscriptionPlan(planId: string): Promise<
  | {
      success: true;
      subscription: { startDate: string; endDate: string; status: string };
    }
  | { success: false; error: string }
> {
  const normalizedPlanId = String(planId || "").trim();
  if (!UUID_PATTERN.test(normalizedPlanId)) {
    return { success: false, error: "Select a valid subscription package." };
  }

  const result = await withSalonDb(async (supabase, context) => {
    const { data, error } = await supabase.rpc("activate_free_salon_subscription", {
      p_salon_id: context.salonId,
      p_plan_id: normalizedPlanId,
    });

    if (error) {
      const lower = error.message.toLowerCase();
      if (
        lower.includes("activate_free_salon_subscription") ||
        lower.includes("schema cache") ||
        lower.includes("could not find the function")
      ) {
        throw new Error(
          "Free subscription activation is not installed. Apply the latest database migration."
        );
      }
      throw new Error(error.message);
    }

    const row = (Array.isArray(data) ? data[0] : data) as FreeSubscriptionRpcRow | null;
    const startDate = typeof row?.start_date === "string" ? row.start_date : "";
    const endDate = typeof row?.end_date === "string" ? row.end_date : "";
    const status = typeof row?.status === "string" ? row.status : "";

    if (!startDate || !endDate || !status) {
      throw new Error("The free subscription could not be confirmed. Please try again.");
    }

    return { subscription: { startDate, endDate, status } };
  });

  if (!isSalonDbSuccess(result)) return salonDbFailure(result);

  revalidatePath("/dashboard/billing");
  revalidatePath("/pricing");

  return { success: true, subscription: result.data.subscription };
}
