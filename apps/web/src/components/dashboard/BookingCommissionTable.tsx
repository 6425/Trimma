import React, { useMemo, useState } from "react";
import { formatLkr } from "@/lib/dashboard-stats";
import { buildBookingIncomeRows, type BookingIncomeRow, type BookingIncomeTotals } from "@/lib/booking-income-rows";
import { Building2, Info } from "lucide-react";

const TH =
  "py-1 px-1 text-[8px] font-bold text-slate-500 uppercase tracking-wide leading-tight align-bottom";
const TD = "py-1 px-1 text-[10px] leading-tight align-middle tabular-nums";
const TD_NUM = `${TD} text-right font-semibold whitespace-nowrap`;

function Money({ value, className = "text-slate-700" }: { value: number; className?: string }) {
  return <span className={className}>{formatLkr(value)}</span>;
}

function MetricPair({
  label,
  value,
  sub,
  valueClass = "text-slate-800",
}: {
  label: string;
  value: string;
  sub?: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2 py-1.5 border-b border-slate-100 last:border-0">
      <span className="text-[10px] font-medium text-slate-500">{label}</span>
      <span className={`text-[11px] font-bold tabular-nums ${valueClass}`}>
        {value}
        {sub ? <span className="text-[9px] font-medium text-slate-400 ml-1">{sub}</span> : null}
      </span>
    </div>
  );
}

function MobileBookingCard({ row }: { row: BookingIncomeRow }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <h4 className="text-sm font-bold text-slate-900 truncate">{row.serviceName}</h4>
          <p className="text-[10px] text-slate-500 mt-0.5">
            {row.staffName}
            {row.dateLabel ? ` · ${row.dateLabel}` : ""}
            {row.timeLabel ? ` · ${row.timeLabel}` : ""}
          </p>
        </div>
      </div>
      <div className="rounded-md bg-slate-50/80 px-2.5 py-1">
        <MetricPair label="Service price" value={formatLkr(row.amount)} />
        <MetricPair
          label="Staff commission"
          value={row.staffCommission ? formatLkr(row.staffCommission.amount) : "—"}
          sub={row.staffCommission ? `${row.staffCommission.rate}%` : undefined}
        />
        <MetricPair label="Reservation fee" value={formatLkr(row.totalResFee)} />
        <MetricPair label="Balance due" value={formatLkr(row.balanceDue)} valueClass="text-emerald-600" />
        <MetricPair label="Salon share" value={formatLkr(row.salonUpfront)} valueClass="text-emerald-600" />
        <MetricPair label="Salon income" value={formatLkr(row.totalIncome)} valueClass="text-indigo-700" />
        <MetricPair label="Net income" value={formatLkr(row.netIncome)} valueClass="text-emerald-700" />
      </div>
    </article>
  );
}

function MobileTotalsCard({ totals }: { totals: BookingIncomeTotals }) {
  return (
    <div className="rounded-lg border-2 border-slate-200 bg-slate-50 p-3">
      <p className="text-[10px] font-black uppercase tracking-wider text-slate-600 mb-2">Period totals</p>
      <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-[10px]">
        {[
          ["Service", totals.sumAmount, "text-slate-800"],
          ["Staff", totals.sumStaffCommission, "text-slate-700"],
          ["Res. fee", totals.sumResFee, "text-slate-600"],
          ["Balance", totals.sumBalanceDue, "text-emerald-700"],
          ["Salon", totals.sumSalonUpfront, "text-emerald-700"],
          ["Salon inc.", totals.sumTotalIncome, "text-indigo-800"],
        ].map(([label, value, cls]) => (
          <div key={label as string} className="flex justify-between gap-1">
            <span className="text-slate-500">{label}</span>
            <span className={`font-bold tabular-nums ${cls}`}>{formatLkr(value as number)}</span>
          </div>
        ))}
        <div className="col-span-2 flex justify-between gap-1 pt-1 border-t border-slate-200">
          <span className="font-bold text-slate-600">Net income</span>
          <span className="font-black text-emerald-800 tabular-nums">{formatLkr(totals.sumNetIncome)}</span>
        </div>
      </div>
    </div>
  );
}

