"use server";

import type { User } from "@supabase/supabase-js";
import { adminDbFailure, isAdminDbSuccess, withAdminDb } from "@/lib/with-admin-db";

const COLOMBO_TIME_ZONE = "Asia/Colombo";
const DAY_MS = 24 * 60 * 60 * 1000;
const PAGE_SIZE = 1000;

type PublicUserRow = {
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  global_role: string | null;
  created_at: string | null;
};

type SalonRow = {
  id: string;
  owner_email: string | null;
  owner_gmail: string | null;
  province: string | null;
  status: string | null;
  onboarding_status: string | null;
  is_verified: boolean | null;
  verified_at: string | null;
};

type AgentRow = {
  id: string;
  user_email: string | null;
  status: string | null;
};

export type AdminUserAnalytics = {
  generatedAt: string;
  totals: {
    totalUsers: number;
    activeToday: number;
    newSignups: number;
    verifiedSalons: number;
    activeAgents: number;
    suspended: number;
  };
  changes: {
    totalUsers: number | null;
    newSignups: number | null;
    verifiedSalons: number | null;
  };
  signupSeries: Array<{ date: string; name: string; signups: number }>;
  roles: Array<{ name: string; value: number; color: string }>;
  geography: Array<{ name: string; value: number }>;
  locationCoverage: number;
  pendingSalonReviews: number;
  recentActivity: Array<{
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
    role: string;
    action: "Signed in" | "Account created";
    occurredAt: string;
  }>;
};

function normalizedEmail(value: unknown): string {
  return String(value || "").trim().toLowerCase();
}

function dateKeyInColombo(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: COLOMBO_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function startOfColomboDay(now: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: COLOMBO_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return Date.UTC(Number(values.year), Number(values.month) - 1, Number(values.day)) - 5.5 * 60 * 60 * 1000;
}

function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return Number((((current - previous) / previous) * 100).toFixed(1));
}

function isVerifiedSalon(salon: SalonRow): boolean {
  return salon.is_verified === true || String(salon.onboarding_status || "").toUpperCase() === "VERIFIED";
}

function isPendingSalonReview(salon: SalonRow): boolean {
  if (isVerifiedSalon(salon)) return false;
  const onboarding = String(salon.onboarding_status || "").toUpperCase();
  const status = String(salon.status || "").toLowerCase();
  return ["PENDING_ADMIN_VERIFICATION", "AGENT_APPROVED", "OWNER_ACTIVATED"].includes(onboarding) || status === "pending";
}

function isSuspended(user: User, nowMs: number): boolean {
  if (!user.banned_until) return false;
  const bannedUntil = new Date(user.banned_until).getTime();
  return Number.isFinite(bannedUntil) && bannedUntil > nowMs;
}

function roleLabel(role: string | null | undefined): string {
  const normalized = String(role || "customer").trim().toLowerCase();
  if (normalized === "salon_owner") return "Salon Owner";
  if (normalized === "regional_head" || normalized === "regional_admin") return "Regional Head";
  if (normalized === "superadmin") return "Super Admin";
  if (normalized === "admin") return "Admin";
  if (normalized === "agent") return "Agent";
  if (normalized === "salon_staff" || normalized === "staff") return "Salon Staff";
  return "Customer";
}

function roleBucket(role: string | null | undefined): string {
  const label = roleLabel(role);
  if (label === "Super Admin" || label === "Admin") return "Administrators";
  if (label === "Regional Head") return "Regional Heads";
  if (label === "Salon Staff") return "Salon Staff";
  if (label === "Salon Owner") return "Salon Owners";
  if (label === "Agent") return "Agents";
  return "Customers";
}

function authDisplayName(user: User): string {
  const metadata = user.user_metadata || {};
  return String(metadata.full_name || metadata.name || user.email?.split("@")[0] || "Trimma user");
}

function authAvatar(user: User): string | null {
  const metadata = user.user_metadata || {};
  const value = metadata.avatar_url || metadata.picture;
  return typeof value === "string" && value.trim() ? value : null;
}

