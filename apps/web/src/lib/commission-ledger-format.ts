export type CommissionBookingRow = {
  id: string;
  salon_name: string;
  booking_date: string;
  created_at: string;
  status: string;
  payment_status: string;
  reservation_fee_paid: boolean;
  amount: number;
  customer_email: string;
  agent_cut: number;
  gross_agent_cut?: number;
  head_cut?: number;
  sub_agent_cut?: number;
  agent_percent: number;
  platform_commission: number;
  field_agent_email?: string | null;
  split_percent?: number;
};

export type CommissionSubscriptionRow = {
  id: string;
  amount: number;
  gross_amount?: number;
  head_cut?: number;
  sub_agent_cut?: number;
  status: string;
  notes: string | null;
  created_at: string;
  field_agent_email?: string | null;
  split_percent?: number;
};

export function formatCommissionLKR(amount: number) {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCommissionDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString("en-LK", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export function getCommissionWeekRange(offsetWeeks: number) {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  end.setDate(end.getDate() - offsetWeeks * 7);

  const start = new Date(end);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - 6);

  return { start, end, startMs: start.getTime(), endMs: end.getTime() };
}

export function isCommissionEligibleBooking(booking: Pick<
  CommissionBookingRow,
  "status" | "payment_status" | "reservation_fee_paid"
>) {
  const s = booking.status?.toLowerCase();
  if (s === "completed" || s === "confirmed") return true;
  if (booking.reservation_fee_paid) return true;
  if (booking.payment_status?.toLowerCase() === "reservation_paid") return true;
  return false;
}

export function bookingWeekTimestamp(booking: Pick<CommissionBookingRow, "created_at" | "booking_date">) {
  if (booking.created_at) return new Date(booking.created_at).getTime();
  if (booking.booking_date) return new Date(booking.booking_date).getTime();
  return NaN;
}
