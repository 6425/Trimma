import React, { useState } from "react";
import {
  buildInferredStaffMap,
  filterBookingsByCommissionWeek,
  formatLkr,
  resolveBookingStaffCommission,
} from "@/lib/dashboard-stats";
import { resolveStaffMemberFromBooking } from "@/lib/staff-allocation";
import { Building2, Info } from "lucide-react";

const TH =
  "py-1 px-1 text-[8px] font-bold text-slate-500 uppercase tracking-wide leading-tight align-bottom";
const TD = "py-1 px-1 text-[10px] leading-tight align-middle tabular-nums";
const TD_NUM = `${TD} text-right font-semibold whitespace-nowrap`;

function Money({ value, className = "text-slate-700" }: { value: number; className?: string }) {
  return <span className={className}>{formatLkr(value)}</span>;
}

export function BookingCommissionTable({
  bookings,
  allStaff = [],
}: {
  bookings: any[];
  allStaff?: any[];
}) {
  const [offsetWeeks, setOffsetWeeks] = useState(0);
  const inferredStaffByBookingId = buildInferredStaffMap(bookings, allStaff);

  if (!bookings || bookings.length === 0) {
    return (
      <div className="bg-white p-4 rounded-xl border border-slate-200 text-center text-zinc-500 text-xs">
        No recent bookings to display commission data.
      </div>
    );
  }

  const timeframeBookings = filterBookingsByCommissionWeek(bookings, offsetWeeks);

  let sumAmount = 0;
  let sumStaffCommission = 0;
  let sumResFee = 0;
  let sumBalanceDue = 0;
  let sumSalonUpfront = 0;
  let sumTotalIncome = 0;
  let sumNetIncome = 0;

  timeframeBookings.forEach((b) => {
    const amount = Number(b.amount || 0);
    const totalResFee = Number(b.total_reservation_fee || 0);
    const salonUpfront = Number(b.salon_upfront_amount || 0);
    const balanceDue = amount - totalResFee;
    const totalIncome = balanceDue + salonUpfront;
    const staffCommission = resolveBookingStaffCommission(b, {
      allStaff,
      inferredStaff: inferredStaffByBookingId.get(b.id) || null,
    });

    sumAmount += amount;
    sumStaffCommission += staffCommission?.amount ?? 0;
    sumResFee += totalResFee;
    sumBalanceDue += balanceDue;
    sumSalonUpfront += salonUpfront;
    sumTotalIncome += totalIncome;
    sumNetIncome += totalIncome - (staffCommission?.amount ?? 0);
  });

  const weekLabel =
    offsetWeeks === 0 ? "Last 7 days" : `${offsetWeeks} wk${offsetWeeks > 1 ? "s" : ""} ago`;

  return (
    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span className="truncate">Booking Income Breakdown</span>
            <span className="text-[10px] font-medium text-slate-400">({weekLabel})</span>
          </h3>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-md p-0.5">
            <button
              type="button"
              onClick={() => setOffsetWeeks((prev) => prev + 1)}
              className="px-1.5 py-0.5 text-[9px] font-medium text-slate-600 hover:bg-slate-200 rounded"
            >
              Prev
            </button>
            <button
              type="button"
              onClick={() => setOffsetWeeks((prev) => Math.max(0, prev - 1))}
              disabled={offsetWeeks === 0}
              className={`px-1.5 py-0.5 text-[9px] font-medium rounded ${
                offsetWeeks === 0 ? "text-slate-300 cursor-not-allowed" : "text-slate-600 hover:bg-slate-200"
              }`}
            >
              Next
            </button>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md text-right">
            <p className="text-[8px] font-bold text-emerald-600 uppercase leading-none">7d Revenue</p>
            <p className="text-[10px] font-black text-emerald-700 leading-tight">{formatLkr(sumTotalIncome)}</p>
          </div>
          <div
            className="hidden sm:flex bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md text-[8px] font-bold uppercase items-center gap-1"
            title="Platform fees are excluded from this view"
          >
            <Info className="w-2.5 h-2.5" />
            Fees hidden
          </div>
        </div>
      </div>

      <table className="w-full table-fixed border-collapse text-left">
        <colgroup>
          <col className="w-[19%]" />
          <col className="w-[10%]" />
          <col className="w-[10%]" />
          <col className="w-[10%]" />
          <col className="w-[11%]" />
          <col className="w-[11%]" />
          <col className="w-[14%]" />
          <col className="w-[15%]" />
        </colgroup>
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/80">
            <th className={TH} title="Service, staff, date and time">
              Booking
            </th>
            <th className={`${TH} text-right`} title="Total service price">
              Service
            </th>
            <th className={`${TH} text-right`} title="Staff commission">
              Staff
            </th>
            <th className={`${TH} text-right border-l border-slate-100`} title="Reservation fee paid (20%)">
              Res. Fee
            </th>
            <th className={`${TH} text-right text-emerald-600`} title="Balance payment due">
              Balance
            </th>
            <th className={`${TH} text-right text-emerald-600`} title="Salon reservation share">
              Salon
            </th>
            <th
              className={`${TH} text-right text-indigo-600 border-l border-indigo-100 bg-indigo-50/40`}
              title="Total salon income"
            >
              Salon Inc.
            </th>
            <th
              className={`${TH} text-right text-emerald-700 border-l border-emerald-100 bg-emerald-50/40`}
              title="Net income (salon income minus staff commission)"
            >
              Net
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {timeframeBookings.length === 0 ? (
            <tr>
              <td colSpan={8} className="py-3 px-1 text-center text-[10px] text-zinc-400">
                No bookings in this period.
              </td>
            </tr>
          ) : (
            timeframeBookings.map((b) => {
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

              const dateLabel = b.booking_date ? b.booking_date.slice(5) : "";
              const timeLabel = b.booking_time ? b.booking_time.slice(0, 5) : "";

              return (
                <tr key={b.id} className="hover:bg-slate-50/60">
                  <td className={TD}>
                    <div className="font-semibold text-slate-800 truncate" title={serviceName}>
                      {serviceName}
                    </div>
                    <div className="text-[9px] text-zinc-400 truncate" title={`${staffName} · ${b.booking_date || ""} ${timeLabel}`}>
                      {staffName}
                      {dateLabel ? ` · ${dateLabel}` : ""}
                      {timeLabel ? ` ${timeLabel}` : ""}
                    </div>
                  </td>
                  <td className={`${TD_NUM} text-slate-600`}>
                    <Money value={amount} />
                  </td>
                  <td className={`${TD_NUM} text-slate-700`}>
                    {staffCommission ? (
                      <span title={`${staffCommission.rate}%`}>
                        <Money value={staffCommission.amount} />
                        <span className="text-[8px] text-slate-400 ml-0.5">{staffCommission.rate}%</span>
                      </span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className={`${TD_NUM} text-slate-500 border-l border-slate-50`}>
                    <Money value={totalResFee} />
                  </td>
                  <td className={`${TD_NUM} text-emerald-600`}>
                    <Money value={balanceDue} className="text-emerald-600" />
                  </td>
                  <td className={`${TD_NUM} text-emerald-600`}>
                    <Money value={salonUpfront} className="text-emerald-600" />
                  </td>
                  <td className={`${TD_NUM} font-bold text-indigo-700 border-l border-indigo-50 bg-indigo-50/20`}>
                    <Money value={totalIncome} className="text-indigo-700 font-bold" />
                  </td>
                  <td className={`${TD_NUM} font-bold text-emerald-700 border-l border-emerald-50 bg-emerald-50/20`}>
                    <Money value={netIncome} className="text-emerald-700 font-bold" />
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
        <tfoot>
          <tr className="border-t border-slate-200 bg-slate-50/90">
            <td className={`${TD} font-bold text-slate-700 uppercase text-[9px]`}>Totals</td>
            <td className={`${TD_NUM} font-bold text-slate-800`}>
              <Money value={sumAmount} className="font-bold text-slate-800" />
            </td>
            <td className={`${TD_NUM} font-bold text-slate-700`}>
              <Money value={sumStaffCommission} className="font-bold text-slate-700" />
            </td>
            <td className={`${TD_NUM} font-bold text-slate-600 border-l border-slate-100`}>
              <Money value={sumResFee} className="font-bold text-slate-600" />
            </td>
            <td className={`${TD_NUM} font-bold text-emerald-700`}>
              <Money value={sumBalanceDue} className="font-bold text-emerald-700" />
            </td>
            <td className={`${TD_NUM} font-bold text-emerald-700`}>
              <Money value={sumSalonUpfront} className="font-bold text-emerald-700" />
            </td>
            <td className={`${TD_NUM} font-bold text-indigo-800 border-l border-indigo-100 bg-indigo-50/30`}>
              <Money value={sumTotalIncome} className="font-bold text-indigo-800" />
            </td>
            <td className={`${TD_NUM} font-bold text-emerald-800 border-l border-emerald-100 bg-emerald-50/30`}>
              <Money value={sumNetIncome} className="font-bold text-emerald-800" />
            </td>
          </tr>
        </tfoot>
      </table>
      <p className="mt-1.5 text-[8px] text-slate-400 leading-tight">
        LKR · Net = Salon Inc. − Staff · Hover headers for full column names
      </p>
    </div>
  );
}
