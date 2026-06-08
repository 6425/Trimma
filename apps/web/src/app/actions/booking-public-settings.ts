"use server";

import { createSupabaseAdminClient } from "@/config/supabase-admin";

const PAYMENT_SETTINGS_ID = "00000000-0000-0000-0000-000000000001";

export type BookingCommissionRates = {
  platform: number;
  salon: number;
  agent: number;
};

export type PublicPaymentGatewaySettings = {
  paypalEnabled: boolean;
  payhereEnabled: boolean;
  environment: "sandbox" | "live";
  payhereMerchantId: string | null;
};

const DEFAULT_RATES: BookingCommissionRates = {
  platform: 10,
  salon: 10,
  agent: 20,
};

export async function fetchBookingCommissionRates(): Promise<BookingCommissionRates> {
  try {
    const supabase = createSupabaseAdminClient();
    const { data } = await supabase
      .from("commission_master")
      .select("platform_percentage, salon_percentage, agent_percentage")
      .eq("commission_type", "booking")
      .eq("active", true)
      .maybeSingle();

    if (!data) return DEFAULT_RATES;

    return {
      platform: data.platform_percentage ?? DEFAULT_RATES.platform,
      salon: data.salon_percentage ?? DEFAULT_RATES.salon,
      agent: data.agent_percentage ?? DEFAULT_RATES.agent,
    };
  } catch {
    return DEFAULT_RATES;
  }
}

/** Public payment flags only — never returns merchant secret. */
export async function fetchPublicPaymentGatewaySettings(): Promise<PublicPaymentGatewaySettings> {
  try {
    const supabase = createSupabaseAdminClient();
    const { data } = await supabase
      .from("global_payment_settings")
      .select("paypal_enabled, payhere_enabled, environment, payhere_merchant_id")
      .eq("id", PAYMENT_SETTINGS_ID)
      .maybeSingle();

    if (!data) {
      return {
        paypalEnabled: true,
        payhereEnabled: true,
        environment: "sandbox",
        payhereMerchantId: null,
      };
    }

    return {
      paypalEnabled: data.paypal_enabled !== false,
      payhereEnabled: data.payhere_enabled !== false,
      environment: (data.environment === "live" ? "live" : "sandbox") as "sandbox" | "live",
      payhereMerchantId: data.payhere_merchant_id || null,
    };
  } catch {
    return {
      paypalEnabled: true,
      payhereEnabled: true,
      environment: "sandbox",
      payhereMerchantId: null,
    };
  }
}
