import type { SupabaseClient } from "@supabase/supabase-js";
import { canAgentAccessSalonAssignee } from "@/lib/agent-hierarchy";
import { normalizeEmail } from "@/lib/normalize-email";
import { findOwnerSalon } from "@/lib/server-salon-auth";
import type { RequestSession } from "@/lib/server-request-auth";

type BookingAccessRow = {
  id: string;
  salon_id: string;
  agent_email: string | null;
  field_agent_email: string | null;
};

export async function canSessionAccessBookingCommissions(
  supabase: SupabaseClient,
  session: RequestSession,
  bookingId: string
): Promise<boolean> {
  const { data: booking, error } = await supabase
    .from("bookings")
    .select("id, salon_id, agent_email, field_agent_email")
    .eq("id", bookingId)
    .maybeSingle();

  if (error || !booking) return false;

  const row = booking as BookingAccessRow;

  if (session.role === "admin") return true;

  const sessionEmail = normalizeEmail(session.email || "");
  if (!sessionEmail) return false;

  if (session.role === "salon_owner") {
    const salon = await findOwnerSalon(supabase, sessionEmail);
    return String(salon?.id || "") === String(row.salon_id);
  }

  if (session.role === "agent" || session.role === "regional_head") {
    if (normalizeEmail(row.agent_email || "") === sessionEmail) return true;
    if (normalizeEmail(row.field_agent_email || "") === sessionEmail) return true;

    const { data: salon } = await supabase
      .from("salons")
      .select("assign_to")
      .eq("id", row.salon_id)
      .maybeSingle();

    if (salon?.assign_to) {
      return canAgentAccessSalonAssignee(
        supabase,
        sessionEmail,
        session.userId,
        salon.assign_to
      );
    }
  }

  return false;
}
