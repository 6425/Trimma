import type { User } from "@supabase/supabase-js";

export function getAuthProviders(user: User): string[] {
  return (user.identities ?? []).map((identity) => identity.provider);
}

export function isGoogleOnlyAuthUser(user: User): boolean {
  const providers = getAuthProviders(user);
  return providers.includes("google") && !providers.includes("email");
}

export function canUseEmailPassword(user: User): boolean {
  return getAuthProviders(user).includes("email");
}
