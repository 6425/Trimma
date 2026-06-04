import { createSupabaseAdminClient } from "@/config/supabase-admin";
import type { TrimmaUserRole } from "@/lib/auth-routes";
import { resolveTrimmaRoleFromDb } from "@/lib/trimma-role-core";

/** Resolve Trimma role from DB using the service role (server-only). */
export async function resolveTrimmaUserRoleServer(
  userId: string,
  email: string | null | undefined
): Promise<TrimmaUserRole | null> {
  const supabase = createSupabaseAdminClient();
  return resolveTrimmaRoleFromDb(supabase, userId, email);
}
