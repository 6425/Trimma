"use server";

import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { getSalonAccessTokenFromCookies } from "@/lib/server-salon-auth";
import { isAgentSalonLive, getAgentSalonStatusLabel } from "@/lib/agent-salons";
import { formatRelativeTime } from "@/lib/dashboard-stats";
import { resolveTrimmaUserRole } from "@/lib/trimma-role";

type AssignedSalon = {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  rating: number | null;

  onboarding_status: string | null;
  created_at: string;
};

type AgentTask = {
  id: string;
  task: string;
  time: string;
  type: "call" | "msg" | "visit";
  status: string;
};

export async function getAgentDashboardData() {
  try {
    const accessToken = await getSalonAccessTokenFromCookies();
    if (!accessToken) {
      return { success: false, error: "Not authenticated" };
    }

    const supabase = createSupabaseAdminClient();
    const { data: authData } = await supabase.auth.getUser(accessToken);
    const user = authData.user;
    
    if (!user || !user.email) {
      return { success: false, error: "Not authenticated" };
    }

    const email = user.email;
    const userId = user.id;

    // Fetch user name
    const { data: userData } = await supabase
      .from("users")
      .select("full_name")
      .eq("email", email)
      .maybeSingle();

    const agentName = userData?.full_name || user.user_metadata?.full_name || email.split("@")[0];

    const role = await resolveTrimmaUserRole(user.id, email);
    const isAllowedAgent = role === "agent" || role === "admin";

    if (!isAllowedAgent) {
      return { success: false, error: "Unauthorized access", role };
    }

    // Fetch parallel data
    const [
      assignedSalonsRes,
      agentProfileRes,
      bookingCommissionsRes,
      ledgerRes,
    ] = await Promise.all([
      supabase
        .from("salons")
        .select("id, name, address, phone, rating, onboarding_status, created_at")
        .eq("assign_to", email)
        .order("created_at", { ascending: false }),
      supabase.from("agents").select("id, commission_rate").eq("user_email", email).maybeSingle(),
      supabase.from("bookings").select("agent_commission_amount").eq("agent_email", email),
      supabase.from("commission_ledger").select("amount, status").eq("agent_email", email),
    ]);

    let territoryLabel = "No territory assigned";

    if (agentProfileRes.data?.id) {
      const { data: territoryData } = await supabase
        .from("agent_territories")
        .select("territories ( name, type )")
        .eq("agent_id", agentProfileRes.data.id);
        
      const territories = territoryData || [];
      if (territories.length > 0) {
        const labels = territories
          .map((t: any) => t.territories?.name)
          .filter(Boolean);
        territoryLabel = labels.length > 0 ? labels.join(" · ") : "No territory assigned";
      }
    }

    const salonRows = assignedSalonsRes.data || [];
    const assignedCount = salonRows.length;
    const convertedCount = salonRows.filter((salon: any) => isAgentSalonLive(salon.onboarding_status)).length;
    const hotLeads = salonRows.slice(0, 3) as AssignedSalon[];

    const commRate = agentProfileRes.data?.commission_rate || 10;

    const totalBookingCommissions = (bookingCommissionsRes.data || []).reduce(
      (sum: number, booking: any) => sum + (Number(booking.agent_commission_amount) || 0),
      0
    );

    const subscriptionCommissions = (ledgerRes.data || []).reduce(
      (sum: number, entry: any) => sum + (Number(entry.amount) || 0),
      0
    );

    const pendingSalons = salonRows
      .filter((salon: any) => !isAgentSalonLive(salon.onboarding_status) && salon.onboarding_status !== "REJECTED")
      .slice(0, 5);

    const upcomingTasks: AgentTask[] = pendingSalons.map((salon: any) => {
      const status = salon.onboarding_status || "ASSIGNED_TO_AGENT";
      let type: AgentTask["type"] = "call";
      if (status === "OWNER_INVITED") type = "msg";
      if (status === "AGENT_VERIFIED" || status === "OWNER_ACTIVATED") type = "visit";

      return {
        id: salon.id,
        task: `${salon.name} · ${getAgentSalonStatusLabel(status)}`,
        time: formatRelativeTime(salon.created_at),
        type,
        status,
      };
    });

    return {
      success: true,
      data: {
        agentEmail: email,
        agentName,
        territoryLabel,
        stats: {
          assignedCount,
          convertedCount,
          commissionRate: commRate,
          bookingCommissions: totalBookingCommissions,
          subscriptionCommissions,
          hotLeads,
          upcomingTasks,
        }
      }
    };
  } catch (error: any) {
    console.error("Failed to load agent dashboard data:", error);
    return { success: false, error: error.message || "Unknown error" };
  }
}
