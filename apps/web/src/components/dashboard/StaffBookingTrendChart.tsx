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
import { TrendingUp, ChevronLeft, ChevronRight } from "lucide-react";
import { groupBookingsByStaffAndDay } from "@/lib/dashboard-stats";

type StaffBookingTrendChartProps = {
  bookings: any[];
  allStaff: any[];
};

const COLORS = [
  "#10b981", // emerald-500
  "#6366f1", // indigo-500
  "#f43f5e", // rose-500
  "#f59e0b", // amber-500
  "#06b6d4", // cyan-500
  "#8b5cf6", // violet-500
  "#ec4899", // pink-500
];

export function StaffBookingTrendChart({ bookings, allStaff }: StaffBookingTrendChartProps) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [activeStaff, setActiveStaff] = useState<string | null>(null);

  const { data, staffNames } = useMemo(() => {
    return groupBookingsByStaffAndDay(bookings, weekOffset, allStaff);
  }, [bookings, weekOffset, allStaff]);

  const hasData = data.some(d => staffNames.some(name => d[name] > 0));

  return (
    <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm h-80 flex flex-col">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" /> 7-Day Booking Trends by Staff
          </h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            Daily booking volume broken down by each staff member
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setWeekOffset(prev => prev + 1)}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-zinc-500 hover:text-zinc-900 transition-colors"
            title="Previous 7 Days"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold text-zinc-400 min-w-[60px] text-center">
            {weekOffset === 0 ? "This Week" : `${weekOffset}w ago`}
          </span>
          <button
            onClick={() => setWeekOffset(prev => Math.max(0, prev - 1))}
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
          No bookings to show for this period.
        </div>
      ) : (
        <div className="flex-1 min-h-0 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} 
                dy={10} 
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} 
                allowDecimals={false}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                itemStyle={{ fontSize: '13px', fontWeight: 600 }}
                labelStyle={{ fontSize: '12px', color: '#64748b', marginBottom: '4px', fontWeight: 700 }}
              />
              <Legend 
                wrapperStyle={{ fontSize: '12px', fontWeight: 600, paddingTop: '10px', cursor: 'pointer' }} 
                iconType="circle"
                iconSize={8}
                onClick={(e: any) => {
                  if (activeStaff === e.dataKey) setActiveStaff(null);
                  else setActiveStaff(e.dataKey);
                }}
              />
              {staffNames.map((name, index) => {
                const isActive = activeStaff === null || activeStaff === name;
                return (
                  <Line
                    key={name}
                    type="monotone"
                    dataKey={name}
                    stroke={COLORS[index % COLORS.length]}
                    strokeWidth={isActive ? 3 : 1}
                    strokeOpacity={isActive ? 1 : 0.2}
                    dot={isActive ? { r: 4, strokeWidth: 2, fill: '#fff' } : false}
                    activeDot={isActive ? { r: 6, strokeWidth: 0 } : false}
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
