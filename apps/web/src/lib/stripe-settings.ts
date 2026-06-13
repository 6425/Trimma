import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { getStripeEnvKeys } from "@/lib/stripe-env";

export type StripeGatewaySettings = {
  enabled: boolean;
  environment: "sandbox" | "live";
  publishableKey: string | null;
  secretKey: string | null;
};

const PAYMENT_SETTINGS_ID = "00000000-0000-0000-0000-000000000001";

async function loadStripeRuntimeFlags(): Promise<{
  enabled: boolean;
  environment: "sandbox" | "live";
}> {
  const defaults = { enabled: true, environment: "sandbox" as const };

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("global_payment_settings")
      .select("stripe_enabled, stripe_environment")
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

    return {
      enabled: data.stripe_enabled !== false,
      environment: data.stripe_environment === "live" ? "live" : "sandbox",
    };
  } catch (err) {
    console.warn("[loadStripeRuntimeFlags]", err);
    return defaults;
  }
}

export async function loadStripeGatewaySettings(): Promise<StripeGatewaySettings> {
  const flags = await loadStripeRuntimeFlags();
  const keys = getStripeEnvKeys(flags.environment);

  return {
    enabled: flags.enabled,
    environment: flags.environment,
    publishableKey: keys.publishableKey,
    secretKey: keys.secretKey,
  };
}

export function toStripeAmountLkr(amount: number): number {
  return Math.max(1, Math.round(Number(amount) * 100));
}