function IncomeTable({ rows, totals }: { rows: BookingIncomeRow[]; totals: BookingIncomeTotals }) {
  return (
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
          <th className={TH} title="Service, staff, date and time">Booking</th>
          <th className={`${TH} text-right`} title="Total service price">Service</th>
          <th className={`${TH} text-right`} title="Staff commission">Staff</th>
          <th className={`${TH} text-right border-l border-slate-100`} title="Reservation fee paid (20%)">Res. Fee</th>
          <th className={`${TH} text-right text-emerald-600`} title="Balance payment due">Balance</th>
          <th className={`${TH} text-right text-emerald-600`} title="Salon reservation share">Salon</th>
          <th className={`${TH} text-right text-indigo-600 border-l border-indigo-100 bg-indigo-50/40`} title="Total salon income">Salon Inc.</th>
          <th className={`${TH} text-right text-emerald-700 border-l border-emerald-100 bg-emerald-50/40`} title="Net income">Net</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {rows.length === 0 ? (
          <tr>
            <td colSpan={8} className="py-3 px-1 text-center text-[10px] text-zinc-400">No bookings in this period.</td>
          </tr>
        ) : (
          rows.map((row) => (
            <tr key={row.id} className="hover:bg-slate-50/60">
              <td className={TD}>
                <div className="font-semibold text-slate-800 truncate" title={row.serviceName}>{row.serviceName}</div>
                <div className="text-[9px] text-zinc-400 truncate">
                  {row.staffName}{row.dateLabel ? ` · ${row.dateLabel}` : ""}{row.timeLabel ? ` ${row.timeLabel}` : ""}
                </div>
              </td>
              <td className={`${TD_NUM} text-slate-600`}><Money value={row.amount} /></td>
              <td className={`${TD_NUM} text-slate-700`}>
                {row.staffCommission ? (
                  <span><Money value={row.staffCommission.amount} /><span className="text-[8px] text-slate-400 ml-0.5">{row.staffCommission.rate}%</span></span>
                ) : <span className="text-slate-300">—</span>}
              </td>
              <td className={`${TD_NUM} text-slate-500 border-l border-slate-50`}><Money value={row.totalResFee} /></td>
              <td className={`${TD_NUM} text-emerald-600`}><Money value={row.balanceDue} className="text-emerald-600" /></td>
              <td className={`${TD_NUM} text-emerald-600`}><Money value={row.salonUpfront} className="text-emerald-600" /></td>
              <td className={`${TD_NUM} font-bold text-indigo-700 border-l border-indigo-50 bg-indigo-50/20`}><Money value={row.totalIncome} className="text-indigo-700 font-bold" /></td>
              <td className={`${TD_NUM} font-bold text-emerald-700 border-l border-emerald-50 bg-emerald-50/20`}><Money value={row.netIncome} className="text-emerald-700 font-bold" /></td>
            </tr>
          ))
        )}
      </tbody>
      <tfoot>
        <tr className="border-t border-slate-200 bg-slate-50/90">
          <td className={`${TD} font-bold text-slate-700 uppercase text-[9px]`}>Totals</td>
          <td className={`${TD_NUM} font-bold text-slate-800`}><Money value={totals.sumAmount} className="font-bold text-slate-800" /></td>
          <td className={`${TD_NUM} font-bold text-slate-700`}><Money value={totals.sumStaffCommission} className="font-bold text-slate-700" /></td>
          <td className={`${TD_NUM} font-bold text-slate-600 border-l border-slate-100`}><Money value={totals.sumResFee} className="font-bold text-slate-600" /></td>
          <td className={`${TD_NUM} font-bold text-emerald-700`}><Money value={totals.sumBalanceDue} className="font-bold text-emerald-700" /></td>
          <td className={`${TD_NUM} font-bold text-emerald-700`}><Money value={totals.sumSalonUpfront} className="font-bold text-emerald-700" /></td>
          <td className={`${TD_NUM} font-bold text-indigo-800 border-l border-indigo-100 bg-indigo-50/30`}><Money value={totals.sumTotalIncome} className="font-bold text-indigo-800" /></td>
          <td className={`${TD_NUM} font-bold text-emerald-800 border-l border-emerald-100 bg-emerald-50/30`}><Money value={totals.sumNetIncome} className="font-bold text-emerald-800" /></td>
        </tr>
      </tfoot>
    </table>
  );
}

