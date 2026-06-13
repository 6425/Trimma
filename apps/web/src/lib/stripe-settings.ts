import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { getStripeEnvKeys, resolveStripeKeys, type StripeDbKeyRow } from "@/lib/stripe-env";

export type StripeGatewaySettings = {
  enabled: boolean;
  environment: "sandbox" | "live";
  publishableKey: string | null;
  secretKey: string | null;
};

const PAYMENT_SETTINGS_ID = "00000000-0000-0000-0000-000000000001";

type StripeSettingsRow = StripeDbKeyRow & {
  stripe_enabled?: boolean | null;
  stripe_environment?: string | null;
};

async function loadStripeDbSettings(): Promise<StripeSettingsRow | null> {
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
        return null;
      }
      throw error;
    }

    return data;
  } catch (err) {
    console.warn("[loadStripeDbSettings]", err);
    return null;
  }
}

export async function loadStripeGatewaySettings(): Promise<StripeGatewaySettings> {
  const db = await loadStripeDbSettings();
  const environment = db?.stripe_environment === "live" ? "live" : "sandbox";
  const keys = resolveStripeKeys(environment, db);

  return {
    enabled: db?.stripe_enabled !== false,
    environment,
    publishableKey: keys.publishableKey,
    secretKey: keys.secretKey,
  };
}

export async function loadStripeDbSettingsForAdmin(): Promise<StripeSettingsRow | null> {
  return loadStripeDbSettings();
}

export function toStripeAmountLkr(amount: number): number {
  return Math.max(1, Math.round(Number(amount) * 100));
}

// Re-export for callers that used getStripeEnvKeys directly
export { getStripeEnvKeys };
