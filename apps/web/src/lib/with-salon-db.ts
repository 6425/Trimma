import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { requireSalonOwnerFromCookies, type SalonOwnerContext } from "@/lib/server-salon-auth";
import type { SupabaseClient } from "@supabase/supabase-js";

export type SalonDbResult<T> = { success: true; data: T } | { success: false; error: string };

export function mapSalonDbError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("row-level security") || lower.includes("permission denied")) {
    return "Save blocked by database permissions.";
  }
  if (message.includes("Supabase server credentials are missing")) {
    return "Server database credentials are misconfigured.";
  }
  return message;
}

export async function withSalonDb<T>(
  fn: (supabase: SupabaseClient, ctx: SalonOwnerContext) => Promise<T>
): Promise<SalonDbResult<T>> {
  try {
    const auth = await requireSalonOwnerFromCookies();
    if ("error" in auth) {
      return { success: false as const, error: auth.error };
    }

    const supabase = createSupabaseAdminClient();
    const data = await fn(supabase, auth);
    return { success: true as const, data };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Request failed.";
    return { success: false as const, error: mapSalonDbError(message) };
  }
}

export function isSalonDbSuccess<T>(result: SalonDbResult<T>): result is { success: true; data: T } {
  return result.success === true;
}

export function salonDbFailure<T>(result: SalonDbResult<T>): { success: false; error: string } {
  const message = result.success === false ? result.error : "Request failed.";
  return { success: false as const, error: mapSalonDbError(message) };
}
