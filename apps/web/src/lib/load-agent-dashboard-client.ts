import { supabase } from "@/config/supabase";
import { isAgentSalonLive, getAgentSalonStatusLabel } from "@/lib/agent-salons";
import { formatRelativeTime } from "@/lib/dashboard-stats";
import { normalizeEmail } from "@/lib/normalize-email";
import { resolveTrimmaUserRole } from "@/lib/trimma-role";
import type { TrimmaUserRole } from "@/lib/auth-routes";

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

export type AgentDashboardClientResult =
  | {
      success: true;
      data: {
        agentEmail: string;
        agentName: string;
        territoryLabel: string;
        stats: {
          assignedCount: number;
          convertedCount: number;
          commissionRate: number;
          bookingCommissions: number;
          subscriptionCommissions: number;
          hotLeads: AssignedSalon[];
          upcomingTasks: AgentTask[];
        };
      };
    }
  | { success: false; error: string; role?: TrimmaUserRole | null };

/** Client-side agent dashboard load when server actions are unavailable. */
export async function loadAgentDashboardFromClient(): Promise<AgentDashboardClientResult> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user?.email) {
    return { success: false, error: "Not authenticated" };
  }

  const role = await resolveTrimmaUserRole(session.user.id, session.user.email);
  if (role !== "agent" && role !== "admin") {
    return { success: false, error: "Unauthorized access", role: role ?? null };
  }

  const email = normalizeEmail(session.user.email)!;

  const { data: userData } = await supabase
    .from("users")
    .select("full_name")
    .eq("email", email)
    .maybeSingle();

  const agentName = userData?.full_name || email.split("@")[0];

  const [
    { data: salonRows },
    { data: agentProfile },
    { data: bookingRows },
    { data: ledgerRows },
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

  if (agentProfile?.id) {
    const { data: territoryData } = await supabase
      .from("agent_territories")
      .select("territories ( name, type )")
      .eq("agent_id", agentProfile.id);

    if (territoryData?.length) {
      const labels = territoryData
        .map((row) => {
          const joined = row.territories as { name?: string } | { name?: string }[] | null;
          if (Array.isArray(joined)) return joined[0]?.name;
          return joined?.name;
        })
        .filter((name): name is string => Boolean(name));
      if (labels.length > 0) territoryLabel = labels.join(" · ");
    }
  }

  const salons = salonRows || [];
  const assignedCount = salons.length;
  const convertedCount = salons.filter((s) => isAgentSalonLive(s.onboarding_status)).length;
  const hotLeads = salons.slice(0, 3) as AssignedSalon[];
  const commRate = agentProfile?.commission_rate || 10;

  const bookingCommissions = (bookingRows || []).reduce(
    (sum, b) => sum + (Number(b.agent_commission_amount) || 0),
    0
  );
  const subscriptionCommissions = (ledgerRows || []).reduce(
    (sum, e) => sum + (Number(e.amount) || 0),
    0
  );

  const pendingSalons = salons
    .filter((s) => !isAgentSalonLive(s.onboarding_status) && s.onboarding_status !== "REJECTED")
    .slice(0, 5);

  const upcomingTasks: AgentTask[] = pendingSalons.map((salon) => {
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
        bookingCommissions,
        subscriptionCommissions,
        hotLeads,
        upcomingTasks,
      },
    },
  };
}
