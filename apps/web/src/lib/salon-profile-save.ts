import type { SupabaseClient } from "@supabase/supabase-js";
import { sanitizeText } from "@/lib/sanitize-input";


const SALON_PROFILE_TEXT_FIELDS = [
  "name",
  "phone",
  "email",
  "address",
  "city",
  "province",
  "district",
  "description",
  "summary",
  "category",
  "map_url",
  "website",
] as const;

export const SALON_PROFILE_UPDATE_FIELDS = [
  "name",
  "slug",
  "phone",
  "email",
  "address",
  "city",
  "province",
  "district",
  "description",
  "summary",
  "working_hours",
  "logo_url",
  "cover_url",
  "hero_url",
  "featured_images",
  "status",
  "category",
  "price_level",
  "latitude",
  "longitude",
  "rating",
  "map_url",
  "website",
  "business_info_extended",
  "bank_info"
] as const;

export type SalonScheduleDay = {
  isWorking: boolean;
  start: string;
  end: string;
};

export function slugifySalonName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export async function applySalonSlugOnNameChange(
  supabase: SupabaseClient,
  salonId: string,
  payload: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const next = { ...payload };
  delete next.slug;

  if (typeof next.name !== "string" || !next.name.trim()) {
    return next;
  }

  const trimmedName = next.name.trim();
  const { data: current, error: currentError } = await supabase
    .from("salons")
    .select("name, slug")
    .eq("id", salonId)
    .maybeSingle();
  if (currentError) throw new Error(currentError.message);

  const currentName = (current?.name || "").trim();
  if (current && trimmedName === currentName) {
    return next;
  }

  const nextSlug = slugifySalonName(trimmedName);
  if (!nextSlug) return next;

  const { data: slugOwner, error: slugError } = await supabase
    .from("salons")
    .select("id")
    .eq("slug", nextSlug)
    .maybeSingle();
  if (slugError) throw new Error(slugError.message);

  next.slug =
    !slugOwner || slugOwner.id === salonId
      ? nextSlug
      : `${nextSlug}-${salonId.replace(/-/g, "").slice(0, 12)}`;

  return next;
}

export function parseSalonScheduleFromWorkingHours(
  workingHours: unknown
): Record<string, SalonScheduleDay> {
  if (!workingHours) return {};

  let parsed: unknown = workingHours;
  if (typeof workingHours === "string") {
    try {
      parsed = JSON.parse(workingHours);
    } catch {
      return {};
    }
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return {};
  }

  const schedule = parsed as Record<string, SalonScheduleDay>;
  if (!schedule.monday) return {};

  return schedule;
}

export function pickSalonProfileUpdate(
  profile: Record<string, unknown>
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  for (const key of SALON_PROFILE_UPDATE_FIELDS) {
    if (key in profile) {
      payload[key] = profile[key];
    }
  }

  for (const key of SALON_PROFILE_TEXT_FIELDS) {
    if (typeof payload[key] === "string") {
      payload[key] = sanitizeText(payload[key] as string);
    }
  }

  if (typeof payload.working_hours !== "string" && payload.working_hours != null) {
    payload.working_hours = JSON.stringify(payload.working_hours);
  }

  return payload;
}

export function formatServerActionError(err: unknown): string {
  if (!(err instanceof Error)) return "Something went wrong. Please try again.";

  const message = err.message || "Something went wrong. Please try again.";
  if (message.includes("Server Components render")) {
    return "The server rejected this save. Sign out and back in, then try again. If it persists, check Vercel function logs.";
  }

  return message;
}
