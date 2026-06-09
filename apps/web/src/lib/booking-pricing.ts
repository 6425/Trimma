export const RESERVATION_DEPOSIT_PERCENT = 20;
export const DEFAULT_BOOKING_AGENT_PERCENT = 20;

/** commission_master may seed booking agent % as 0 — treat that as "use default". */
export function resolveBookingAgentPercentage(stored: number | null | undefined): number {
  const value = Number(stored);
  return value > 0 ? value : DEFAULT_BOOKING_AGENT_PERCENT;
}

export type BookingCommissionRates = {
  platform: number;
  salon: number;
};

export function calculateReservationFee(serviceTotal: number): number {
  return serviceTotal * (RESERVATION_DEPOSIT_PERCENT / 100);
}

export function calculateBalanceDue(serviceTotal: number): number {
  return serviceTotal - calculateReservationFee(serviceTotal);
}

export function calculateCommissionSplit(
  serviceTotal: number,
  rates: BookingCommissionRates
) {
  const reservationFee = calculateReservationFee(serviceTotal);

  return {
    reservationFee,
    platformCommission: serviceTotal * (rates.platform / 100),
    salonUpfront: serviceTotal * (rates.salon / 100),
  };
}