async function listAllAuthUsers(supabase: Parameters<Parameters<typeof withAdminDb>[0]>[0]): Promise<User[]> {
  const users: User[] = [];
  for (let page = 1; page <= 100; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: PAGE_SIZE });
    if (error) throw new Error(error.message);
    const rows = data?.users || [];
    users.push(...rows);
    if (rows.length < PAGE_SIZE) break;
  }
  return users;
}

export async function fetchAdminUserAnalytics() {
  const result = await withAdminDb(async (supabase) => {
    const [authUsers, publicUsers, salons, agents] = await Promise.all([
      listAllAuthUsers(supabase),
      (async () => {
        const rows: PublicUserRow[] = [];
        for (let from = 0; from < 100_000; from += PAGE_SIZE) {
          const { data, error } = await supabase
            .from("users")
            .select("email, full_name, avatar_url, global_role, created_at")
            .order("email")
            .range(from, from + PAGE_SIZE - 1);
          if (error) throw new Error(error.message);
          const page = (data || []) as PublicUserRow[];
          rows.push(...page);
          if (page.length < PAGE_SIZE) break;
        }
        return rows;
      })(),
      (async () => {
        const rows: SalonRow[] = [];
        for (let from = 0; from < 100_000; from += PAGE_SIZE) {
          const { data, error } = await supabase
            .from("salons")
            .select("id, owner_email, owner_gmail, province, status, onboarding_status, is_verified, verified_at")
            .order("id")
            .range(from, from + PAGE_SIZE - 1);
          if (error) throw new Error(error.message);
          const page = (data || []) as SalonRow[];
          rows.push(...page);
          if (page.length < PAGE_SIZE) break;
        }
        return rows;
      })(),
      (async () => {
        const rows: AgentRow[] = [];
        for (let from = 0; from < 100_000; from += PAGE_SIZE) {
          const { data, error } = await supabase
            .from("agents")
            .select("id, user_email, status")
            .order("id")
            .range(from, from + PAGE_SIZE - 1);
          if (error) throw new Error(error.message);
          const page = (data || []) as AgentRow[];
          rows.push(...page);
          if (page.length < PAGE_SIZE) break;
        }
        return rows;
      })(),
    ]);

    const now = new Date();
    const nowMs = now.getTime();
    const todayStart = startOfColomboDay(now);
    const sevenDayStart = todayStart - 6 * DAY_MS;
    const previousSevenDayStart = sevenDayStart - 7 * DAY_MS;
    const thirtyDayStart = todayStart - 29 * DAY_MS;

    const publicByEmail = new Map(publicUsers.map((user) => [normalizedEmail(user.email), user]));
    const totalUsers = authUsers.length;
    const activeToday = authUsers.filter((user) => {
      const lastSignIn = user.last_sign_in_at ? new Date(user.last_sign_in_at).getTime() : 0;
      return lastSignIn >= todayStart && lastSignIn <= nowMs;
    }).length;
    const currentSignups = authUsers.filter((user) => {
      const created = new Date(user.created_at).getTime();
      return created >= sevenDayStart && created <= nowMs;
    }).length;
    const previousSignups = authUsers.filter((user) => {
      const created = new Date(user.created_at).getTime();
      return created >= previousSevenDayStart && created < sevenDayStart;
    }).length;
    const usersThirtyDaysAgo = authUsers.filter((user) => new Date(user.created_at).getTime() < thirtyDayStart).length;
    const verifiedSalons = salons.filter(isVerifiedSalon);
    const recentlyVerified = verifiedSalons.filter((salon) => {
      const verifiedAt = salon.verified_at ? new Date(salon.verified_at).getTime() : 0;
      return verifiedAt >= thirtyDayStart && verifiedAt <= nowMs;
    }).length;
    const previouslyVerified = verifiedSalons.length - recentlyVerified;
    const activeAgentEmails = new Set(
      agents
        .filter((agent) => String(agent.status || "active").toLowerCase() === "active")
        .map((agent) => normalizedEmail(agent.user_email))
        .filter(Boolean)
    );

    const signupCounts = new Map<string, number>();
    for (const user of authUsers) {
      const created = new Date(user.created_at).getTime();
      if (created < thirtyDayStart || created > nowMs) continue;
      const key = dateKeyInColombo(user.created_at);
      if (key) signupCounts.set(key, (signupCounts.get(key) || 0) + 1);
    }
    const signupSeries = Array.from({ length: 30 }, (_, index) => {
      const date = new Date(todayStart - (29 - index) * DAY_MS);
      const key = dateKeyInColombo(date);
      return {
        date: key,
        name: new Intl.DateTimeFormat("en-US", {
          timeZone: COLOMBO_TIME_ZONE,
          month: "short",
          day: "numeric",
        }).format(date),
        signups: signupCounts.get(key) || 0,
      };
    });

    const roleCounts = new Map<string, number>();
    for (const user of authUsers) {
      const publicUser = publicByEmail.get(normalizedEmail(user.email));
      const metadataRole = user.user_metadata?.global_role || user.user_metadata?.role;
      const bucket = roleBucket(publicUser?.global_role || (typeof metadataRole === "string" ? metadataRole : null));
      roleCounts.set(bucket, (roleCounts.get(bucket) || 0) + 1);
    }
    const roleColors: Record<string, string> = {
      Customers: "var(--color-brand)",
      "Salon Owners": "#4A154B",
      "Salon Staff": "#334155",
      Agents: "#F59E0B",
      "Regional Heads": "#2563EB",
      Administrators: "#059669",
    };
    const roles = [...roleCounts.entries()]
      .map(([name, value]) => ({ name, value, color: roleColors[name] || "#71717A" }))
      .filter((role) => role.value > 0)
      .sort((a, b) => b.value - a.value);

    const locationByEmail = new Map<string, string>();
    for (const user of authUsers) {
      const province = user.user_metadata?.province;
      if (typeof province === "string" && province.trim()) {
        locationByEmail.set(normalizedEmail(user.email), province.trim());
      }
    }
    for (const salon of salons) {
      const email = normalizedEmail(salon.owner_email || salon.owner_gmail);
      if (email && salon.province?.trim() && !locationByEmail.has(email)) {
        locationByEmail.set(email, salon.province.trim());
      }
    }
    const geographyCounts = new Map<string, number>();
    for (const province of locationByEmail.values()) {
      geographyCounts.set(province, (geographyCounts.get(province) || 0) + 1);
    }
    const geography = [...geographyCounts.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    const recentActivity = authUsers
      .map((user) => {
        const publicUser = publicByEmail.get(normalizedEmail(user.email));
        const createdAt = new Date(user.created_at).getTime();
        const signedInAt = user.last_sign_in_at ? new Date(user.last_sign_in_at).getTime() : 0;
        const signedInAfterCreation = signedInAt > createdAt + 60_000;
        const occurredAt = signedInAfterCreation ? user.last_sign_in_at! : user.created_at;
        return {
          id: user.id,
          name: publicUser?.full_name || authDisplayName(user),
          email: user.email || "Email unavailable",
          avatarUrl: publicUser?.avatar_url || authAvatar(user),
          role: roleLabel(publicUser?.global_role || (user.user_metadata?.role as string | undefined)),
          action: signedInAfterCreation ? ("Signed in" as const) : ("Account created" as const),
          occurredAt,
        };
      })
      .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
      .slice(0, 8);

    const analytics: AdminUserAnalytics = {
      generatedAt: now.toISOString(),
      totals: {
        totalUsers,
        activeToday,
        newSignups: currentSignups,
        verifiedSalons: verifiedSalons.length,
        activeAgents: activeAgentEmails.size,
        suspended: authUsers.filter((user) => isSuspended(user, nowMs)).length,
      },
      changes: {
        totalUsers: percentChange(totalUsers, usersThirtyDaysAgo),
        newSignups: percentChange(currentSignups, previousSignups),
        verifiedSalons: recentlyVerified > 0 ? percentChange(verifiedSalons.length, previouslyVerified) : 0,
      },
      signupSeries,
      roles,
      geography,
      locationCoverage: totalUsers > 0 ? Math.round((locationByEmail.size / totalUsers) * 100) : 0,
      pendingSalonReviews: salons.filter(isPendingSalonReview).length,
      recentActivity,
    };

    return analytics;
  });

  if (!isAdminDbSuccess(result)) return adminDbFailure(result);
  return { success: true as const, analytics: result.data };
}
