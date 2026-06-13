import { createSupabaseAdminClient } from "@/config/supabase-admin";

export type StripeGatewaySettings = {
  enabled: boolean;
  environment: "sandbox" | "live";
  publishableKey: string | null;
  secretKey: string | null;
};

const PAYMENT_SETTINGS_ID = "00000000-0000-0000-0000-000000000001";

export async function loadStripeGatewaySettings(): Promise<StripeGatewaySettings> {
  const defaults: StripeGatewaySettings = {
    enabled: true,
    environment: "sandbox",
    publishableKey: null,
    secretKey: null,
  };

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("global_payment_settings")
      .select(
        "stripe_enabled, stripe_environment, stripe_publishable_key_sandbox, stripe_publishable_key_live, stripe_secret_key_sandbox, stripe_secret_key_live"
      )
      .eq("id", PAYMENT_SETTINGS_ID)
      .maybeSingle();

    if (error) {
      if (
        error.message.toLowerCase().includes("does not exist") ||
        error.message.toLowerCase().includes("schema cache")
      ) {
        return defaults;
      }
      throw error;
    }

    if (!data) return defaults;

    const environment =
      data.stripe_environment === "live" ? "live" : "sandbox";

    return {
      enabled: data.stripe_enabled !== false,
      environment,
      publishableKey:
        environment === "live"
          ? data.stripe_publishable_key_live || data.stripe_publishable_key_sandbox || null
          : data.stripe_publishable_key_sandbox || null,
      secretKey:
        environment === "live"
          ? data.stripe_secret_key_live || data.stripe_secret_key_sandbox || null
          : data.stripe_secret_key_sandbox || null,
    };
  } catch (err) {
    console.warn("[loadStripeGatewaySettings]", err);
    return defaults;
  }
}

export function toStripeAmountLkr(amount: number): number {
  return Math.max(1, Math.round(Number(amount) * 100));
}
