import type { SupabaseClient, User } from "@supabase/supabase-js";
import { normalizeEmail } from "@/lib/normalize-email";

export async function findAuthUserByEmail(
  supabase: SupabaseClient,
  email: string
): Promise<User | null> {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;

  let page = 1;
  const perPage = 1000;

  while (page <= 10) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(error.message);

    const match = (data?.users || []).find((user) => normalizeEmail(user.email) === normalized);
    if (match) return match;

    if (!data?.users?.length || data.users.length < perPage) break;
    page += 1;
  }

  return null;
}

export { canUseEmailPassword, getAuthProviders, isGoogleOnlyAuthUser } from "@/lib/auth-providers";
