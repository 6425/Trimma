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
    publishableSource: StripeKeySource;
    secretSource: StripeKeySource;
  };
  live: {
    publishableConfigured: boolean;
    secretConfigured: boolean;
    publishablePreview: string;
    secretPreview: string;
    publishableSource: StripeKeySource;
    secretSource: StripeKeySource;
  };
};

export type StripeDbKeyRow = {
  stripe_publishable_key_sandbox?: string | null;
  stripe_publishable_key_live?: string | null;
  stripe_secret_key_sandbox?: string | null;
  stripe_secret_key_live?: string | null;
};

export type StripeKeySource = "env" | "database" | "missing";

export type StripeResolvedKeys = StripeEnvKeySet & {
  publishableSource: StripeKeySource;
  secretSource: StripeKeySource;
};

export function resolveStripeKeys(
  environment: "sandbox" | "live",
  db?: StripeDbKeyRow | null
): StripeResolvedKeys {
  const envKeys = getStripeEnvKeys(environment);

  const dbPublishable =
    environment === "live"
      ? db?.stripe_publishable_key_live?.trim() || null
      : db?.stripe_publishable_key_sandbox?.trim() || null;

  const dbSecret =
    environment === "live"
      ? db?.stripe_secret_key_live?.trim() || null
      : db?.stripe_secret_key_sandbox?.trim() || null;

  const publishableSource: StripeKeySource = envKeys.publishableKey
    ? "env"
    : dbPublishable
      ? "database"
      : "missing";

  const secretSource: StripeKeySource = envKeys.secretKey
    ? "env"
    : dbSecret
      ? "database"
      : "missing";

  return {
    publishableKey: envKeys.publishableKey || dbPublishable,
    secretKey: envKeys.secretKey || dbSecret,
    publishableSource,
    secretSource,
  };
}

export function getStripeConnectionStatus(db?: StripeDbKeyRow | null): StripeConnectionStatus {
  const sandbox = resolveStripeKeys("sandbox", db);
  const live = resolveStripeKeys("live", db);

  return {
    sandbox: {
      publishableConfigured: Boolean(sandbox.publishableKey),
      secretConfigured: Boolean(sandbox.secretKey),
      publishablePreview: maskSecret(sandbox.publishableKey),
      secretPreview: maskSecret(sandbox.secretKey),
      publishableSource: sandbox.publishableSource,
      secretSource: sandbox.secretSource,
    },
    live: {
      publishableConfigured: Boolean(live.publishableKey),
      secretConfigured: Boolean(live.secretKey),
      publishablePreview: maskSecret(live.publishableKey),
      secretPreview: maskSecret(live.secretKey),
      publishableSource: live.publishableSource,
      secretSource: live.secretSource,
    },
  };
}

export const STRIPE_ENV_DOCS = [
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_SANDBOX",
  "STRIPE_SECRET_KEY_SANDBOX",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE",
  "STRIPE_SECRET_KEY_LIVE",
] as const;
