import { cookies } from "next/headers";
import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { normalizeEmail } from "@/lib/normalize-email";
import type { SupabaseClient } from "@supabase/supabase-js";

export type SalonOwnerContext = {
  accessToken: string;
  email: string;
  userId: string;
  salon: Record<string, unknown>;
  salonId: string;
};

export async function getSalonAccessTokenFromCookies(): Promise<string | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get("sb-access-token")?.value;
  if (!raw) return null;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export async function getSalonOwnerEmailFromCookies(): Promise<string | null> {
  const accessToken = await getSalonAccessTokenFromCookies();
  if (!accessToken) return null;

  try {
    const supabase = createSupabaseAdminClient();
    const {
      data: { user },
    } = await supabase.auth.getUser(accessToken);
    return normalizeEmail(user?.email) || null;
  } catch {
    return null;
  }
}

export async function findOwnerSalon(
  supabase: SupabaseClient,
  email: string
): Promise<Record<string, unknown> | null> {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;

  const { data, error } = await supabase
    .from("salons")
    .select("*")
    .or(`owner_email.eq.${normalized},owner_gmail.eq.${normalized}`)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as Record<string, unknown> | null;
}

export async function requireSalonOwnerFromCookies(): Promise<
  SalonOwnerContext | { error: string }
> {
  const accessToken = await getSalonAccessTokenFromCookies();
  if (!accessToken) {
    return { error: "Please sign in to access your salon dashboard." };
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
  const salon = await findOwnerSalon(supabase, email);
  if (!salon?.id) {
    return { error: "No salon is linked to your account yet." };
  }

  return {
    accessToken,
    email,
    userId: user.id,
    salon,
    salonId: String(salon.id),
  };
}
