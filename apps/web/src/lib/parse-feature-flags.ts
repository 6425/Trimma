export type SubscriptionFeatureFlags = {
  allowed_categories_limit?: number;
  features?: string[];
  [key: string]: unknown;
};

export function parseFeatureFlags(raw: unknown): SubscriptionFeatureFlags {
  if (!raw) return {};
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return typeof parsed === "object" && parsed !== null ? (parsed as SubscriptionFeatureFlags) : {};
    } catch {
      return {};
    }
  }
  if (typeof raw === "object") {
    return raw as SubscriptionFeatureFlags;
  }
  return {};
}
