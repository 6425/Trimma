"use server";

import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { requireAgentFromCookies } from "@/lib/server-agent-auth";
import { findAgentRecord } from "@/lib/agent-territory-resolve";

export type AgentCommissionBooking = {
  id: string;
  salon_id: string;
  salon_name: string;
  booking_date: string;
  status: string;
  amount: number;
  customer_email: string;
  agent_cut: number;
  agent_percent: number;
};

export type AgentCommissionSubscription = {
  id: string;
  amount: number;
  status: string;
  notes: string | null;
  created_at: string;
};

export async function getAgentCommissionsData() {
  const auth = await requireAgentFromCookies();
  if ("error" in auth) return { success: false as const, error: auth.error };

  const supabase = createSupabaseAdminClient();
  const email = auth.email;

  const [
    masterRes,
    agentRow,
    salonsRes,
    bookingsByAgentRes,
    ledgerRes,
  ] = await Promise.all([
    supabase
      .from("commission_master")
      .select("commission_type, platform_percentage, salon_percentage, agent_percentage, active")
      .eq("active", true),
    findAgentRecord(supabase, email, auth.userId),
    supabase.from("salons").select("id, name").eq("assign_to", email),
    supabase
      .from("bookings")
      .select(
        "id, salon_id, booking_date, status, amount, customer_email, agent_commission_amount, agent_commission_percent, salons(name)"
      )
      .eq("agent_email", email)
      .order("booking_date", { ascending: false }),
    supabase
      .from("commission_ledger")
      .select("*")
      .eq("agent_email", email)
      .order("created_at", { ascending: false }),
  ]);

  const bookingMaster = (masterRes.data || []).find((r) => r.commission_type === "booking");
  const subscriptionMaster = (masterRes.data || []).find((r) => r.commission_type === "subscription");

  const bookingAgentPct =
    Number(bookingMaster?.agent_percentage) ||
    Number(agentRow?.commission_rate) ||
    20;
  const subscriptionAgentPct = Number(subscriptionMaster?.agent_percentage) || 20;

  const salonMap = new Map<string, string>();
  for (const salon of salonsRes.data || []) {
    salonMap.set(salon.id, salon.name);
  }

  const bookingIds = new Set<string>();
  const bookings: AgentCommissionBooking[] = [];

  const pushBooking = (row: Record<string, unknown>) => {
    const id = String(row.id);
    if (bookingIds.has(id)) return;
    bookingIds.add(id);

    const amount = Number(row.amount) || 0;
    const storedPct = Number(row.agent_commission_percent);
    const agentPercent = storedPct > 0 ? storedPct : bookingAgentPct;
    const storedCut = Number(row.agent_commission_amount);
    const agentCut = storedCut > 0 ? storedCut : amount * (agentPercent / 100);
    const salonsJoin = row.salons as { name?: string } | { name?: string }[] | null;
    const joinedName = Array.isArray(salonsJoin) ? salonsJoin[0]?.name : salonsJoin?.name;

    bookings.push({
      id,
      salon_id: String(row.salon_id || ""),
      salon_name: joinedName || salonMap.get(String(row.salon_id)) || "Referred Salon",
      booking_date: String(row.booking_date || ""),
      status: String(row.status || "pending"),
      amount,
      customer_email: String(row.customer_email || "—"),
      agent_cut: agentCut,
      agent_percent: agentPercent,
    });
  };

  for (const row of bookingsByAgentRes.data || []) {
    pushBooking(row as Record<string, unknown>);
  }

  const salonIds = [...salonMap.keys()];
  if (salonIds.length > 0) {
    const { data: salonBookings } = await supabase
      .from("bookings")
      .select(
        "id, salon_id, booking_date, status, amount, customer_email, agent_commission_amount, agent_commission_percent, salons(name)"
      )
      .in("salon_id", salonIds)
      .order("booking_date", { ascending: false });

    for (const row of salonBookings || []) {
      pushBooking(row as Record<string, unknown>);
    }
  }

  bookings.sort(
    (a, b) => new Date(b.booking_date).getTime() - new Date(a.booking_date).getTime()
  );

  // Only subscription-categorized ledger rows are subscription commission.
  // Base (un-patched) ledger rows are lead-conversion signup rewards, not subscription.
  const subscriptions: AgentCommissionSubscription[] = (ledgerRes.data || [])
    .filter((row) => String(row.commission_category || "").toLowerCase() === "subscription")
    .map((row) => ({
      id: row.id,
      amount: Number(row.amount) || 0,
      status: row.status || "PENDING",
      notes: row.notes,
      created_at: row.created_at,
    }));

  let allTimeBookingGross = 0;
  bookings.forEach((b) => {
    if (b.status === "completed" || b.status === "confirmed") {
      allTimeBookingGross += b.amount;
    }
  });

  return {
    success: true as const,
    agentEmail: email,
    bookingAgentPct,
    subscriptionAgentPct,
    profileCommissionRate: Number(agentRow?.commission_rate) || bookingAgentPct,
    referredSalonCount: salonIds.length,
    bookings,
    subscriptions,
    allTimeBookingGross,
  };
}
