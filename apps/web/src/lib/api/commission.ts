// apps/web/src/lib/api/commission.ts
import { supabase } from "@/config/supabase";
import type { CommissionResponse } from "@/lib/types/commission";

export async function fetchCommission(bookingId: string): Promise<CommissionResponse | { error: string }> {
  const { data, error } = await supabase
    .from("commission_ledger")
    .select("entity_type, amount, description")
    .eq("booking_id", bookingId);
  if (error) {
    return { error: error.message };
  }
  return { bookingId, rows: data as any };
}
