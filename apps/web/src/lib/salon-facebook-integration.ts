import type { SupabaseClient } from "@supabase/supabase-js";

export type StoredFacebookPage = {
  id: string;
  name: string;
  access_token: string;
  category?: string;
};

export type SalonFacebookIntegrationRow = {
  salon_id: string;
  facebook_page_url: string | null;
  facebook_page_id: string | null;
  facebook_page_name: string | null;
  facebook_page_access_token: string | null;
  facebook_user_access_token: string | null;
  facebook_connected: boolean;
  facebook_connected_at: string | null;
  booking_cta_enabled: boolean;
  booking_cta_label: string;
  auto_publish_promos: boolean;
  auto_publish_services: boolean;
  pending_pages: StoredFacebookPage[] | null;
};

export type SalonFacebookIntegrationPatch = Partial<
  Omit<SalonFacebookIntegrationRow, "salon_id">
>;

function normalizePendingPages(value: unknown): StoredFacebookPage[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((row) => row && typeof row === "object")
    .map((row) => row as StoredFacebookPage)
    .filter((row) => Boolean(row.id && row.name && row.access_token));
}

function rowFromLegacySocialSettings(salon: Record<string, unknown>): SalonFacebookIntegrationRow | null {
  const raw = salon.social_settings;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const settings = raw as Record<string, unknown>;

  return {
    salon_id: String(salon.id || ""),
    facebook_page_url: typeof settings.facebook_page_url === "string" ? settings.facebook_page_url : null,
    facebook_page_id: typeof settings.facebook_page_id === "string" ? settings.facebook_page_id : null,
    facebook_page_name: typeof settings.facebook_page_name === "string" ? settings.facebook_page_name : null,
    facebook_page_access_token:
      typeof settings.facebook_page_access_token === "string" ? settings.facebook_page_access_token : null,
    facebook_user_access_token:
      typeof settings.facebook_user_access_token === "string" ? settings.facebook_user_access_token : null,
    facebook_connected: settings.facebook_connected === true,
    facebook_connected_at:
      typeof settings.facebook_connected_at === "string" ? settings.facebook_connected_at : null,
    booking_cta_enabled: settings.booking_cta_enabled !== false,
    booking_cta_label:
      typeof settings.booking_cta_label === "string" && settings.booking_cta_label.trim()
        ? settings.booking_cta_label.trim()
        : "Book Now",
    auto_publish_promos: settings.auto_publish_promos === true,
    auto_publish_services: settings.auto_publish_services !== false,
    pending_pages: normalizePendingPages(settings.facebook_pending_pages),
  };
}

function mapRow(data: Record<string, unknown>): SalonFacebookIntegrationRow {
  return {
    salon_id: String(data.salon_id),
    facebook_page_url: typeof data.facebook_page_url === "string" ? data.facebook_page_url : null,
    facebook_page_id: typeof data.facebook_page_id === "string" ? data.facebook_page_id : null,
    facebook_page_name: typeof data.facebook_page_name === "string" ? data.facebook_page_name : null,
    facebook_page_access_token:
      typeof data.facebook_page_access_token === "string" ? data.facebook_page_access_token : null,
    facebook_user_access_token:
      typeof data.facebook_user_access_token === "string" ? data.facebook_user_access_token : null,
    facebook_connected: data.facebook_connected === true,
    facebook_connected_at:
      typeof data.facebook_connected_at === "string" ? data.facebook_connected_at : null,
    booking_cta_enabled: data.booking_cta_enabled !== false,
    booking_cta_label:
      typeof data.booking_cta_label === "string" && data.booking_cta_label.trim()
        ? data.booking_cta_label.trim()
        : "Book Now",
    auto_publish_promos: data.auto_publish_promos === true,
    auto_publish_services: data.auto_publish_services !== false,
    pending_pages: normalizePendingPages(data.pending_pages),
  };
}

function isMissingTableError(message: string): boolean {
  const lower = message.toLowerCase();
  return lower.includes("salon_facebook_integrations") && lower.includes("does not exist");
}

export async function getSalonFacebookIntegration(
  supabase: SupabaseClient,
  salon: Record<string, unknown>
): Promise<SalonFacebookIntegrationRow> {
  const salonId = String(salon.id || "");
  const { data, error } = await supabase
    .from("salon_facebook_integrations")
    .select("*")
    .eq("salon_id", salonId)
    .maybeSingle();

  if (error) {
    if (isMissingTableError(error.message)) {
      const legacy = rowFromLegacySocialSettings(salon);
      if (legacy) return legacy;
      return emptyIntegrationRow(salonId);
    }
    throw new Error(error.message);
  }

  if (!data) {
    const legacy = rowFromLegacySocialSettings(salon);
    if (legacy) return legacy;
    return emptyIntegrationRow(salonId);
  }

  return mapRow(data as Record<string, unknown>);
}

