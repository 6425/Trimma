"use server";

import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { getAgentOperationalEmails } from "@/lib/agent-hierarchy";

export type WorkPriority = "HIGH" | "MEDIUM" | "LOW";

export type WorkItem = {
  id: string;
  type: "LEAD" | "SALON" | "COMMISSION" | "ALERT";
  businessName: string;
  businessId: string;
  currentStatus: string;
  lastActivityDate: string;
  priority: WorkPriority;
  recommendedAction: string;
  actionUrl: string;
  details?: string;
};

export async function fetchAgentWorkQueue(agentEmail: string) {
  if (!agentEmail) throw new Error("Agent email is required");

  const supabase = createSupabaseAdminClient();
  const workItems: WorkItem[] = [];
  const operationalEmails = await getAgentOperationalEmails(supabase, agentEmail);

  // 1. Fetch assigned leads (from salons table where onboarding_status is ASSIGNED_TO_AGENT, UNVERIFIED, etc.)
  const { data: leads, error: leadsError } = await supabase
    .from("salons")
    .select("id, name, onboarding_status, created_at, updated_at")
    .in("assign_to", operationalEmails)
    .not("onboarding_status", "in", '("VERIFIED","REJECTED","COMPLETED")');

  if (!leadsError && leads) {
    leads.forEach((lead: any) => {
      // Determine priority and action
      let priority: WorkPriority = "MEDIUM";
      let action = "Follow up";
      let actionUrl = `/agent/leads?open=${lead.id}`;

      if (lead.onboarding_status === "ASSIGNED_TO_AGENT") {
        priority = "HIGH";
        action = "Complete Field Editor & Invite Owner";
      } else if (lead.onboarding_status === "OWNER_INVITED") {
        priority = "LOW";
        action = "Wait for Owner Activation";
      } else if (lead.onboarding_status === "OWNER_ACTIVATED") {
        priority = "HIGH";
        action = "Approve & Enable Booking";
      } else if (lead.onboarding_status === "PENDING_ADMIN_VERIFICATION") {
        priority = "LOW";
        action = "Wait for Admin Verification";
      }

      const daysSinceUpdate = (new Date().getTime() - new Date(lead.updated_at || lead.created_at).getTime()) / (1000 * 3600 * 24);
      if (daysSinceUpdate > 3) priority = "HIGH";

      workItems.push({
        id: `lead-${lead.id}`,
        type: "LEAD",
        businessName: lead.name,
        businessId: lead.id,
        currentStatus: lead.onboarding_status || "NEW",
        lastActivityDate: lead.updated_at || lead.created_at,
        priority,
        recommendedAction: action,
        actionUrl,
      });
    });
  }

  // 2. Fetch assigned live salons needing onboarding (VERIFIED but not COMPLETED)
  const { data: salons, error: salonsError } = await supabase
    .from("salons")
    .select("id, name, onboarding_status, activation_status, updated_at")
    .in("assign_to", operationalEmails)
    .eq("onboarding_status", "VERIFIED"); // meaning it's verified but perhaps owner hasn't completed setup

  if (!salonsError && salons) {
    salons.forEach((salon: any) => {
      workItems.push({
        id: `salon-${salon.id}`,
        type: "SALON",
        businessName: salon.name,
        businessId: salon.id,
        currentStatus: salon.activation_status === "ACTIVE" ? "Active" : "Awaiting Owner Activation",
        lastActivityDate: salon.updated_at || new Date().toISOString(),
        priority: salon.activation_status === "ACTIVE" ? "LOW" : "HIGH",
        recommendedAction: salon.activation_status === "ACTIVE" ? "Review Performance" : "Assist Owner Activation",
        actionUrl: `/salons/${salon.id}`,
      });
    });
  }

  // 3. Fetch pending commissions
  const { data: commissions, error: commsError } = await supabase
    .from("commission_ledger")
    .select("id, amount, status, created_at, salon_id")
    .eq("agent_email", agentEmail)
    .eq("status", "pending");

  if (!commsError && commissions) {
    commissions.forEach((comm: any) => {
      workItems.push({
        id: `comm-${comm.id}`,
        type: "COMMISSION",
        businessName: `Commission: LKR ${comm.amount}`,
        businessId: comm.salon_id || "N/A",
        currentStatus: "Pending Payout",
        lastActivityDate: comm.created_at,
        priority: "MEDIUM",
        recommendedAction: "Review Payout",
        actionUrl: `/agent`, // commissions are usually on the dashboard
      });
    });
  }

  // 4. Fetch activity alerts (e.g. any onboarding_logs assigned to this agent needing attention)
  // We'll simulate alerts if a lead has been untouched for 7 days
  const staleDate = new Date();
  staleDate.setDate(staleDate.getDate() - 7);
  
  if (!leadsError && leads) {
    leads.forEach((lead: any) => {
      const lastUpdate = new Date(lead.updated_at || lead.created_at);
      if (lastUpdate < staleDate) {
        workItems.push({
          id: `alert-${lead.id}`,
          type: "ALERT",
          businessName: lead.name,
          businessId: lead.id,
          currentStatus: "Stale / No Activity",
          lastActivityDate: lead.updated_at || lead.created_at,
          priority: "HIGH",
          recommendedAction: "Reach Out Immediately",
          actionUrl: `/agent/leads?open=${lead.id}`,
        });
      }
    });
  }

  // 5. Fetch Performance Metrics
  const totalAssignedLeads = leads?.length || 0;
  const verifiedSalons = salons?.length || 0;
  const pendingCommissionsCount = commissions?.length || 0;
  const totalCommissionAmount = commissions?.reduce((acc: number, c: any) => acc + (Number(c.amount) || 0), 0) || 0;
  
  // Calculate a basic performance score (0-100)
  const totalHandled = totalAssignedLeads + verifiedSalons;
  const performanceScore = totalHandled === 0 ? 0 : Math.round((verifiedSalons / totalHandled) * 100);

  // Fetch recent activity
  const { data: activityLogs } = await supabase
    .from("agent_activity_logs")
    .select("*")
    .eq("agent_email", agentEmail)
    .order("created_at", { ascending: false })
    .limit(5);

  return {
    workItems: workItems.sort((a, b) => {
      const priorityWeight = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      if (priorityWeight[a.priority] !== priorityWeight[b.priority]) {
        return priorityWeight[b.priority] - priorityWeight[a.priority];
      }
      return new Date(b.lastActivityDate).getTime() - new Date(a.lastActivityDate).getTime();
    }),
    metrics: {
      totalAssignedLeads,
      verifiedSalons,
      pendingCommissionsCount,
      totalCommissionAmount,
      performanceScore,
    },
    activityLogs: activityLogs || [],
  };
}
