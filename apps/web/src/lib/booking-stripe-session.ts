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
}) {
  const { draft, customer, reservationFee, serviceTotal } = input;

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
  };
}
