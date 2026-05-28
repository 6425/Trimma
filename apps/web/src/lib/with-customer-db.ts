import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { requireCustomerFromCookies, type CustomerContext } from "@/lib/server-customer-auth";
import type { SupabaseClient } from "@supabase/supabase-js";

export type CustomerDbResult<T> = { success: true; data: T } | { success: false; error: string };

export function mapCustomerDbError(message: string, hint?: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("does not exist") || lower.includes("schema cache")) {
    return hint || "Database table is missing. Run the matching packages/db patch in Supabase SQL Editor.";
  }
  if (lower.includes("row-level security") || lower.includes("permission denied")) {
    return "Request blocked by database permissions.";
  }
  if (message.includes("Supabase server credentials are missing")) {
    return "Server database credentials are misconfigured.";
  }
  return message;
}

export async function withCustomerDb<T>(
  fn: (supabase: SupabaseClient, ctx: CustomerContext) => Promise<T>
): Promise<CustomerDbResult<T>> {
  try {
    const auth = await requireCustomerFromCookies();
    if ("error" in auth) {
      return { success: false as const, error: auth.error };
    }

    const supabase = createSupabaseAdminClient();
    const data = await fn(supabase, auth);
    return { success: true as const, data };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Request failed.";
    return { success: false as const, error: mapCustomerDbError(message) };
  }
}

export function isCustomerDbSuccess<T>(result: CustomerDbResult<T>): result is { success: true; data: T } {
  return result.success === true;
}

export function customerDbFailure<T>(
  result: CustomerDbResult<T>,
  hint?: string
): { success: false; error: string } {
  const message = result.success === false ? result.error : "Request failed.";
  return { success: false as const, error: mapCustomerDbError(message, hint) };
}
