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

  const timeframeBookings = useMemo(() => {
    const filtered = filterBookingsByCommissionWeek(bookings, offsetWeeks);
    return [...filtered].sort((a, b) => {
      const dateCompare = (a.booking_date || "").localeCompare(b.booking_date || "");
      if (dateCompare !== 0) return dateCompare;
      return (a.booking_time || "").localeCompare(b.booking_time || "");
    });
  }, [bookings, offsetWeeks]);

  let sumCommission = 0;

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 h-full flex flex-col">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="font-semibold text-zinc-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-500" />
            Staff Commission
          </h3>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            Daywise breakdown using the same figures as Booking Income Breakdown.
          </p>
        </div>
        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-0.5 shrink-0">
          <button
            type="button"
            onClick={() => setOffsetWeeks((prev) => prev + 1)}
            className="px-2 py-1 text-[10px] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-md"
          >
            &lt;
          </button>
          <div className="w-px h-3 bg-slate-300 mx-0.5" />
          <button
            type="button"
            onClick={() => setOffsetWeeks((prev) => Math.max(0, prev - 1))}
            disabled={offsetWeeks === 0}
            className={`px-2 py-1 text-[10px] font-medium rounded-md ${
              offsetWeeks === 0 ? "text-slate-400 cursor-not-allowed" : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
            }`}
          >
            &gt;
          </button>
        </div>
      </div>

      {timeframeBookings.length === 0 ? (
        <p className="text-sm text-zinc-500 flex-1">No bookings in this period.</p>
      ) : (
        <div className="overflow-x-auto flex-1 -mx-1 px-1">
          <table className="w-full text-left border-collapse min-w-[520px] text-xs">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="py-2 pr-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                <th className="py-2 px-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">Booking Info</th>
                <th className="py-2 px-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">Staff</th>
                <th className="py-2 px-2 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Rate</th>
                <th className="py-2 pl-2 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Commission</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {timeframeBookings.map((booking) => {
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
                sumCommission += staffCommission?.amount ?? 0;

                const timeLabel = booking.booking_time ? booking.booking_time.slice(0, 5) : "";

                return (
                  <tr key={booking.id} className="hover:bg-slate-50/60">
                    <td className="py-2 pr-2 font-semibold text-slate-700 whitespace-nowrap">
                      {booking.booking_date || "—"}
                    </td>
                    <td className="py-2 px-2">
                      <div className="font-semibold text-slate-800">{serviceName}</div>
                      {timeLabel ? (
                        <div className="text-[10px] text-zinc-500">{timeLabel}</div>
                      ) : null}
                    </td>
                    <td className="py-2 px-2 text-zinc-600 font-medium">{staffName}</td>
                    <td className="py-2 px-2 text-right text-zinc-500">
                      {staffCommission ? `${staffCommission.rate}%` : "—"}
                    </td>
                    <td className="py-2 pl-2 text-right font-bold text-slate-800">
                      {staffCommission ? `LKR ${formatLkr(staffCommission.amount)}` : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-200">
                <td colSpan={4} className="py-2 pr-2 text-[10px] font-black text-slate-600 uppercase tracking-wider">
                  Total
                </td>
                <td className="py-2 pl-2 text-right text-sm font-black text-slate-800">
                  LKR {formatLkr(sumCommission)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