export function BookingCommissionTable({
  bookings,
  allStaff = [],
  offsetWeeks,
  onOffsetWeeksChange,
}: {
  bookings: any[];
  allStaff?: any[];
  offsetWeeks?: number;
  onOffsetWeeksChange?: (value: number) => void;
}) {
  const [internalOffsetWeeks, setInternalOffsetWeeks] = useState(0);
  const activeOffsetWeeks = offsetWeeks ?? internalOffsetWeeks;
  const setActiveOffsetWeeks = onOffsetWeeksChange ?? setInternalOffsetWeeks;

  const { rows, totals } = useMemo(
    () => buildBookingIncomeRows(bookings, allStaff, activeOffsetWeeks),
    [bookings, allStaff, activeOffsetWeeks]
  );

  if (!bookings || bookings.length === 0) {
    return (
      <div className="bg-white p-4 rounded-xl border border-slate-200 text-center text-zinc-500 text-xs">
        No recent bookings to display commission data.
      </div>
    );
  }

  const weekLabel =
    activeOffsetWeeks === 0 ? "Last 7 days" : `${activeOffsetWeeks} wk${activeOffsetWeeks > 1 ? "s" : ""} ago`;

  const toolbar = (
    <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-between gap-2 mb-2">
      <div className="min-w-0">
        <h3 className="text-sm sm:text-base font-bold text-slate-800 tracking-tight flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
          <span className="truncate">Booking Income Breakdown</span>
          <span className="text-[10px] font-medium text-slate-400 shrink-0">({weekLabel})</span>
        </h3>
      </div>
      <div className="flex items-center justify-between sm:justify-end gap-1.5">
        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-md p-0.5">
          <button type="button" onClick={() => setActiveOffsetWeeks(activeOffsetWeeks + 1)} className="px-2 py-1 text-[10px] font-medium text-slate-600 hover:bg-slate-200 rounded min-h-[32px]">Prev</button>
          <button type="button" onClick={() => setActiveOffsetWeeks(Math.max(0, activeOffsetWeeks - 1))} disabled={activeOffsetWeeks === 0} className={`px-2 py-1 text-[10px] font-medium rounded min-h-[32px] ${activeOffsetWeeks === 0 ? "text-slate-300" : "text-slate-600 hover:bg-slate-200"}`}>Next</button>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-md text-right">
          <p className="text-[8px] font-bold text-emerald-600 uppercase leading-none">7d Revenue</p>
          <p className="text-[11px] font-black text-emerald-700">{formatLkr(totals.sumTotalIncome)}</p>
        </div>
        <div className="hidden md:flex bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md text-[8px] font-bold uppercase items-center gap-1" title="Platform fees excluded">
          <Info className="w-2.5 h-2.5" />Fees hidden
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {toolbar}

      {/* Mobile + tablet: stacked cards */}
      <div className="lg:hidden space-y-2.5">
        {rows.length === 0 ? (
          <p className="text-center text-[11px] text-zinc-400 py-4">No bookings in this period.</p>
        ) : (
          <>
            {rows.map((row) => (
              <MobileBookingCard key={row.id} row={row} />
            ))}
            <MobileTotalsCard totals={totals} />
          </>
        )}
        <p className="text-[9px] text-slate-400 leading-tight">Net = Salon income − Staff commission</p>
      </div>

      {/* Desktop: dense table */}
      <div className="hidden lg:block">
        <IncomeTable rows={rows} totals={totals} />
        <p className="mt-1.5 text-[8px] text-slate-400 leading-tight">LKR · Net = Salon Inc. − Staff · Hover headers for full names</p>
      </div>
    </div>
  );
}
