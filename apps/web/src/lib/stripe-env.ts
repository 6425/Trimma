export type StripeEnvKeySet = {
  publishableKey: string | null;
  secretKey: string | null;
};

function readEnv(name: string): string | null {
  const value = process.env[name]?.trim();
  return value || null;
}

export function getStripeEnvKeys(environment: "sandbox" | "live"): StripeEnvKeySet {
  if (environment === "live") {
    return {
      publishableKey:
        readEnv("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE") ||
        readEnv("STRIPE_PUBLISHABLE_KEY_LIVE") ||
        null,
      secretKey:
        readEnv("STRIPE_SECRET_KEY_LIVE") || null,
    };
  }

  return {
    publishableKey:
      readEnv("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_SANDBOX") ||
      readEnv("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY") ||
      readEnv("STRIPE_PUBLISHABLE_KEY_SANDBOX") ||
      readEnv("STRIPE_PUBLISHABLE_KEY") ||
      null,
    secretKey:
      readEnv("STRIPE_SECRET_KEY_SANDBOX") ||
      readEnv("STRIPE_SECRET_KEY") ||
      null,
  };
}

export function maskSecret(value: string | null): string {
  if (!value) return "Not configured";
  if (value.length <= 8) return "••••••••";
  return `${value.slice(0, 7)}••••${value.slice(-4)}`;
}

export type StripeConnectionStatus = {
  sandbox: {
    publishableConfigured: boolean;
    secretConfigured: boolean;
    publishablePreview: string;
    secretPreview: string;
  };
  live: {
    publishableConfigured: boolean;
    secretConfigured: boolean;
    publishablePreview: string;
    secretPreview: string;
  };
};

export function getStripeConnectionStatus(): StripeConnectionStatus {
  const sandbox = getStripeEnvKeys("sandbox");
  const live = getStripeEnvKeys("live");

  return {
    sandbox: {
      publishableConfigured: Boolean(sandbox.publishableKey),
      secretConfigured: Boolean(sandbox.secretKey),
      publishablePreview: maskSecret(sandbox.publishableKey),
      secretPreview: maskSecret(sandbox.secretKey),
    },
    live: {
      publishableConfigured: Boolean(live.publishableKey),
      secretConfigured: Boolean(live.secretKey),
      publishablePreview: maskSecret(live.publishableKey),
      secretPreview: maskSecret(live.secretKey),
    },
  };
}

export const STRIPE_ENV_DOCS = [
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_SANDBOX",
  "STRIPE_SECRET_KEY_SANDBOX",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE",
  "STRIPE_SECRET_KEY_LIVE",
] as const;
