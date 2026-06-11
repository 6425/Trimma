import {
  buildInferredStaffMap,
  filterBookingsByCommissionWeek,
  resolveBookingStaffCommission,
} from "@/lib/dashboard-stats";
import { resolveStaffMemberFromBooking } from "@/lib/staff-allocation";

export type BookingIncomeRow = {
  id: string;
  serviceName: string;
  staffName: string;
  bookingDate: string;
  dateLabel: string;
  timeLabel: string;
  amount: number;
  staffCommission: { amount: number; rate: number } | null;
  totalResFee: number;
  balanceDue: number;
  salonUpfront: number;
  totalIncome: number;
  netIncome: number;
};

export type BookingIncomeTotals = {
  sumAmount: number;
  sumStaffCommission: number;
  sumResFee: number;
  sumBalanceDue: number;
  sumSalonUpfront: number;
  sumTotalIncome: number;
  sumNetIncome: number;
};

export function buildBookingIncomeRows(
  bookings: any[],
  allStaff: any[],
  offsetWeeks = 0
): { rows: BookingIncomeRow[]; totals: BookingIncomeTotals } {
  const inferredStaffByBookingId = buildInferredStaffMap(bookings, allStaff);
  const timeframeBookings = filterBookingsByCommissionWeek(bookings, offsetWeeks);

  const totals: BookingIncomeTotals = {
    sumAmount: 0,
    sumStaffCommission: 0,
    sumResFee: 0,
    sumBalanceDue: 0,
    sumSalonUpfront: 0,
    sumTotalIncome: 0,
    sumNetIncome: 0,
  };

  const rows = timeframeBookings.map((b) => {
    let serviceName = "General";
    let fullServiceName = b.services?.name;
    if (!fullServiceName && b.booking_services?.length) {
      const s = b.booking_services[0].services;
      fullServiceName = Array.isArray(s) ? s[0]?.name : s?.name;
    }
    if (fullServiceName) serviceName = fullServiceName;

    const assignedStaff = resolveStaffMemberFromBooking(b, allStaff);
    const inferredStaff = inferredStaffByBookingId.get(b.id);
    const displayStaff = assignedStaff || inferredStaff;
    let staffName = "Any";
    if (displayStaff?.name) {
      staffName = displayStaff.name.split(" ")[0];
      if (!assignedStaff && inferredStaff) staffName += "*";
    }

    const amount = Number(b.amount || 0);
    const totalResFee = Number(b.total_reservation_fee || 0);
    const salonUpfront = Number(b.salon_upfront_amount || 0);
    const balanceDue = amount - totalResFee;
    const totalIncome = balanceDue + salonUpfront;
    const staffCommission = resolveBookingStaffCommission(b, {
      allStaff,
      inferredStaff: inferredStaffByBookingId.get(b.id) || null,
    });
    const netIncome = totalIncome - (staffCommission?.amount ?? 0);

    totals.sumAmount += amount;
    totals.sumStaffCommission += staffCommission?.amount ?? 0;
    totals.sumResFee += totalResFee;
    totals.sumBalanceDue += balanceDue;
    totals.sumSalonUpfront += salonUpfront;
    totals.sumTotalIncome += totalIncome;
    totals.sumNetIncome += netIncome;

    return {
      id: b.id,
      serviceName,
      staffName,
      bookingDate: b.booking_date || "",
      dateLabel: b.booking_date ? b.booking_date.slice(5) : "",
      timeLabel: b.booking_time ? b.booking_time.slice(0, 5) : "",
      amount,
      staffCommission,
      totalResFee,
      balanceDue,
      salonUpfront,
      totalIncome,
      netIncome,
    };
  });

  return { rows, totals };
}
