import React, { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { DollarSign, ChevronLeft, ChevronRight } from "lucide-react";
import { groupRevenueByDay } from "@/lib/dashboard-stats";
import { formatLkr } from "@/lib/subscription-pricing";

type RevenueTrendChartProps = {
  bookings: any[];
};

export function RevenueTrendChart({ bookings }: RevenueTrendChartProps) {
  const [weekOffset, setWeekOffset] = useState(0);

  const data = useMemo(() => {
    return groupRevenueByDay(bookings, weekOffset);
  }, [bookings, weekOffset]);

  const hasData = data.some(
    (d) => d["Reservation Income"] > 0 || d["Balance Income"] > 0
  );

  return (
    <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm h-80 flex flex-col">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-500" /> Revenue Growth
          </h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            Daily income broken down by reservation and balance payments
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setWeekOffset((prev) => prev + 1)}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-zinc-500 hover:text-zinc-900 transition-colors"
            title="Previous 7 Days"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold text-zinc-400 min-w-[60px] text-center">
            {weekOffset === 0 ? "This Week" : `${weekOffset}w ago`}
          </span>
          <button
            onClick={() => setWeekOffset((prev) => Math.max(0, prev - 1))}
            disabled={weekOffset === 0}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-zinc-500 hover:text-zinc-900 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            title="Next 7 Days"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!hasData ? (
        <div className="flex-1 flex items-center justify-center text-zinc-400 text-sm font-medium">
          No revenue to show for this period.
        </div>
      ) : (
        <div className="flex-1 min-h-0 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 600 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 600 }}
                tickFormatter={(val) => {
                  if (val === 0) return "0";
                  if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
                  return val;
                }}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
                itemStyle={{ fontSize: "13px", fontWeight: 600 }}
                labelStyle={{
                  fontSize: "12px",
                  color: "#64748b",
                  marginBottom: "4px",
                  fontWeight: 700,
                }}
                formatter={(value: number, name: string) => [`LKR ${formatLkr(value)}`, name]}
              />
              <Legend
                wrapperStyle={{
                  fontSize: "12px",
                  fontWeight: 600,
                  paddingTop: "10px",
                }}
                iconType="circle"
                iconSize={8}
              />
              <Line
                type="monotone"
                dataKey="Reservation Income"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ r: 4, strokeWidth: 2, fill: "#fff" }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
              <Line
                type="monotone"
                dataKey="Balance Income"
                stroke="#6366f1"
                strokeWidth={3}
                dot={{ r: 4, strokeWidth: 2, fill: "#fff" }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
