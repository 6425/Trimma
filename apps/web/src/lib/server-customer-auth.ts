import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { getSalonAccessTokenFromCookies } from "@/lib/server-salon-auth";
import { normalizeEmail } from "@/lib/normalize-email";
import { resolveTrimmaUserRoleServer } from "@/lib/trimma-role-server";
import type { TrimmaUserRole } from "@/lib/auth-routes";

const ALLOWED_CUSTOMER_API_ROLES = new Set<TrimmaUserRole>(["customer", "salon_owner"]);

export type CustomerContext = {
  accessToken: string;
  email: string;
  userId: string;
  userMetadata: Record<string, unknown>;
  phone: string | null;
};

export async function getCustomerAccessTokenFromCookies(): Promise<string | null> {
  return getSalonAccessTokenFromCookies();
}

export async function requireCustomerFromCookies(): Promise<CustomerContext | { error: string }> {
  const accessToken = await getCustomerAccessTokenFromCookies();
  if (!accessToken) {
    return { error: "Please sign in to access your customer dashboard." };
  }

  const supabase = createSupabaseAdminClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(accessToken);

  if (userError || !user?.email) {
    return { error: "Your session expired. Please sign in again." };
  }

  const email = normalizeEmail(user.email)!;
  const role = await resolveTrimmaUserRoleServer(user.id, email);

  if (!role || !ALLOWED_CUSTOMER_API_ROLES.has(role)) {
    return { error: "This endpoint is only available for customer accounts." };
  }

  return {
    accessToken,
    email,
    userId: user.id,
    userMetadata: (user.user_metadata as Record<string, unknown>) || {},
    phone: user.phone || (user.user_metadata?.phone as string | undefined) || null,
  };
}
