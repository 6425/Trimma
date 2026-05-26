export const BOOKING_CHECKOUT_STORAGE_KEY = "trimma_booking_checkout_draft";

export type BookingCheckoutDraft = {
  salonId: string;
  salonSlug?: string;
  serviceIds: string[];
  staffId: string;
  bookingDate: string;
  timeSlot: string;
  promotionPackageId?: string;
  promotionPackageName?: string;
  promotionPackagePrice?: number;
  promotionPackageIncludedServices?: string[];
  customerDetails: {
    fullName: string;
    email: string;
    phone: string;
  };
};

export function saveBookingCheckoutDraft(draft: BookingCheckoutDraft): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(BOOKING_CHECKOUT_STORAGE_KEY, JSON.stringify(draft));
}

export function loadBookingCheckoutDraft(): BookingCheckoutDraft | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(BOOKING_CHECKOUT_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as BookingCheckoutDraft;
  } catch {
    return null;
  }
}

export function clearBookingCheckoutDraft(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(BOOKING_CHECKOUT_STORAGE_KEY);
}

export function splitCustomerName(fullName: string): { firstName: string; lastName: string } {
  const trimmed = fullName.trim();
  if (!trimmed) return { firstName: "Guest", lastName: "Client" };
  const parts = trimmed.split(/\s+/);
  return {
    firstName: parts[0] || "Guest",
    lastName: parts.slice(1).join(" ") || "Client",
  };
}
