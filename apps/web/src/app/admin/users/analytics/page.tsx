"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Download,
  Loader2,
  Map,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  UserMinus,
  UserPlus,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  fetchAdminUserAnalytics,
  type AdminUserAnalytics,
} from "@/app/actions/admin-user-analytics";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { withTimeout } from "@/lib/promise-timeout";

const numberFormatter = new Intl.NumberFormat("en-US");

function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

function formatCompact(value: number): string {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function formatChange(value: number | null): { label?: string; trend?: "up" | "down" | "neutral" } {
  if (value == null) return {};
  if (value > 0) return { label: `+${value}%`, trend: "up" };
  if (value < 0) return { label: `${value}%`, trend: "down" };
  return { label: "0%", trend: "neutral" };
}

function formatRelativeTime(value: string, nowIso: string): string {
  const timestamp = new Date(value).getTime();
  const now = new Date(nowIso).getTime();
  if (!Number.isFinite(timestamp) || !Number.isFinite(now)) return "Unknown";
  const seconds = Math.max(0, Math.round((now - timestamp) / 1000));
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  return new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric" }).format(new Date(value));
}

export default function AdminUserDashboard() {
  const [analytics, setAnalytics] = useState<AdminUserAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<7 | 30>(7);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await withTimeout(
        fetchAdminUserAnalytics(),
        30000,
        "Loading timed out. Check the admin database connection and refresh."
      );
      if (result.success === false) throw new Error(result.error);
      setAnalytics(result.analytics);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load account analytics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(loadAnalytics);
  }, []);

  const visibleSignupSeries = useMemo(() => analytics?.signupSeries.slice(-range) || [], [analytics, range]);
  const roleTotal = useMemo(() => analytics?.roles.reduce((sum, role) => sum + role.value, 0) || 0, [analytics]);
  const geographyMax = Math.max(1, ...(analytics?.geography.map((row) => row.value) || [1]));

  const exportReport = () => {
    if (!analytics) return;
    const rows = [
      ["Metric", "Value"],
      ["Generated at", analytics.generatedAt],
      ["Total users", analytics.totals.totalUsers],
      ["Active today", analytics.totals.activeToday],
      ["New signups (7 days)", analytics.totals.newSignups],
      ["Verified salons", analytics.totals.verifiedSalons],
      ["Active agents", analytics.totals.activeAgents],
      ["Suspended accounts", analytics.totals.suspended],
      ["Pending salon reviews", analytics.pendingSalonReviews],
      ["Location coverage", `${analytics.locationCoverage}%`],
      ...analytics.roles.map((role) => [`Role: ${role.name}`, role.value]),
      ...analytics.geography.map((row) => [`Province: ${row.name}`, row.value]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `trimma-identity-report-${analytics.generatedAt.slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const totalChange = formatChange(analytics?.changes.totalUsers ?? null);
  const signupChange = formatChange(analytics?.changes.newSignups ?? null);
  const verifiedChange = formatChange(analytics?.changes.verifiedSalons ?? null);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1A1C29]">Identity &amp; Access Dashboard</h1>
          <p className="mt-1 text-sm text-zinc-500">Live account data from Trimma authentication, salons, and agent records.</p>
          {analytics ? <p className="mt-1 text-xs text-zinc-400">Updated {formatRelativeTime(analytics.generatedAt, new Date().toISOString())}</p> : null}
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="h-10 gap-2 border-zinc-200 px-4 text-sm font-medium" onClick={exportReport} disabled={!analytics || loading}>
            <Download className="h-4 w-4" /> Export Report
          </Button>
          <Button variant="ghost" size="icon" aria-label="Refresh dashboard" onClick={() => void loadAnalytics()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Link href="/admin/users/create" className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-50">
            <UserPlus className="h-4 w-4" /> Add User
          </Link>
        </div>
      </div>

      {error ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between">
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={() => void loadAnalytics()}>Try again</Button>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KPICard title="Total Users" value={analytics ? formatNumber(analytics.totals.totalUsers) : "—"} change={totalChange.label} trend={totalChange.trend} icon={<Users />} loading={loading} />
        <KPICard title="Active Today" value={analytics ? formatNumber(analytics.totals.activeToday) : "—"} helper="Sri Lanka time" icon={<Activity />} loading={loading} />
        <KPICard title="New Signups" value={analytics ? formatNumber(analytics.totals.newSignups) : "—"} change={signupChange.label} trend={signupChange.trend} helper="Last 7 days" icon={<UserPlus />} loading={loading} />
        <KPICard title="Verified Salons" value={analytics ? formatNumber(analytics.totals.verifiedSalons) : "—"} change={verifiedChange.label} trend={verifiedChange.trend} icon={<ShieldCheck />} loading={loading} />
        <KPICard title="Active Agents" value={analytics ? formatNumber(analytics.totals.activeAgents) : "—"} icon={<TrendingUp />} loading={loading} />
        <KPICard title="Suspended" value={analytics ? formatNumber(analytics.totals.suspended) : "—"} icon={<UserMinus />} isWarning={Boolean(analytics?.totals.suspended)} loading={loading} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-[#1A1C29]">Signup Growth</h2>
              <p className="text-xs text-zinc-500">New authenticated accounts per day</p>
            </div>
            <select value={range} onChange={(event) => setRange(Number(event.target.value) as 7 | 30)} className="rounded-lg border-none bg-zinc-50 px-3 py-1.5 text-xs font-medium outline-none" aria-label="Signup chart range">
              <option value={7}>Last 7 Days</option>
              <option value={30}>Last 30 Days</option>
            </select>
          </div>
          <div className="h-[300px] w-full">
            {loading ? <LoadingPanel /> : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={visibleSignupSeries}>
                  <defs>
                    <linearGradient id="colorSignups" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-brand)" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="var(--color-brand)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f1" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} dy={10} />
                  <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }} />
                  <Area type="monotone" dataKey="signups" stroke="var(--color-brand)" strokeWidth={3} fill="url(#colorSignups)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
          <h2 className="mb-1 font-bold text-[#1A1C29]">User Distribution</h2>
          <p className="mb-4 text-xs text-zinc-500">Authenticated accounts by assigned role</p>
          <div className="relative h-[230px] w-full">
            {loading ? <LoadingPanel /> : roleTotal === 0 ? <EmptyPanel label="No account roles found" /> : (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={analytics?.roles || []} cx="50%" cy="50%" innerRadius={58} outerRadius={78} paddingAngle={4} dataKey="value">
                      {(analytics?.roles || []).map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-[#1A1C29]">{formatCompact(roleTotal)}</span>
                  <span className="text-[10px] font-medium uppercase text-zinc-500">Total</span>
                </div>
              </>
            )}
          </div>
          <div className="mt-3 space-y-2">
            {(analytics?.roles || []).map((role) => (
              <div key={role.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: role.color }} /><span className="font-medium text-zinc-600">{role.name}</span></div>
                <span className="font-semibold text-zinc-900">{roleTotal ? `${((role.value / roleTotal) * 100).toFixed(1)}%` : "0%"}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <section className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm lg:col-span-3">
          <div className="mb-6 flex items-center justify-between">
            <div><h2 className="font-bold text-[#1A1C29]">Account Geography</h2><p className="text-xs text-zinc-500">Profile and salon-owner locations by province</p></div>
            <div className="flex items-center gap-2 text-xs font-medium text-zinc-500"><Map className="h-4 w-4" /> {analytics?.locationCoverage || 0}% location coverage</div>
          </div>
          {loading ? <div className="h-44"><LoadingPanel /></div> : analytics?.geography.length ? (
            <div className="grid grid-cols-1 gap-x-10 gap-y-4 md:grid-cols-2">
              {analytics.geography.map((row) => <GeoRow key={row.name} label={row.name} value={row.value} percent={(row.value / geographyMax) * 100} />)}
            </div>
          ) : <EmptyPanel label="No account locations have been saved yet" />}
        </section>

        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1A1C29] to-[#2D3047] p-6 text-white shadow-xl">
          <div className="relative z-10">
            <div className="mb-5 flex items-center gap-2"><Activity className="h-5 w-5 text-[#ffde5a]" /><h2 className="text-lg font-bold">Live Insights</h2></div>
            <div className="space-y-3">
              <InsightCard title="Salon reviews" value={`${analytics?.pendingSalonReviews || 0} pending`} description="Listings awaiting agent or admin review" tone={(analytics?.pendingSalonReviews || 0) > 0 ? "warning" : "success"} />
              <InsightCard title="Account growth" value={signupChange.label || "No comparison"} description="New signups versus the previous 7 days" tone={(analytics?.changes.newSignups || 0) < 0 ? "warning" : "success"} />
              <InsightCard title="Location coverage" value={`${analytics?.locationCoverage || 0}%`} description="Accounts with a usable province" tone={(analytics?.locationCoverage || 0) >= 80 ? "success" : "info"} />
            </div>
            <Link href="/admin/salons" className="mt-5 inline-flex h-10 w-full items-center justify-center rounded-xl bg-white text-sm font-semibold text-zinc-900 hover:bg-zinc-100">Review salon queue</Link>
          </div>
        </section>
      </div>

      <section className="overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-zinc-50 p-6">
          <div><h2 className="font-bold text-[#1A1C29]">Recent Account Activity</h2><p className="mt-1 text-xs text-zinc-500">Latest account creations and sign-ins available from authentication records</p></div>
          <Link href="/admin/users/all" className="text-sm font-medium text-zinc-500 hover:text-zinc-900">View all users</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50/50 text-xs font-medium uppercase tracking-wide text-zinc-500"><tr><th className="px-6 py-4">User</th><th className="px-6 py-4">Role</th><th className="px-6 py-4">Activity</th><th className="px-6 py-4">When</th><th className="px-6 py-4 text-right">Source</th></tr></thead>
            <tbody className="divide-y divide-zinc-50">
              {loading ? <tr><td colSpan={5} className="h-32"><LoadingPanel /></td></tr> : analytics?.recentActivity.length ? analytics.recentActivity.map((item) => (
                <tr key={`${item.id}-${item.occurredAt}`} className="hover:bg-zinc-50/50">
                  <td className="px-6 py-4"><div className="flex items-center gap-3"><Avatar className="h-9 w-9 border border-zinc-100">{item.avatarUrl ? <AvatarImage src={item.avatarUrl} /> : null}<AvatarFallback>{item.name.charAt(0).toUpperCase()}</AvatarFallback></Avatar><div className="min-w-0"><div className="truncate font-semibold text-zinc-900">{item.name}</div><div className="truncate text-xs text-zinc-500">{item.email}</div></div></div></td>
                  <td className="px-6 py-4 text-zinc-600">{item.role}</td>
                  <td className="px-6 py-4 font-medium text-zinc-700">{item.action}</td>
                  <td className="px-6 py-4 text-zinc-500">{formatRelativeTime(item.occurredAt, analytics.generatedAt)}</td>
                  <td className="px-6 py-4 text-right"><Badge variant="secondary" className="border-none bg-emerald-50 text-emerald-700">Live auth data</Badge></td>
                </tr>
              )) : <tr><td colSpan={5}><EmptyPanel label="No authentication activity found" /></td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function KPICard({ title, value, change, trend, helper, icon, isWarning, loading }: { title: string; value: string; change?: string; trend?: "up" | "down" | "neutral"; helper?: string; icon: React.ReactNode; isWarning?: boolean; loading?: boolean }) {
  return (
    <div className={`group relative overflow-hidden rounded-2xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md ${isWarning ? "border-amber-200" : "border-zinc-100"}`}>
      <div className={`absolute right-0 top-0 p-3 transition-transform group-hover:scale-110 ${isWarning ? "text-amber-200" : "text-zinc-200"}`}>{icon}</div>
      <div className="relative z-10"><p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{title}</p><div className="mt-2 flex items-end gap-2">
        {loading ? <span className="h-8 w-20 animate-pulse rounded bg-zinc-100" /> : <h2 className="text-2xl font-bold text-[#1A1C29]">{value}</h2>}
        {change ? <span className={`mb-1 flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold ${trend === "up" ? "bg-emerald-50 text-emerald-600" : trend === "down" ? "bg-red-50 text-red-600" : "bg-zinc-50 text-zinc-500"}`}>{trend === "up" ? <ArrowUpRight className="mr-0.5 h-2.5 w-2.5" /> : null}{trend === "down" ? <ArrowDownRight className="mr-0.5 h-2.5 w-2.5" /> : null}{change}</span> : null}
      </div>{helper ? <p className="mt-1 text-[10px] font-medium text-zinc-400">{helper}</p> : null}</div>
    </div>
  );
}

function GeoRow({ label, value, percent }: { label: string; value: number; percent: number }) {
  return <div className="space-y-1.5"><div className="flex justify-between text-sm font-medium"><span className="text-zinc-600">{label}</span><span className="font-bold text-zinc-900">{formatNumber(value)}</span></div><div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100"><div className="h-full rounded-full bg-gradient-to-r from-[#1A1C29] to-brand" style={{ width: `${Math.max(4, percent)}%` }} /></div></div>;
}

function InsightCard({ title, value, description, tone }: { title: string; value: string; description: string; tone: "success" | "warning" | "info" }) {
  const dotClass = tone === "success" ? "bg-emerald-400" : tone === "warning" ? "bg-amber-400" : "bg-blue-400";
  return <div className="rounded-2xl border border-white/10 bg-white/10 p-4"><div className="mb-1 flex items-center gap-2"><span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} /><span className="text-[10px] font-bold uppercase tracking-widest text-white/70">{title}</span></div><p className="font-bold text-white">{value}</p><p className="mt-1 text-xs leading-relaxed text-white/60">{description}</p></div>;
}

function LoadingPanel() {
  return <div className="flex h-full w-full items-center justify-center text-zinc-400"><Loader2 className="h-6 w-6 animate-spin" /></div>;
}

function EmptyPanel({ label }: { label: string }) {
  return <div className="flex min-h-32 items-center justify-center p-6 text-center text-sm text-zinc-400">{label}</div>;
}
