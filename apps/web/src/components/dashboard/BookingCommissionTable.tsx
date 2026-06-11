import React, { useState } from "react";
import {
  buildInferredStaffMap,
  formatLkr,
  resolveBookingStaffCommission,
} from "@/lib/dashboard-stats";
import { resolveStaffMemberFromBooking } from "@/lib/staff-allocation";
import { Building2, Info, ChevronDown, ChevronUp } from "lucide-react";

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
      <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center text-zinc-500 text-sm">
        No recent bookings to display commission data.
      </div>
    );
  }

  // Determine the start and end dates for the currently selected week (7 days)
  const endDateObj = new Date();
  endDateObj.setHours(0, 0, 0, 0);
  endDateObj.setDate(endDateObj.getDate() - (offsetWeeks * 7));
  
  const startDateObj = new Date(endDateObj);
  startDateObj.setDate(startDateObj.getDate() - 6); // 7 day window including end date

  const startMs = startDateObj.getTime();
  const endMs = endDateObj.getTime() + 86400000; // include the whole end day

  // Filter bookings for the selected 7-day timeframe
  const timeframeBookings = bookings.filter(b => {
    if (!b.created_at) return false;
    const d = new Date(b.created_at).getTime();
    return d >= startMs && d < endMs;
  });

  // Calculate Sums for the current timeframe
  let sumAmount = 0;
  let sumStaffCommission = 0;
  let sumResFee = 0;
  let sumBalanceDue = 0;
  let sumSalonUpfront = 0;
  let sumTotalIncome = 0;

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
  });

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 overflow-hidden">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-500" /> Booking Income Breakdown {offsetWeeks === 0 ? "(Last 7 Days)" : `(${offsetWeeks} Week${offsetWeeks > 1 ? 's' : ''} Ago)`}
          </h3>
          <p className="text-xs text-zinc-500 mt-1">
            Exact financial breakdown of your bookings, highlighting your true income.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-0.5">
            <button
              onClick={() => setOffsetWeeks(prev => prev + 1)}
              className="px-2 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-md transition-colors"
            >
              &lt; Previous
            </button>
            <div className="w-px h-4 bg-slate-300 mx-1"></div>
            <button
              onClick={() => setOffsetWeeks(prev => Math.max(0, prev - 1))}
              disabled={offsetWeeks === 0}
              className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${offsetWeeks === 0 ? 'text-slate-400 cursor-not-allowed' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'}`}
            >
              Next &gt;
            </button>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-xl text-right">
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">7-Day Revenue</p>
            <p className="text-sm font-black text-emerald-700">LKR {formatLkr(sumTotalIncome)}</p>
          </div>
          <div className="bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5" />
            Platform Fees Hidden
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="border-b-2 border-slate-100">
              <th className="py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Booking Info</th>
              <th className="py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right whitespace-nowrap">Total Service Price</th>
              <th className="py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right whitespace-nowrap">Staff Commission</th>
              <th className="py-3 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right whitespace-nowrap border-l border-slate-100 bg-slate-50/50">Reservation Fee Paid (20%)</th>
              <th className="py-3 px-4 text-[10px] font-black text-emerald-500 uppercase tracking-widest text-right whitespace-nowrap">Balance Payment Due</th>
              <th className="py-3 px-4 text-[10px] font-black text-emerald-500 uppercase tracking-widest text-right whitespace-nowrap">Salon Reservation Share</th>
              <th className="py-3 px-4 text-[11px] font-black text-indigo-600 uppercase tracking-widest text-right whitespace-nowrap border-l-2 border-indigo-100 bg-indigo-50/30">Total Salon Income</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {timeframeBookings.map((b) => {
              // Extract relations safely (handling both array structures and objects depending on Supabase mapping)
              let serviceName = "General Service";
              
              // Try direct relation first, then fallback to junction table
              let fullServiceName = b.services?.name;
              if (!fullServiceName && b.booking_services && b.booking_services.length > 0) {
                const s = b.booking_services[0].services;
                fullServiceName = Array.isArray(s) ? s[0]?.name : s?.name;
              }
              if (fullServiceName) {
                serviceName = fullServiceName;
              }

              let staffName = "Any Staff";

              const assignedStaff = resolveStaffMemberFromBooking(b, allStaff);
              const inferredStaff = inferredStaffByBookingId.get(b.id);
              const displayStaff = assignedStaff || inferredStaff;
              if (displayStaff?.name) {
                staffName = displayStaff.name.split(" ")[0];
                if (!assignedStaff && inferredStaff) {
                  staffName = `${staffName} (auto)`;
                }
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

              return (
                <tr key={b.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="py-3 px-4">
                    <div className="font-bold text-sm text-slate-800">{serviceName}</div>
                    <div className="text-[11px] text-zinc-500 font-medium">
                      {staffName} • {b.booking_date} {b.booking_time ? `at ${b.booking_time.slice(0, 5)}` : ""}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right text-sm font-semibold text-slate-600">
                    LKR {formatLkr(amount)}
                  </td>
                  <td className="py-3 px-4 text-right text-sm font-semibold text-slate-700">
                    {staffCommission ? (
                      <span title={`${staffCommission.rate}% commission`}>
                        LKR {formatLkr(staffCommission.amount)}
                        <span className="block text-[10px] font-medium text-slate-400">{staffCommission.rate}%</span>
                      </span>
                    ) : (
                      <span className="text-slate-400 font-medium">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right text-sm font-medium text-slate-500 border-l border-slate-100 bg-slate-50/50">
                    LKR {formatLkr(totalResFee)}
                  </td>
                  <td className="py-3 px-4 text-right text-sm font-bold text-emerald-600">
                    LKR {formatLkr(balanceDue)}
                  </td>
                  <td className="py-3 px-4 text-right text-sm font-bold text-emerald-600">
                    LKR {formatLkr(salonUpfront)}
                  </td>
                  <td className="py-3 px-4 text-right text-[15px] font-black text-indigo-700 border-l-2 border-indigo-100 bg-indigo-50/30">
                    LKR {formatLkr(totalIncome)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="border-t-2 border-slate-200 bg-slate-50/80">
            <tr>
              <td className="py-4 px-4 text-sm font-black text-slate-800 uppercase tracking-wider">
                Totals
              </td>
              <td className="py-4 px-4 text-right text-sm font-black text-slate-800">
                LKR {formatLkr(sumAmount)}
              </td>
              <td className="py-4 px-4 text-right text-sm font-black text-slate-700">
                LKR {formatLkr(sumStaffCommission)}
              </td>
              <td className="py-4 px-4 text-right text-sm font-black text-slate-600 border-l border-slate-200 bg-slate-100/50">
                LKR {formatLkr(sumResFee)}
              </td>
              <td className="py-4 px-4 text-right text-sm font-black text-emerald-700">
                LKR {formatLkr(sumBalanceDue)}
              </td>
              <td className="py-4 px-4 text-right text-sm font-black text-emerald-700">
                LKR {formatLkr(sumSalonUpfront)}
              </td>
              <td className="py-4 px-4 text-right text-base font-black text-indigo-800 border-l-2 border-indigo-200 bg-indigo-100/50">
                LKR {formatLkr(sumTotalIncome)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
