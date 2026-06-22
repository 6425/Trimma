import type { AgentCommissionAttribution } from "@/lib/agent-hierarchy";
import {
  calculateRegionalHeadNet,
  calculateSubAgentShare,
} from "@/lib/agent-hierarchy";
import { RESERVATION_DEPOSIT_PERCENT } from "@/lib/booking-pricing";

export type AgentCommissionSnapshot = {
  field_agent_commission_amount: number;
  regional_head_commission_amount: number;
  agent_split_percent: number;
};

export function computeAgentCommissionSnapshot(
  grossAgentAmount: number,
  attribution: Pick<AgentCommissionAttribution, "fieldAgentEmail" | "splitPercent">
): AgentCommissionSnapshot {
  const gross = Math.max(0, Number(grossAgentAmount) || 0);
  if (!attribution.fieldAgentEmail || gross <= 0) {
    return {
      field_agent_commission_amount: 0,
      regional_head_commission_amount: gross,
      agent_split_percent: 0,
    };
  }

  const splitPercent = attribution.splitPercent;
  return {
    field_agent_commission_amount: calculateSubAgentShare(gross, splitPercent),
    regional_head_commission_amount: calculateRegionalHeadNet(gross, splitPercent),
    agent_split_percent: splitPercent,
  };
}

export type BookingFinancialInput = {
  amount?: number | string | null;
  total_reservation_fee?: number | string | null;
  platform_commission_amount?: number | string | null;
  platform_commission_percent?: number | string | null;
  salon_upfront_amount?: number | string | null;
  staff_commission_amount?: number | string | null;
  agent_commission_amount?: number | string | null;
};

export type BookingFinancialBreakdown = {
  serviceTotal: number;
  reservationDeposit: number;
  reservationDepositPercent: number;
  platformCommission: number;
  platformCommissionPercent: number;
  salonUpfront: number;
  balanceDue: number;
  staffCommission: number;
  agentCommission: number;
};

function toAmount(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function resolveBookingFinancialBreakdown(
  booking: BookingFinancialInput,
  fallbackDepositPercent = RESERVATION_DEPOSIT_PERCENT
): BookingFinancialBreakdown {
  const serviceTotal = toAmount(booking.amount);
  const storedDeposit = toAmount(booking.total_reservation_fee);
  const reservationDeposit =
    storedDeposit > 0 ? storedDeposit : serviceTotal * (fallbackDepositPercent / 100);
  const reservationDepositPercent =
    serviceTotal > 0
      ? Math.round((reservationDeposit / serviceTotal) * 1000) / 10
      : fallbackDepositPercent;

  const platformCommission = toAmount(booking.platform_commission_amount);
  const salonUpfront = toAmount(booking.salon_upfront_amount);
  const staffCommission = toAmount(booking.staff_commission_amount);
  const agentCommission = toAmount(booking.agent_commission_amount);

  const platformCommissionPercent =
    toAmount(booking.platform_commission_percent) ||
    (serviceTotal > 0 ? Math.round((platformCommission / serviceTotal) * 1000) / 10 : 10);

  const balanceDue = Math.max(0, serviceTotal - reservationDeposit);

  return {
    serviceTotal,
    reservationDeposit,
    reservationDepositPercent,
    platformCommission,
    platformCommissionPercent,
    salonUpfront,
    balanceDue,
    staffCommission,
    agentCommission,
  };
}

export type StoredAgentSplitInput = {
  agent_commission_amount?: number | string | null;
  field_agent_email?: string | null;
  field_agent_commission_amount?: number | string | null;
  regional_head_commission_amount?: number | string | null;
  agent_split_percent?: number | string | null;
};

export function resolveStoredAgentSplit(
  row: StoredAgentSplitInput,
  fallback: { gross: number; fieldEmail: string; splitPercent: number }
): { subAgentCut: number; headCut: number; splitPercent: number } {
  const gross = toAmount(row.agent_commission_amount) || fallback.gross;
  const fieldEmail = String(row.field_agent_email || "").trim() || fallback.fieldEmail;
  const storedField = toAmount(row.field_agent_commission_amount);
  const storedHead = toAmount(row.regional_head_commission_amount);
  const storedSplit = toAmount(row.agent_split_percent);

  if (storedField > 0 || storedHead > 0) {
    return {
      subAgentCut: storedField,
      headCut: fieldEmail ? storedHead : gross,
      splitPercent: storedSplit > 0 ? storedSplit : fallback.splitPercent,
    };
  }

  if (!fieldEmail) {
    return { subAgentCut: 0, headCut: gross, splitPercent: 0 };
  }

  return {
    subAgentCut: calculateSubAgentShare(gross, fallback.splitPercent),
    headCut: calculateRegionalHeadNet(gross, fallback.splitPercent),
    splitPercent: fallback.splitPercent,
  };
}
