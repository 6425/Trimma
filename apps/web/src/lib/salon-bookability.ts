function normalizePhoneDigits(phone: string | null | undefined): string {
  return (phone || "").replace(/\D/g, "");
}

export function hasSalonWhatsAppPhone(phone: string | null | undefined): boolean {
  return normalizePhoneDigits(phone).length >= 9;
}

export function resolvePublicSalonOwnerEmail(
  ownerEmail: string | null | undefined,
  ownerGmail?: string | null | undefined
): string | null {
  const candidates = [ownerEmail, ownerGmail].filter(
    (value): value is string => typeof value === "string" && value.trim().length > 0
  );

  for (const email of candidates) {
    const normalized = email.trim().toLowerCase();
    if (normalized.includes("@") && !normalized.includes("draft-")) {
      return email.trim();
    }
  }

  return null;
}

export function hasValidSalonOwnerEmail(
  ownerEmail: string | null | undefined,
  ownerGmail?: string | null | undefined
): boolean {
  return resolvePublicSalonOwnerEmail(ownerEmail, ownerGmail) !== null;
}

export function isSalonPubliclyBookable(salon: {
  booking_enabled?: boolean | null;
  phone?: string | null;
  owner_email?: string | null;
  owner_gmail?: string | null;
}): boolean {
  return Boolean(
    salon.booking_enabled &&
      hasSalonWhatsAppPhone(salon.phone) &&
      hasValidSalonOwnerEmail(salon.owner_email, salon.owner_gmail)
  );
}

export function getSalonBookabilityMessage(salon: {
  booking_enabled?: boolean | null;
  phone?: string | null;
  owner_email?: string | null;
  owner_gmail?: string | null;
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

  const missingPhone = !hasSalonWhatsAppPhone(salon.phone);
  const missingEmail = !hasValidSalonOwnerEmail(salon.owner_email, salon.owner_gmail);

  if (missingPhone && missingEmail) {
    return {
      title: "Missing Contact Details",
      body: "This salon is verified but is missing an email address and WhatsApp number. Online booking will be enabled once the owner updates their business profile.",
    };
  }

  if (missingPhone) {
    return {
      title: "Missing Contact Details",
      body: "This salon is verified but has not provided a valid WhatsApp number yet. Online booking will be enabled once the owner updates their business profile.",
    };
  }

  return {
    title: "Missing Contact Details",
    body: "This salon is verified but is missing an owner email address. Online booking will be enabled once the owner updates their business profile.",
  };
}

export function getSalonBookingBlockedToast(salon: {
  booking_enabled?: boolean | null;
  phone?: string | null;
  owner_email?: string | null;
  owner_gmail?: string | null;
}): string {
  if (!salon.booking_enabled) {
    return "This salon is currently under verification. Bookings are temporarily unavailable until owner activation is completed.";
  }

  const missingPhone = !hasSalonWhatsAppPhone(salon.phone);
  const missingEmail = !hasValidSalonOwnerEmail(salon.owner_email, salon.owner_gmail);

  if (missingPhone && missingEmail) {
    return "Booking is unavailable because the salon has not provided a valid email address and WhatsApp number.";
  }

  if (missingPhone) {
    return "Booking is unavailable because the salon has not provided a valid WhatsApp number.";
  }

  if (missingEmail) {
    return "Booking is unavailable because the salon has not provided a valid owner email address.";
  }

  return "Booking is temporarily unavailable for this salon.";
}
