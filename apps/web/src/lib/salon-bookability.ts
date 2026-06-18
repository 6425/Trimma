function normalizePhoneDigits(phone: string | null | undefined): string {
  return (phone || "").replace(/\D/g, "");
}

export function hasSalonWhatsAppPhone(phone: string | null | undefined): boolean {
  return normalizePhoneDigits(phone).length >= 9;
}

export function hasValidSalonOwnerEmail(
  ownerEmail: string | null | undefined,
  ownerGmail?: string | null | undefined
): boolean {
  const candidates = [ownerEmail, ownerGmail].filter(
    (value): value is string => typeof value === "string" && value.trim().length > 0
  );

  return candidates.some((email) => {
    const normalized = email.trim().toLowerCase();
    return normalized.includes("@") && !normalized.includes("draft-");
  });
}

export function isSalonPubliclyBookable(salon: {
  booking_enabled?: boolean | null;
  phone?: string | null;
}): boolean {
  return Boolean(salon.booking_enabled && hasSalonWhatsAppPhone(salon.phone));
}

export function getSalonBookabilityMessage(salon: {
  booking_enabled?: boolean | null;
  phone?: string | null;
  booking_disabled_message?: string | null;
}): { title: string; body: string } | null {
  if (isSalonPubliclyBookable(salon)) return null;

  if (!salon.booking_enabled) {
    return {
      title: "Verification in Progress",
      body:
        salon.booking_disabled_message ||
        "This salon is currently completing our verification process to ensure the highest quality standards. Online bookings will be automatically enabled once the owner's verification is complete.",
    };
  }

  return {
    title: "Missing Contact Details",
    body: "This salon is verified but has not provided a valid WhatsApp number yet. Online booking will be enabled once the owner updates their business profile.",
  };
}

export function getSalonBookingBlockedToast(salon: {
  booking_enabled?: boolean | null;
  phone?: string | null;
}): string {
  if (!salon.booking_enabled) {
    return "This salon is currently under verification. Bookings are temporarily unavailable until owner activation is completed.";
  }

  if (!hasSalonWhatsAppPhone(salon.phone)) {
    return "Booking is unavailable because the salon has not provided a valid WhatsApp number.";
  }

  return "Booking is temporarily unavailable for this salon.";
}
