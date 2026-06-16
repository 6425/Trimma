import type { BookingCheckoutDraft } from "@/lib/booking-checkout";

export type BookingStripeCustomer = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
};

export function buildBookingStripePayload(input: {
  draft: BookingCheckoutDraft;
  customer: BookingStripeCustomer;
  reservationFee: number;
  serviceTotal: number;
  rates: { platform: number; salon: number; agent: number };
  salon: Record<string, unknown>;
  services: Record<string, unknown>[];
  staffMemberId: string | null;
  totalDuration: number;
}) {
  const { draft, customer, salon, services, staffMemberId, reservationFee, serviceTotal, rates, totalDuration } =
    input;

  return {
    draft: {
      salonId: draft.salonId,
      serviceIds: draft.serviceIds,
      staffId: draft.staffId,
      bookingDate: draft.bookingDate,
      timeSlot: draft.timeSlot,
      promotionPackageId: draft.promotionPackageId,
      promotionPackageName: draft.promotionPackageName,
      promotionPackagePrice: draft.promotionPackagePrice,
      promotionPackageIncludedServices: draft.promotionPackageIncludedServices,
    },
    customer,
    reservationFee,
    serviceTotal,
    rates,
    salon: {
      id: salon.id,
      onboarding_agent_email: salon.onboarding_agent_email,
      assign_to: salon.assign_to,
    },
    services,
    staffMemberId,
    totalDuration,
  };
}
