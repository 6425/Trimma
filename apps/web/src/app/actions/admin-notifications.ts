"use server";

import { adminDbFailure, isAdminDbSuccess, withAdminDb } from "@/lib/with-admin-db";

export type AdminNotificationItem = {
  id: string;
  type: "salon_verification" | "salon_approval" | "salon_request" | "onboarding_activity";
  title: string;
  body: string;
  href: string;
  createdAt: string;
};

export async function fetchAdminNotifications(limit = 20) {
  const result = await withAdminDb(async (supabase) => {
    const items: AdminNotificationItem[] = [];

    const [verificationRes, pendingRes, requestsRes, logsRes] = await Promise.all([
      supabase
        .from("salons")
        .select("id, name, onboarding_status, created_at")
        .in("onboarding_status", ["PENDING_ADMIN_VERIFICATION", "AGENT_APPROVED"])
        .eq("is_verified", false)
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("salons")
        .select("id, name, status, onboarding_status, created_at")
        .or("status.eq.pending,status.eq.pending_approval")
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("salon_requests")
        .select("id, business_name, full_name, inquiry_type, created_at, status")
        .in("status", ["new", "reviewing"])
        .order("created_at", { ascending: false })
        .limit(8),
      supabase
        .from("onboarding_logs")
        .select("id, action, notes, actor_email, created_at, salons(name)")
        .order("created_at", { ascending: false })
        .limit(6),
    ]);

    if (verificationRes.error) throw new Error(verificationRes.error.message);
    if (pendingRes.error) throw new Error(pendingRes.error.message);
    if (logsRes.error) throw new Error(logsRes.error.message);

    const verificationIds = new Set((verificationRes.data || []).map((row) => row.id));

    for (const salon of verificationRes.data || []) {
      items.push({
        id: `verify-${salon.id}`,
        type: "salon_verification",
        title: "Salon awaiting verification",
        body: salon.name || "Unnamed salon",
        href: "/admin/salons",
        createdAt: salon.created_at || new Date().toISOString(),
      });
    }

    for (const salon of pendingRes.data || []) {
      if (verificationIds.has(salon.id)) continue;
      const onboarding = String(salon.onboarding_status || "");
      if (["PENDING_ADMIN_VERIFICATION", "AGENT_APPROVED"].includes(onboarding)) continue;

      items.push({
        id: `approve-${salon.id}`,
        type: "salon_approval",
        title: "Salon pending approval",
        body: salon.name || "Unnamed salon",
        href: "/admin/salons",
        createdAt: salon.created_at || new Date().toISOString(),
      });
    }

    if (!requestsRes.error) {
      for (const request of requestsRes.data || []) {
        const label = request.business_name || request.full_name || "New inquiry";
        items.push({
          id: `request-${request.id}`,
          type: "salon_request",
          title: request.status === "reviewing" ? "Salon request in review" : "New salon request",
          body: label,
          href: "/admin/leads?tab=salon-requests",
          createdAt: request.created_at || new Date().toISOString(),
        });
      }
    }

    for (const log of logsRes.data || []) {
      const salonName = (log as { salons?: { name?: string } | null }).salons?.name || "Salon";
      items.push({
        id: `log-${log.id}`,
        type: "onboarding_activity",
        title: String(log.action || "Onboarding update").replace(/_/g, " "),
        body: log.notes || `${salonName} · ${log.actor_email || "system"}`,
        href: "/admin/salons",
        createdAt: log.created_at || new Date().toISOString(),
      });
    }

    items.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const notifications = items.slice(0, limit);
    const unreadCount = notifications.filter((item) => item.type !== "onboarding_activity").length;

    return { notifications, unreadCount };
  });

  if (!isAdminDbSuccess(result)) return adminDbFailure(result);
  return { success: true as const, ...result.data };
}
