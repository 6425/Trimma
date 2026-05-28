export const ADMIN_SALON_UPDATE_FIELDS = new Set([
  "name",
  "slug",
  "description",
  "summary",
  "phone",
  "address",
  "city",
  "district",
  "province",
  "location",
  "latitude",
  "longitude",
  "rating",
  "price_level",
  "logo_url",
  "cover_url",
  "hero_url",
  "featured_images",
  "status",
  "is_verified",
  "is_featured",
  "working_hours",
  "owner_email",
  "owner_gmail",
  "place_id",
  "website",
  "map_url",
  "category",
  "onboarding_status",
  "activation_status",
  "source_type",
  "assign_to",
  "admin_notes",
  "agent_notes",
  "public_visibility",
  "booking_enabled",
  "subscription_plan_id",
  "verification_notes",
]);

export function sanitizeAdminNumeric(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = typeof value === "number" ? value : parseFloat(String(value));
  return Number.isFinite(parsed) ? parsed : null;
}

export function sanitizeAdminSalonPayload(payload: Record<string, unknown>): Record<string, unknown> {
  const raw = { ...payload };

  if (typeof raw.email === "string" && raw.email.trim()) {
    const email = raw.email.trim().toLowerCase();
    if (raw.owner_email == null || raw.owner_email === "") raw.owner_email = email;
    if (raw.owner_gmail == null || raw.owner_gmail === "") raw.owner_gmail = email;
  }
  delete raw.email;

  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(raw)) {
    if (!ADMIN_SALON_UPDATE_FIELDS.has(key)) continue;

    if (key === "latitude" || key === "longitude" || key === "rating") {
      sanitized[key] = sanitizeAdminNumeric(value);
      continue;
    }

    if (key === "working_hours") {
      if (value == null || value === "") {
        sanitized[key] = null;
      } else if (typeof value === "string") {
        sanitized[key] = value;
      } else {
        sanitized[key] = JSON.stringify(value);
      }
      continue;
    }

    if (typeof value === "string") {
      sanitized[key] = value.trim() || null;
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}
