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
  "verified_at",
]);

export function sanitizeAdminNumeric(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = typeof value === "number" ? value : parseFloat(String(value));
  return Number.isFinite(parsed) ? parsed : null;
}

export function normalizeAdminPhone(value: unknown): string | null {
  if (value == null) return null;
  const phone = String(value).trim();
  return phone || null;
}

/** Admin form email always wins — overrides owner_email and owner_gmail. */
export function applyAdminEmailOverride(raw: Record<string, unknown>): Record<string, unknown> {
  const next = { ...raw };

  if ("email" in next) {
    const email = typeof next.email === "string" ? next.email.trim().toLowerCase() : "";
    if (email) {
      next.owner_email = email;
      next.owner_gmail = email;
    }
    delete next.email;
  }

  return next;
}

export function sanitizeAdminSalonPayload(payload: Record<string, unknown>): Record<string, unknown> {
  const raw = applyAdminEmailOverride(payload);
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(raw)) {
    if (value === undefined) continue;
    if (!ADMIN_SALON_UPDATE_FIELDS.has(key)) continue;

    if (key === "latitude" || key === "longitude" || key === "rating") {
      sanitized[key] = sanitizeAdminNumeric(value);
      continue;
    }

    if (key === "phone") {
      sanitized[key] = normalizeAdminPhone(value);
      continue;
    }

    if (key === "owner_email" || key === "owner_gmail") {
      const email = typeof value === "string" ? value.trim().toLowerCase() : "";
      sanitized[key] = email || null;
      continue;
    }

    if (key === "working_hours") {
      if (value == null || value === "") {
        sanitized[key] = null;
      } else if (typeof value === "string") {
        sanitized[key] = value.trim() || null;
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

export function buildAdminSalonFormPayload(input: {
  name?: string;
  description?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  district?: string;
  province?: string;
  latitude?: string;
  longitude?: string;
  rating?: string;
  logo_url?: string;
  cover_url?: string;
  status?: string;
  working_hours?: string;
  is_verified?: boolean;
}): Record<string, unknown> {
  const parseOptionalFloat = (value?: string) => {
    const trimmed = (value || "").trim();
    if (!trimmed) return null;
    const parsed = parseFloat(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  };

  return {
    name: input.name?.trim() || "",
    description: input.description?.trim() || null,
    email: input.email?.trim() || "",
    phone: input.phone?.trim() || "",
    address: input.address?.trim() || null,
    city: input.city?.trim() || null,
    district: input.district?.trim() || null,
    province: input.province?.trim() || null,
    latitude: parseOptionalFloat(input.latitude),
    longitude: parseOptionalFloat(input.longitude),
    rating: parseOptionalFloat(input.rating),
    logo_url: input.logo_url?.trim() || null,
    cover_url: input.cover_url?.trim() || null,
    status: input.status || "active",
    working_hours: (input.working_hours || "").trim() || null,
    is_verified: Boolean(input.is_verified),
  };
}