function emptyIntegrationRow(salonId: string): SalonFacebookIntegrationRow {
  return {
    salon_id: salonId,
    facebook_page_url: null,
    facebook_page_id: null,
    facebook_page_name: null,
    facebook_page_access_token: null,
    facebook_user_access_token: null,
    facebook_connected: false,
    facebook_connected_at: null,
    booking_cta_enabled: true,
    booking_cta_label: "Book Now",
    auto_publish_promos: false,
    auto_publish_services: true,
    pending_pages: [],
  };
}

export async function upsertSalonFacebookIntegration(
  supabase: SupabaseClient,
  salonId: string,
  patch: SalonFacebookIntegrationPatch
) {
  const payload = {
    ...patch,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("salon_facebook_integrations").upsert(
    {
      salon_id: salonId,
      ...payload,
    },
    { onConflict: "salon_id" }
  );

  if (error) {
    if (isMissingTableError(error.message)) {
      await upsertLegacySocialSettings(supabase, salonId, patch);
      return;
    }
    throw new Error(error.message);
  }

  await mirrorFacebookFlagsToSocialSettings(supabase, salonId, patch);
}

async function upsertLegacySocialSettings(
  supabase: SupabaseClient,
  salonId: string,
  patch: SalonFacebookIntegrationPatch
) {
  const { data: salon, error: readError } = await supabase
    .from("salons")
    .select("social_settings")
    .eq("id", salonId)
    .maybeSingle();

  if (readError) throw new Error(readError.message);
  if (!salon) throw new Error("Salon not found.");

  const current =
    salon.social_settings && typeof salon.social_settings === "object" && !Array.isArray(salon.social_settings)
      ? salon.social_settings
      : {};

  const next = {
    ...current,
    facebook_page_url: patch.facebook_page_url ?? (current as Record<string, unknown>).facebook_page_url,
    facebook_page_id: patch.facebook_page_id ?? (current as Record<string, unknown>).facebook_page_id,
    facebook_page_name: patch.facebook_page_name ?? (current as Record<string, unknown>).facebook_page_name,
    facebook_page_access_token:
      patch.facebook_page_access_token ?? (current as Record<string, unknown>).facebook_page_access_token,
    facebook_user_access_token:
      patch.facebook_user_access_token ?? (current as Record<string, unknown>).facebook_user_access_token,
    facebook_connected: patch.facebook_connected ?? (current as Record<string, unknown>).facebook_connected,
    facebook_connected_at:
      patch.facebook_connected_at ?? (current as Record<string, unknown>).facebook_connected_at,
    booking_cta_enabled: patch.booking_cta_enabled ?? (current as Record<string, unknown>).booking_cta_enabled,
    booking_cta_label: patch.booking_cta_label ?? (current as Record<string, unknown>).booking_cta_label,
    auto_publish_promos: patch.auto_publish_promos ?? (current as Record<string, unknown>).auto_publish_promos,
    auto_publish_services:
      patch.auto_publish_services ?? (current as Record<string, unknown>).auto_publish_services,
    facebook_pending_pages: patch.pending_pages ?? (current as Record<string, unknown>).facebook_pending_pages,
  };

  const { error: updateError } = await supabase
    .from("salons")
    .update({ social_settings: next })
    .eq("id", salonId);

  if (updateError) throw new Error(updateError.message);
}

async function mirrorFacebookFlagsToSocialSettings(
  supabase: SupabaseClient,
  salonId: string,
  patch: SalonFacebookIntegrationPatch
) {
  const mirror: Record<string, unknown> = {};
  if (patch.facebook_connected != null) mirror.facebook_connected = patch.facebook_connected;
  if (patch.facebook_page_id !== undefined) mirror.facebook_page_id = patch.facebook_page_id;
  if (patch.facebook_page_name !== undefined) mirror.facebook_page_name = patch.facebook_page_name;
  if (Object.keys(mirror).length === 0) return;

  const { data: salon, error: readError } = await supabase
    .from("salons")
    .select("social_settings")
    .eq("id", salonId)
    .maybeSingle();

  if (readError || !salon) return;

  const current =
    salon.social_settings && typeof salon.social_settings === "object" && !Array.isArray(salon.social_settings)
      ? salon.social_settings
      : {};

  await supabase
    .from("salons")
    .update({ social_settings: { ...current, ...mirror } })
    .eq("id", salonId);
}

export function resolveSalonBookingUrl(salon: Record<string, unknown>): string {
  const slug = typeof salon.slug === "string" ? salon.slug.trim() : "";
  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    process.env.APP_URL?.replace(/\/$/, "") ||
    "https://www.trimma.io";
  return slug ? `${base}/salons/${slug}` : `${base}/salons`;
}
