"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Card from "../../components/ui/Card";
import { fetchSalonDashboardPage } from "@/app/actions/salon-dashboard-data";
import { withTimeout } from "@/lib/promise-timeout";
import { Loader2, RefreshCw } from "lucide-react";
import { BookingCommissionTable } from "../../components/dashboard/BookingCommissionTable";
import { StaffBookingTrendChart } from "../../components/dashboard/StaffBookingTrendChart";
import { RevenueTrendChart } from "../../components/dashboard/RevenueTrendChart";
import { needsOwnerActivationWizard } from "@/lib/salon-onboarding";
import {
  ActivityItem,
  formatLkr,
  formatRelativeTime,
  groupBookingsByMonth,
  type MonthlyPoint,
} from "@/lib/dashboard-stats";

function SimpleBarChart({
  title,
  points,
  valueKey,
}: {
  title: string;
  points: MonthlyPoint[];
  valueKey: "bookings" | "revenue";
}) {
  const max = Math.max(...points.map((p) => p[valueKey]), 1);

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 h-64 flex flex-col">
      <h3 className="font-semibold text-zinc-900 mb-4">{title}</h3>
      {points.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-zinc-400 text-sm">
          No booking data yet
        </div>
      ) : (
        <div className="flex-1 flex items-end gap-2">
          {points.map((point) => (
            <div key={point.label} className="flex-1 flex flex-col items-center gap-2 min-w-0">
              <div className="w-full flex items-end justify-center h-36">
                <div
                  className="w-full max-w-10 rounded-t-md bg-brand/80 transition-all"
                  style={{ height: `${Math.max(8, (point[valueKey] / max) * 100)}%` }}
                  title={`${point.label}: ${valueKey === "revenue" ? `LKR ${formatLkr(point.revenue)}` : point.bookings}`}
                />
              </div>
              <span className="text-[10px] font-semibold text-zinc-500 truncate w-full text-center">
                {point.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const [salonName, setSalonName] = useState("your salon");
  const [stats, setStats] = useState({
    totalBookings: 0,
    activeServices: 0,
    totalStaff: 0,
    revenue: 0,
  });
  const [monthlyPoints, setMonthlyPoints] = useState<MonthlyPoint[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [allStaff, setAllStaff] = useState<any[]>([]);

  const fetchDashboardStats = useCallback(async (options?: { showSpinner?: boolean }) => {
    const showSpinner = options?.showSpinner ?? false;
    try {
      if (showSpinner) {
        setIsRefreshing(true);
      }

      const result = await withTimeout(
        fetchSalonDashboardPage(),
        20000,
        "Loading timed out. Refresh the page."
      );

      if (result.success === false) {
        throw new Error(result.error);
      }

      const { salon: salonData, bookings, services, staff } = result;



      setSalonName((salonData.name as string) || "your salon");

      // Total Revenue = gross booking value (matches the Finance page's Gross Revenue),
      // not just the upfront reservation deposit.
      const revenue = bookings.reduce(
        (sum, booking) => sum + Number(booking.amount || 0),
        0
      );
      const activeServices = services.filter((service) => service.status === "active").length;

      const newStats = {
        totalBookings: bookings.length,
        activeServices,
        totalStaff: staff.length,
        revenue,
      };

      const feed: ActivityItem[] = [];
      for (const booking of bookings.slice(0, 4)) {
        feed.push({
          id: `booking-${booking.id}`,
          title: "Booking update",
          description: `${booking.customer_email || "Customer"} · LKR ${formatLkr(Number(booking.amount || 0))} · ${booking.status}`,
          time: formatRelativeTime(booking.created_at),
          tone: "blue",
        });
      }
      for (const service of services.slice(0, 2)) {
        feed.push({
          id: `service-${service.id}`,
          title: service.status === "active" ? "Service active" : "Service updated",
          description: service.name,
          time: formatRelativeTime(service.created_at),
          tone: "purple",
        });
      }
      for (const member of staff.slice(0, 2)) {
        feed.push({
          id: `staff-${member.id}`,
          title: "Staff member",
          description: member.name,
          time: formatRelativeTime(member.created_at),
          tone: "emerald",
        });
      }

      const monthly = groupBookingsByMonth(bookings);

      setStats(newStats);
      setRecentBookings(bookings);
      setAllStaff(staff);
      setMonthlyPoints(monthly);
      setActivity(feed.slice(0, 6));
    } catch (err) {
      console.error("Failed to fetch dashboard stats", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(() => {
      void fetchDashboardStats();
    });

    const interval = window.setInterval(() => {
      void fetchDashboardStats();
    }, 45000);

    const handleRefresh = () => {
      void fetchDashboardStats({ showSpinner: true });
    };
    window.addEventListener("trimma:dashboard-refresh", handleRefresh);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        void fetchDashboardStats();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("trimma:dashboard-refresh", handleRefresh);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [fetchDashboardStats]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-brand mb-4" />
        <p className="text-zinc-500 font-medium">Calculating salon performance...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">Salon Performance</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Welcome back. Here is what is happening at {salonName} today.
          </p>
        </div>
        <button
          onClick={() => fetchDashboardStats({ showSpinner: true })}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-zinc-700 hover:bg-slate-50 disabled:opacity-50 transition-colors shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-brand" : "text-zinc-500"}`} />
          {isRefreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card title="Total Bookings" value={stats.totalBookings.toLocaleString()} />
        <Card title="Active Services" value={stats.activeServices.toLocaleString()} />
        <Card title="Total Staff" value={stats.totalStaff.toLocaleString()} />
        <Card title="Total Revenue" value={`LKR ${formatLkr(stats.revenue)}`} />
      </div>

      <BookingCommissionTable bookings={recentBookings} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <StaffBookingTrendChart bookings={recentBookings} allStaff={allStaff} />
        <RevenueTrendChart bookings={recentBookings} />
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200">
        <h3 className="font-semibold text-zinc-900 mb-4">Recent Activity</h3>
        {activity.length === 0 ? (
          <p className="text-sm text-zinc-500">No recent activity yet.</p>
        ) : (
          <ul className="space-y-3 text-sm text-zinc-600">
            {activity.map((item) => (
              <li key={item.id} className="flex items-start gap-2">
                <span
                  className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                    item.tone === "emerald"
                      ? "bg-emerald-500"
                      : item.tone === "blue"
                        ? "bg-brand"
                        : item.tone === "purple"
                          ? "bg-purple-500"
                          : "bg-amber-500"
                  }`}
                />
                <div>
                  <p className="font-medium text-zinc-800">{item.title}</p>
                  <p className="text-zinc-500">{item.description}</p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">{item.time}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
