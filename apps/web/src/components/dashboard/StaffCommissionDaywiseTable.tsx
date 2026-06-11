"use client";

import React, { useMemo, useState } from "react";
import { Users } from "lucide-react";
import {
  buildInferredStaffMap,
  filterBookingsByCommissionWeek,
  formatLkr,
  resolveBookingStaffCommission,
} from "@/lib/dashboard-stats";
import { resolveStaffMemberFromBooking } from "@/lib/staff-allocation";

export function StaffCommissionDaywiseTable({
  bookings,
  allStaff = [],
}: {
  bookings: any[];
  allStaff?: any[];
}) {
  const [offsetWeeks, setOffsetWeeks] = useState(0);
  const inferredStaffByBookingId = useMemo(
    () => buildInferredStaffMap(bookings, allStaff),
    [bookings, allStaff]
  );

  const { rows, sumCommission } = useMemo(() => {
    const filtered = filterBookingsByCommissionWeek(bookings, offsetWeeks);
    const sorted = [...filtered].sort((a, b) => {
      const dateCompare = (a.booking_date || "").localeCompare(b.booking_date || "");
      if (dateCompare !== 0) return dateCompare;
      return (a.booking_time || "").localeCompare(b.booking_time || "");
    });

    const tableRows = sorted.map((booking) => {
      let serviceName = "General Service";
      const fullServiceName = booking.services?.name
        || (booking.booking_services?.[0]?.services
          ? (Array.isArray(booking.booking_services[0].services)
            ? booking.booking_services[0].services[0]?.name
            : booking.booking_services[0].services?.name)
          : null);
      if (fullServiceName) serviceName = fullServiceName;

      const assignedStaff = resolveStaffMemberFromBooking(booking, allStaff);
      const inferredStaff = inferredStaffByBookingId.get(booking.id);
      const displayStaff = assignedStaff || inferredStaff;
      let staffName = "Unassigned";
      if (displayStaff?.name) {
        staffName = displayStaff.name;
        if (!assignedStaff && inferredStaff) staffName += " (auto)";
      }

      const staffCommission = resolveBookingStaffCommission(booking, {
        allStaff,
        inferredStaff: inferredStaffByBookingId.get(booking.id) || null,
      });

      return {
        id: booking.id,
        bookingDate: booking.booking_date || "—",
        serviceName,
        timeLabel: booking.booking_time ? booking.booking_time.slice(0, 5) : "",
        staffName,
        staffCommission,
      };
    });

    const total = tableRows.reduce((sum, row) => sum + (row.staffCommission?.amount ?? 0), 0);
    return { rows: tableRows, sumCommission: total };
  }, [bookings, offsetWeeks, allStaff, inferredStaffByBookingId]);

  const weekLabel = offsetWeeks === 0 ? "Last 7 days" : `${offsetWeeks} wk${offsetWeeks > 1 ? "s" : ""} ago`;

  return (
    <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-zinc-900 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            Staff Commission
          </h3>
          <p className="text-[10px] text-zinc-500 mt-0.5">{weekLabel} · matches income breakdown</p>
        </div>
        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-md p-0.5 shrink-0 self-start">
          <button type="button" onClick={() => setOffsetWeeks((p) => p + 1)} className="px-2 py-1 text-[10px] font-medium text-slate-600 hover:bg-slate-200 rounded min-h-[32px]">Prev</button>
          <button type="button" onClick={() => setOffsetWeeks((p) => Math.max(0, p - 1))} disabled={offsetWeeks === 0} className={`px-2 py-1 text-[10px] font-medium rounded min-h-[32px] ${offsetWeeks === 0 ? "text-slate-300" : "text-slate-600 hover:bg-slate-200"}`}>Next</button>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="text-xs text-zinc-500 flex-1">No bookings in this period.</p>
      ) : (
        <>
          {/* Mobile + tablet cards */}
          <div className="md:hidden space-y-2 flex-1">
            {rows.map((row) => (
              <div key={row.id} className="rounded-lg border border-slate-200 p-2.5">
                <div className="flex justify-between gap-2 text-[10px] text-slate-500 mb-1">
                  <span className="font-semibold text-slate-700">{row.bookingDate}</span>
                  {row.timeLabel ? <span>{row.timeLabel}</span> : null}
                </div>
                <p className="text-xs font-bold text-slate-900 truncate">{row.serviceName}</p>
                <p className="text-[10px] text-slate-600 mt-0.5 truncate">{row.staffName}</p>
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-100">
                  <span className="text-[10px] text-slate-500">
                    {row.staffCommission ? `${row.staffCommission.rate}% rate` : "No rate"}
                  </span>
                  <span className="text-xs font-black text-slate-800 tabular-nums">
                    {row.staffCommission ? formatLkr(row.staffCommission.amount) : "—"}
                  </span>
                </div>
              </div>
            ))}
            <div className="flex justify-between items-center rounded-lg bg-slate-50 border border-slate-200 px-3 py-2">
              <span className="text-[10px] font-black uppercase text-slate-600">Total</span>
              <span className="text-sm font-black text-slate-900 tabular-nums">{formatLkr(sumCommission)}</span>
            </div>
          </div>

          {/* Tablet+ table */}
          <div className="hidden md:block overflow-x-auto flex-1 -mx-1 px-1">
            <table className="w-full text-left border-collapse min-w-0 text-xs">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="py-1.5 pr-2 text-[8px] font-bold text-slate-400 uppercase">Date</th>
                  <th className="py-1.5 px-1.5 text-[8px] font-bold text-slate-400 uppercase">Booking</th>
                  <th className="py-1.5 px-1.5 text-[8px] font-bold text-slate-400 uppercase">Staff</th>
                  <th className="py-1.5 px-1.5 text-[8px] font-bold text-slate-400 uppercase text-right">Rate</th>
                  <th className="py-1.5 pl-1.5 text-[8px] font-bold text-slate-400 uppercase text-right">Commission</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {rows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/60">
                    <td className="py-1.5 pr-2 font-semibold text-slate-700 text-[10px] whitespace-nowrap">{row.bookingDate}</td>
                    <td className="py-1.5 px-1.5">
                      <div className="font-semibold text-slate-800 text-[10px] truncate">{row.serviceName}</div>
                      {row.timeLabel ? <div className="text-[9px] text-zinc-500">{row.timeLabel}</div> : null}
                    </td>
                    <td className="py-1.5 px-1.5 text-zinc-600 font-medium text-[10px] truncate">{row.staffName}</td>
                    <td className="py-1.5 px-1.5 text-right text-zinc-500 text-[10px]">{row.staffCommission ? `${row.staffCommission.rate}%` : "—"}</td>
                    <td className="py-1.5 pl-1.5 text-right font-bold text-slate-800 text-[10px] tabular-nums">{row.staffCommission ? formatLkr(row.staffCommission.amount) : "—"}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-slate-200">
                  <td colSpan={4} className="py-2 pr-2 text-[9px] font-black text-slate-600 uppercase">Total</td>
                  <td className="py-2 pl-1.5 text-right text-xs font-black text-slate-800 tabular-nums">{formatLkr(sumCommission)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
