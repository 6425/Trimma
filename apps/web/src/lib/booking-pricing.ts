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

import type { SalonOnboardingSnapshot } from "@/lib/salon-onboarding-progress";

export function getReservationDepositPercentForSalon(
  _salon?: SalonOnboardingSnapshot | null
): number {
  return RESERVATION_DEPOSIT_PERCENT;
}

export function calculateReservationFee(
  serviceTotal: number,
  depositPercent: number = RESERVATION_DEPOSIT_PERCENT
): number {
  return serviceTotal * (depositPercent / 100);
}

export function calculateBalanceDue(
  serviceTotal: number,
  depositPercent: number = RESERVATION_DEPOSIT_PERCENT
): number {
  return serviceTotal - calculateReservationFee(serviceTotal, depositPercent);
}

export function calculateCommissionSplit(
  serviceTotal: number,
  rates: BookingCommissionRates,
  depositPercent: number = RESERVATION_DEPOSIT_PERCENT
) {
  const reservationFee = calculateReservationFee(serviceTotal, depositPercent);

  return {
    reservationFee,
    platformCommission: serviceTotal * (rates.platform / 100),
    salonUpfront: serviceTotal * (rates.salon / 100),
  };
}

/** Platform share after the agent referral cut (agent % is taken from the platform fee). */
export function calculatePlatformNetCommission(
  platformGross: number,
  agentCommission: number
): number {
  return Math.max(0, platformGross - Math.max(0, agentCommission));
}

/** Effective platform % of service total once agent referral is deducted from platform share. */
export function calculateEffectivePlatformRate(
  platformRate: number,
  agentRateOfPlatform: number,
  hasAgentReferral: boolean
): number {
  if (!hasAgentReferral) return platformRate;
  return platformRate * (1 - agentRateOfPlatform / 100);
}

/** Agent booking commission is a % of the platform share, not the full service total. */
export function formatBookingAgentRateLabel(agentPercentOfPlatform: number): string {
  const pct = resolveBookingAgentPercentage(agentPercentOfPlatform);
  return `${pct}% of platform share`;
}
