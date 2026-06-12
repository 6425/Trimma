import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { requirePlatformAdminFromCookies } from "@/lib/server-admin-auth";
import type { SupabaseClient } from "@supabase/supabase-js";

export type AdminDbResult<T> = { success: true; data: T } | { success: false; error: string };

const ADMIN_USER_ROLE_PATCH = "packages/db/ADMIN_USER_ROLE_PATCH.sql";

export function isMissingDbSchemaError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("does not exist") ||
    lower.includes("relation") ||
    (lower.includes("schema cache") && lower.includes("column")) ||
    (lower.includes("could not find") && lower.includes("column"))
  );
}

export function mapAdminDbError(message: string, hint?: string): string {
  console.error("[mapAdminDbError] Raw DB Error:", message);
  const lower = message.toLowerCase();
  if (
    lower.includes("agent_tier") ||
    lower.includes("reports_to_agent_id") ||
    lower.includes("sub_agent_split_percent")
  ) {
    return `Agent hierarchy schema is missing. Run ${ADMIN_USER_ROLE_PATCH} in Supabase SQL Editor.`;
  }
  if (lower.includes("user_roles") && (lower.includes("does not exist") || lower.includes("relation"))) {
    return `user_roles table is missing. Run ${ADMIN_USER_ROLE_PATCH} in Supabase SQL Editor.`;
  }
  if (isMissingDbSchemaError(message)) {
    return hint || `Database schema is out of date. Run ${ADMIN_USER_ROLE_PATCH} in Supabase SQL Editor.`;
  }
  if (lower.includes("duplicate key") || lower.includes("salons_slug_key")) {
    return "A record with this slug already exists. Choose a different name or slug.";
  }
  if (lower.includes("could not find") && lower.includes("column")) {
    return "Save included an invalid salon field. Refresh the page and try again.";
  }
  if (lower.includes("foreign key") || lower.includes("violates")) {
    return "Could not save salon owner details. The platform will create the owner account automatically on retry.";
  }
  if (lower.includes("row-level security") || lower.includes("permission denied")) {
    return "Save blocked by database permissions. Ensure your account has admin role.";
  }
  if (message.includes("SUPABASE_SERVICE_ROLE_KEY")) {
    return "Server is missing SUPABASE_SERVICE_ROLE_KEY. Add it in Vercel environment variables.";
  }
  return message;
}

export async function withAdminDb<T>(
  fn: (supabase: SupabaseClient) => Promise<T>
): Promise<AdminDbResult<T>> {
  try {
    const auth = await requirePlatformAdminFromCookies();
    if ("error" in auth) {
      return { success: false as const, error: auth.error };
    }

    const supabase = createSupabaseAdminClient();
    const data = await fn(supabase);
    return { success: true as const, data };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Request failed.";
    return { success: false as const, error: mapAdminDbError(message) };
  }
}

export function isAdminDbSuccess<T>(result: AdminDbResult<T>): result is { success: true; data: T } {
  return result.success === true;
}

export function adminDbFailure<T>(
  result: AdminDbResult<T>,
  hint?: string
): { success: false; error: string } {
  const message = result.success === false ? result.error : "Request failed.";
  return { success: false as const, error: mapAdminDbError(message, hint) };
}
