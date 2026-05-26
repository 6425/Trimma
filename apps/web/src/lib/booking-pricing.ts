export const RESERVATION_DEPOSIT_PERCENT = 20;

export type BookingCommissionRates = {
  platform: number;
  salon: number;
  payhere: number;
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
  const splitTotal = rates.platform + rates.salon + rates.payhere;

  if (splitTotal <= 0) {
    return {
      reservationFee,
      platformCommission: 0,
      salonUpfront: 0,
      payhereFee: 0,
    };
  }

  return {
    reservationFee,
    platformCommission: reservationFee * (rates.platform / splitTotal),
    salonUpfront: reservationFee * (rates.salon / splitTotal),
    payhereFee: reservationFee * (rates.payhere / splitTotal),
  };
}
