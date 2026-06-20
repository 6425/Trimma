import { cookies } from "next/headers";
import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { ensureSalonOwnerAccess } from "@/lib/ensure-salon-owner-access";
import { forceSalonOwnerUpgrade } from "@/lib/force-salon-owner-upgrade";
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
  let chunkedToken = "";
  for (let i = 0; i < 5; i++) {
    const chunk = cookieStore.get(`sb-access-token.${i}`)?.value;
    if (chunk) chunkedToken += chunk;
  }
  
  const raw = chunkedToken || cookieStore.get("sb-access-token")?.value;
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

  const { data: byOwnerEmail, error: ownerEmailError } = await supabase
    .from("salons")
    .select("*")
    .ilike("owner_email", normalized)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (ownerEmailError) throw new Error(ownerEmailError.message);
  if (byOwnerEmail) return byOwnerEmail as Record<string, unknown>;

  const { data: byOwnerGmail, error: ownerGmailError } = await supabase
    .from("salons")
    .select("*")
    .ilike("owner_gmail", normalized)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (ownerGmailError) throw new Error(ownerGmailError.message);
  return (byOwnerGmail as Record<string, unknown> | null) ?? null;
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

  let salon: Record<string, unknown> | null;
  try {
    await ensureSalonOwnerAccess(supabase, email);
    salon = await findOwnerSalon(supabase, email);

    if (!salon?.id) {
      const upgraded = await forceSalonOwnerUpgrade(
        supabase,
        user.id,
        email,
        (user.user_metadata?.full_name as string | undefined) ||
          (user.user_metadata?.first_name as string | undefined),
        (user.user_metadata?.avatar_url as string | undefined) ?? null
      );

      salon =
        (await findOwnerSalon(supabase, email)) ||
        (await supabase
          .from("salons")
          .select("*")
          .eq("id", upgraded.salonId)
          .maybeSingle()
          .then(({ data }) => (data as Record<string, unknown> | null) ?? null));
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not load your salon.";
    return { error: message };
  }

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
