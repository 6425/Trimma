"use server";

import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { requireAgentFromCookies } from "@/lib/server-agent-auth";
import {
  calculateRegionalHeadNet,
  calculateSubAgentShare,
  clampSplitPercent,
  findAgentHierarchyRecord,
  getAgentOperationalEmails,
  listSubAgentsForRegionalHead,
  normalizeAgentTier,
} from "@/lib/agent-hierarchy";
import { normalizeEmail } from "@/lib/normalize-email";

export type AgentCommissionBooking = {
  id: string;
  salon_id: string;
  salon_name: string;
  booking_date: string;
  created_at: string;
  status: string;
  payment_status: string;
  reservation_fee_paid: boolean;
  amount: number;
  customer_email: string;
  agent_cut: number;
  gross_agent_cut: number;
  agent_percent: number;
  platform_commission: number;
  field_agent_email?: string | null;
  split_percent?: number;
};

export type AgentCommissionSubscription = {
  id: string;
  amount: number;
  gross_amount: number;
  status: string;
  notes: string | null;
  created_at: string;
  field_agent_email?: string | null;
  split_percent?: number;
};

export async function getAgentCommissionsData() {
  const auth = await requireAgentFromCookies();
  if ("error" in auth) return { success: false as const, error: auth.error };

  const supabase = createSupabaseAdminClient();
  const email = normalizeEmail(auth.email);

  const agentRow = await findAgentHierarchyRecord(supabase, email, auth.userId);
  const tier = normalizeAgentTier(agentRow?.agent_tier);
  const isFieldAgent = tier === "field_agent";
  const operationalEmails = await getAgentOperationalEmails(supabase, email, auth.userId);

  const splitByFieldEmail = new Map<string, number>();
  if (!isFieldAgent && agentRow?.id) {
    const subAgents = await listSubAgentsForRegionalHead(supabase, agentRow.id);
    for (const sub of subAgents) {
      const subEmail = normalizeEmail(sub.user_email || "");
      if (subEmail) {
        splitByFieldEmail.set(subEmail, clampSplitPercent(sub.sub_agent_split_percent));
      }
    }
  }

  const fieldAgentSplit = isFieldAgent
    ? clampSplitPercent(agentRow?.sub_agent_split_percent)
    : 0;

  const [
    masterRes,
    salonsRes,
    bookingsRes,
    ledgerRes,
  ] = await Promise.all([
    supabase
      .from("commission_master")
      .select("commission_type, platform_percentage, salon_percentage, agent_percentage, active")
      .eq("active", true),
    supabase.from("salons").select("id, name, assign_to").in("assign_to", operationalEmails),
    isFieldAgent
      ? supabase
          .from("bookings")
          .select(
            "id, salon_id, booking_date, created_at, status, payment_status, reservation_fee_paid, amount, customer_email, agent_email, field_agent_email, platform_commission_amount, agent_commission_amount, agent_commission_percent, salons(name)"
          )
          .ilike("field_agent_email", email)
          .order("booking_date", { ascending: false })
      : supabase
          .from("bookings")
          .select(
            "id, salon_id, booking_date, created_at, status, payment_status, reservation_fee_paid, amount, customer_email, agent_email, field_agent_email, platform_commission_amount, agent_commission_amount, agent_commission_percent, salons(name)"
          )
          .ilike("agent_email", email)
          .order("booking_date", { ascending: false }),
    isFieldAgent
      ? supabase
          .from("commission_ledger")
          .select("*")
          .ilike("field_agent_email", email)
          .order("created_at", { ascending: false })
      : supabase
          .from("commission_ledger")
          .select("*")
          .ilike("agent_email", email)
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
    const platformCommission = Number(row.platform_commission_amount) || 0;
    const storedGross = Number(row.agent_commission_amount) || 0;
    const grossAgentCut =
      storedGross > 0
        ? storedGross
        : platformCommission > 0
          ? platformCommission * (agentPercent / 100)
          : 0;

    const fieldEmail = normalizeEmail(String(row.field_agent_email || ""));
    const splitPercent = isFieldAgent
      ? fieldAgentSplit
      : fieldEmail
        ? splitByFieldEmail.get(fieldEmail) ?? clampSplitPercent(undefined)
        : 0;

    const agentCut = isFieldAgent
      ? calculateSubAgentShare(grossAgentCut, splitPercent)
      : fieldEmail
        ? calculateRegionalHeadNet(grossAgentCut, splitPercent)
        : grossAgentCut;

    const salonsJoin = row.salons as { name?: string } | { name?: string }[] | null;
    const joinedName = Array.isArray(salonsJoin) ? salonsJoin[0]?.name : salonsJoin?.name;

    bookings.push({
      id,
      salon_id: String(row.salon_id || ""),
      salon_name: joinedName || salonMap.get(String(row.salon_id)) || "Referred Salon",
      booking_date: String(row.booking_date || ""),
      created_at: String(row.created_at || ""),
      status: String(row.status || "pending"),
      payment_status: String(row.payment_status || ""),
      reservation_fee_paid: Boolean(row.reservation_fee_paid),
      amount,
      customer_email: String(row.customer_email || "—"),
      agent_cut: agentCut,
      gross_agent_cut: grossAgentCut,
      agent_percent: agentPercent,
      platform_commission: platformCommission,
      field_agent_email: fieldEmail || null,
      split_percent: splitPercent > 0 ? splitPercent : undefined,
    });
  };

  for (const row of bookingsRes.data || []) {
    pushBooking(row as Record<string, unknown>);
  }

  bookings.sort(
    (a, b) => new Date(b.booking_date).getTime() - new Date(a.booking_date).getTime()
  );

  const subscriptions: AgentCommissionSubscription[] = (ledgerRes.data || [])
    .filter((row) => String(row.commission_category || "").toLowerCase() === "subscription")
    .map((row) => {
      const grossAmount = Number(row.amount) || 0;
      const fieldEmail = normalizeEmail(String(row.field_agent_email || ""));
      const splitPercent = isFieldAgent
        ? fieldAgentSplit
        : fieldEmail
          ? splitByFieldEmail.get(fieldEmail) ?? clampSplitPercent(undefined)
          : 0;
      const netAmount = isFieldAgent
        ? calculateSubAgentShare(grossAmount, splitPercent)
        : fieldEmail
          ? calculateRegionalHeadNet(grossAmount, splitPercent)
          : grossAmount;

      return {
        id: row.id,
        amount: netAmount,
        gross_amount: grossAmount,
        status: row.status || "PENDING",
        notes: row.notes,
        created_at: row.created_at,
        field_agent_email: fieldEmail || null,
        split_percent: splitPercent > 0 ? splitPercent : undefined,
      };
    });

  let allTimeBookingGross = 0;
  bookings.forEach((b) => {
    if (b.status === "completed" || b.status === "confirmed") {
      allTimeBookingGross += b.amount;
    }
  });

  return {
    success: true as const,
    agentEmail: email,
    agentTier: tier,
    isRegionalHead: !isFieldAgent,
    bookingAgentPct,
    subscriptionAgentPct,
    profileCommissionRate: Number(agentRow?.commission_rate) || bookingAgentPct,
    referredSalonCount: salonMap.size,
    bookings,
    subscriptions,
    allTimeBookingGross,
  };
}
