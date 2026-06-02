"use server";

import { cookies } from "next/headers";
import { generatePayhereHash } from "@/app/actions/payhere";
import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { DEFAULT_SUBSCRIPTION_PLANS } from "@/lib/subscription-pricing";

const SETTINGS_ID = "00000000-0000-0000-0000-000000000001";

const DEFAULT_PLANS: Record<string, (typeof DEFAULT_SUBSCRIPTION_PLANS)[number]> = Object.fromEntries(
  DEFAULT_SUBSCRIPTION_PLANS.filter((p) => p.name !== "Free").map((p) => [p.name.toLowerCase(), p])
);

function resolvePlan(planParam: string, row: Record<string, unknown> | null) {
  if (row) return row;
  const key = planParam.toLowerCase();
  return (DEFAULT_PLANS[key] || DEFAULT_PLANS.pro || DEFAULT_PLANS.starter) as Record<string, unknown>;
}

async function readCustomerPrefill() {
  const cookieStore = await cookies();
  let chunkedToken = "";
  for (let i = 0; i < 5; i++) {
    const chunk = cookieStore.get(`sb-access-token.${i}`)?.value;
    if (chunk) chunkedToken += chunk;
  }
  
  const raw = chunkedToken || cookieStore.get("sb-access-token")?.value;
  if (!raw) return null;

  try {
    const token = decodeURIComponent(raw);
    const supabase = createSupabaseAdminClient();
    const {
      data: { user },
    } = await supabase.auth.getUser(token);
    if (!user) return null;

    return {
      firstName: (user.user_metadata?.first_name as string) || "",
      lastName: (user.user_metadata?.last_name as string) || "",
      email: user.email || "",
      phone: user.phone || (user.user_metadata?.phone as string) || "",
    };
  } catch {
    return null;
  }
}

export async function fetchSubscriptionCheckoutPage(planParam: string) {
  const normalizedPlan = (planParam || "pro").toLowerCase();

  try {
    const supabase = createSupabaseAdminClient();
    const [paymentRes, planRes, customerPrefill] = await Promise.all([
      supabase
        .from("global_payment_settings")
        .select("payhere_enabled, environment")
        .eq("id", SETTINGS_ID)
        .maybeSingle(),
      supabase.from("subscription_plans").select("*").ilike("name", normalizedPlan).maybeSingle(),
      readCustomerPrefill(),
    ]);

    if (paymentRes.error) throw new Error(paymentRes.error.message);
    if (planRes.error) throw new Error(planRes.error.message);

    return {
      success: true as const,
      planDetails: resolvePlan(normalizedPlan, planRes.data as Record<string, unknown> | null),
      payhereEnabled: paymentRes.data?.payhere_enabled !== false,
      payhereEnvironment: (paymentRes.data?.environment as string) || "sandbox",
      customerPrefill,
    };
  } catch (err) {
    console.error("fetchSubscriptionCheckoutPage:", err);
    return {
      success: true as const,
      planDetails: resolvePlan(normalizedPlan, null),
      payhereEnabled: true,
      payhereEnvironment: "sandbox",
      customerPrefill: null,
    };
  }
}

function createSubscriptionOrderId() {
  return `SUB-${Math.floor(100000 + Math.random() * 900000)}`;
}

export async function initSubscriptionPayhereCheckout(input: {
  planName: string;
  billingCycle: "monthly" | "annual";
  chargeAmount: number;
  customerDetails: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
  };
  origin: string;
  cancelUrl: string;
}) {
  try {
    const supabase = createSupabaseAdminClient();
    const { data: paymentSettings, error } = await supabase
      .from("global_payment_settings")
      .select("payhere_merchant_id, payhere_merchant_secret, environment, payhere_enabled")
      .eq("id", SETTINGS_ID)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (paymentSettings?.payhere_enabled === false) {
      return { success: false as const, error: "PayHere payments are disabled." };
    }

    const merchantId = paymentSettings?.payhere_merchant_id || "1211149";
    const merchantSecret = paymentSettings?.payhere_merchant_secret || "4a5s6d7f8g9h";
    const environment = (paymentSettings?.environment as string) || "sandbox";
    const orderId = createSubscriptionOrderId();
    const amount = input.chargeAmount.toFixed(2);
    const cycleLabel = input.billingCycle === "annual" ? "Annual" : "Monthly";

    const secureHash = await generatePayhereHash(
      merchantId,
      orderId,
      amount,
      "LKR",
      merchantSecret
    );

    return {
      success: true as const,
      environment,
      payload: {
        merchant_id: merchantId,
        return_url: `${input.origin}/dashboard/billing?payment_success=true&sub_order=${orderId}&plan=${input.planName}`,
        cancel_url: input.cancelUrl,
        notify_url: "https://whxmyfjlrvyjqbmqhnzd.supabase.co/functions/v1/payhere-webhook",
        order_id: orderId,
        items: `Trimma ${input.planName} Plan (${cycleLabel})`,
        custom_1: `Trimma ${input.planName} (${cycleLabel})`,
        currency: "LKR",
        amount,
        first_name: input.customerDetails.firstName || "Guest",
        last_name: input.customerDetails.lastName || "User",
        email: input.customerDetails.email || "guest@trimma.com",
        phone: input.customerDetails.phone || "0000000000",
        address: input.customerDetails.address,
        city: input.customerDetails.city,
        country: "Sri Lanka",
        hash: secureHash,
      },
    };
  } catch (err) {
    return {
      success: false as const,
      error: err instanceof Error ? err.message : "Failed to initialize PayHere checkout.",
    };
  }
}
