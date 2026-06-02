"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Card from "../../components/ui/Card";
import { fetchSalonDashboardPage } from "@/app/actions/salon-dashboard-data";
import { withTimeout } from "@/lib/promise-timeout";
import { Loader2, RefreshCw } from "lucide-react";
import { CommissionCard } from "../../components/CommissionCard";
import type { CommissionRow } from "@/lib/types/commission";
import { needsOwnerActivationWizard } from "@/lib/salon-onboarding";
import {
  ActivityItem,
  formatLkr,
  formatRelativeTime,
  getBookingAmount,
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
  const [commissions, setCommissions] = useState<CommissionRow[]>([]);

  const fetchDashboardStats = useCallback(async (forceRefresh = false) => {
    try {
      if (forceRefresh) {
        setIsRefreshing(true);
        sessionStorage.removeItem("dashboardCache");
      } else {
        const cached = sessionStorage.getItem("dashboardCache");
        if (cached) {
          const parsed = JSON.parse(cached);
          setSalonName(parsed.salonName || "your salon");
          setStats(parsed.stats);
          setCommissions(parsed.commissions);
          setMonthlyPoints(parsed.monthlyPoints || []);
          setActivity(parsed.activity || []);
          setLoading(false);
          return;
        }
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

      if (needsOwnerActivationWizard(salonData.onboarding_status as string)) {
        router.replace("/dashboard/profile");
        return;
      }

      setSalonName((salonData.name as string) || "your salon");

      const revenue = bookings.reduce((sum, booking) => sum + getBookingAmount(booking), 0);
      const activeServices = services.filter((service) => service.status === "active").length;

      const newStats = {
        totalBookings: bookings.length,
        activeServices,
        totalStaff: staff.length,
        revenue,
      };

      let fetchedCommissions: CommissionRow[] = [];
      const latestBooking = bookings[0];
      if (latestBooking) {
        const salonShare = Number(latestBooking.salon_upfront_amount ?? 0);
        const platformShare = Number(latestBooking.platform_commission_amount ?? 0);
        const agentShare = Number(latestBooking.agent_commission_amount ?? 0);

        if (salonShare > 0 || platformShare > 0) {
          if (salonShare > 0) {
            fetchedCommissions.push({
              entity_type: "salon",
              amount: salonShare,
              description: "Salon share from latest booking",
            });
          }
          if (platformShare > 0) {
            fetchedCommissions.push({
              entity_type: "platform",
              amount: platformShare,
              description: "Platform fee from latest booking",
            });
          }
        } else {
          const total = Number(latestBooking.amount ?? 0);
          fetchedCommissions = [
            { entity_type: "salon", amount: Math.round(total * 0.8), description: "Estimated salon share (80%)" },
            { entity_type: "platform", amount: Math.round(total * 0.2), description: "Estimated platform fee (20%)" },
          ];
        }
      }

      const feed: ActivityItem[] = [];
      for (const booking of bookings.slice(0, 4)) {
        feed.push({
          id: `booking-${booking.id}`,
          title: "Booking update",
          description: `${booking.customer_email || "Customer"} · LKR ${formatLkr(getBookingAmount(booking))} · ${booking.status}`,
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
      setCommissions(fetchedCommissions);
      setMonthlyPoints(monthly);
      setActivity(feed.slice(0, 6));

      sessionStorage.setItem(
        "dashboardCache",
        JSON.stringify({
          salonName: salonData.name,
          stats: newStats,
          commissions: fetchedCommissions,
          monthlyPoints: monthly,
          activity: feed.slice(0, 6),
        })
      );
    } catch (err) {
      console.error("Failed to fetch dashboard stats", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [router]);

  useEffect(() => {
    void Promise.resolve().then(() => {
      fetchDashboardStats(false);
    });
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
          onClick={() => fetchDashboardStats(true)}
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

      {commissions.length > 0 && (
        <div className="bg-white dark:bg-brand-surface-dark p-6 rounded-3xl border border-slate-200 dark:border-white/5 space-y-4">
          <div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
              Recent Booking Commission Split
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Split breakdown from your most recent booking in the database.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {commissions.map((row, i) => (
              <CommissionCard key={i} row={row} />
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SimpleBarChart title="Booking Trends" points={monthlyPoints} valueKey="bookings" />
        <SimpleBarChart title="Revenue Growth" points={monthlyPoints} valueKey="revenue" />
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
                        ? "bg-blue-500"
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
