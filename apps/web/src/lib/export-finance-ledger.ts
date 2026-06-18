import * as XLSX from "xlsx";
import type { BookingIncomeRow, BookingIncomeTotals } from "@/lib/booking-income-rows";

export type FinanceLedgerExportInput = {
  salonName: string;
  filterLabel: string;
  weekLabel: string;
  globalRates: { platform: number; salon: number; agent: number };
  stats: {
    grossRevenue: number;
    platformComm: number;
    salonComm: number;
    agentComm: number;
    completedCount: number;
  };
  rows: BookingIncomeRow[];
  totals: BookingIncomeTotals;
  bookings?: Array<{
    id: string;
    booking_no?: string | null;
    status?: string | null;
    customer_email?: string | null;
    booking_date?: string | null;
    booking_time?: string | null;
  }>;
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function exportFinanceLedgerToExcel(input: FinanceLedgerExportInput): void {
  const bookingMeta = new Map((input.bookings || []).map((booking) => [booking.id, booking]));
  const exportedAt = new Date().toLocaleString("en-LK", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const summaryRows: (string | number)[][] = [
    ["Trimma Salon Finance Ledger"],
    [],
    ["Salon", input.salonName],
    ["Exported", exportedAt],
    ["Status filter", input.filterLabel],
    ["Period", input.weekLabel],
    [],
    ["Summary metric", "Amount (LKR)"],
    ["Gross bookings", roundMoney(input.stats.grossRevenue)],
    [`Platform fee (${input.globalRates.platform}%)`, roundMoney(input.stats.platformComm)],
    [`Salon reservation share (${input.globalRates.salon}%)`, roundMoney(input.stats.salonComm)],
    ["Agent commission", roundMoney(input.stats.agentComm)],
    ["Successful bookings", input.stats.completedCount],
    [],
    ["Ledger totals (selected period)", "Amount (LKR)"],
    ["Total service price", roundMoney(input.totals.sumAmount)],
    ["Total staff commission", roundMoney(input.totals.sumStaffCommission)],
    ["Total reservation fee", roundMoney(input.totals.sumResFee)],
    ["Total balance due", roundMoney(input.totals.sumBalanceDue)],
    ["Total salon share", roundMoney(input.totals.sumSalonUpfront)],
    ["Total salon income", roundMoney(input.totals.sumTotalIncome)],
    ["Total net income", roundMoney(input.totals.sumNetIncome)],
    [],
    ["Notes"],
    ["Net income = Salon income − Staff commission"],
    ["Staff names marked with * were auto-assigned for unassigned bookings"],
  ];

  const ledgerHeader = [
    "Booking No",
    "Date",
    "Time",
    "Service",
    "Staff",
    "Customer Email",
    "Status",
    "Service Price (LKR)",
    "Staff Comm %",
    "Staff Commission (LKR)",
    "Reservation Fee (LKR)",
    "Balance Due (LKR)",
    "Salon Share (LKR)",
    "Salon Income (LKR)",
    "Net Income (LKR)",
  ];

  const ledgerRows = input.rows.map((row) => {
    const meta = bookingMeta.get(row.id);
    return [
      meta?.booking_no || "",
      meta?.booking_date || row.bookingDate || "",
      meta?.booking_time ? meta.booking_time.slice(0, 5) : row.timeLabel,
      row.serviceName,
      row.staffName,
      meta?.customer_email || "",
      meta?.status || "",
      roundMoney(row.amount),
      row.staffCommission?.rate ?? "",
      row.staffCommission ? roundMoney(row.staffCommission.amount) : "",
      roundMoney(row.totalResFee),
      roundMoney(row.balanceDue),
      roundMoney(row.salonUpfront),
      roundMoney(row.totalIncome),
      roundMoney(row.netIncome),
    ];
  });

  const totalsRow = [
    "TOTALS",
    "",
    "",
    "",
    "",
    "",
    "",
    roundMoney(input.totals.sumAmount),
    "",
    roundMoney(input.totals.sumStaffCommission),
    roundMoney(input.totals.sumResFee),
    roundMoney(input.totals.sumBalanceDue),
    roundMoney(input.totals.sumSalonUpfront),
    roundMoney(input.totals.sumTotalIncome),
    roundMoney(input.totals.sumNetIncome),
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows);
  summarySheet["!cols"] = [{ wch: 34 }, { wch: 22 }];

  const ledgerSheet = XLSX.utils.aoa_to_sheet([ledgerHeader, ...ledgerRows, totalsRow]);
  ledgerSheet["!cols"] = [
    { wch: 14 },
    { wch: 12 },
    { wch: 8 },
    { wch: 24 },
    { wch: 14 },
    { wch: 28 },
    { wch: 12 },
    { wch: 16 },
    { wch: 12 },
    { wch: 18 },
    { wch: 18 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");
  XLSX.utils.book_append_sheet(workbook, ledgerSheet, "Ledger");

  const dateStamp = new Date().toISOString().slice(0, 10);
  const fileName = `trimma-ledger-${slugify(input.salonName || "salon")}-${dateStamp}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}
