import { APP_BASE_URL } from "@/lib/email/config";
import { normalizeEmail } from "@/lib/normalize-email";

/** Shareable login link for salon owner onboarding (works with or without a pre-set owner Gmail). */
export function buildSalonOwnerInviteLoginLink(options: {
  salonId: string;
  ownerEmail?: string | null;
}): string {
  const params = new URLSearchParams();
  params.set("intent", "salon-owner");
  params.set("salon", options.salonId);
  params.set("next", "/dashboard/profile");

  const email = normalizeEmail(options.ownerEmail);
  if (email) {
    params.set("email", email);
  }

  return `${APP_BASE_URL}/login?${params.toString()}`;
}

export function buildSalonOwnerDraftPreviewLink(slug?: string | null, salonId?: string | null): string {
  const id = slug || salonId;
  if (!id) return APP_BASE_URL;
  return `${APP_BASE_URL}/salons/${id}?preview=true`;
}
