// apps/web/src/app/api/commissions/route.ts
import { supabase } from "@/config/supabase";
import type { NextRequest } from "next/server";
import type { CommissionRow } from "@/lib/types/commission";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const bookingId = searchParams.get("bookingId");
  if (!bookingId) {
    return new Response(JSON.stringify({ error: "bookingId required" }), { status: 400 });
  }
  const { data, error } = await supabase
    .from("commission_ledger")
    .select("entity_type, amount, description")
    .eq("booking_id", bookingId);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
  const rows: CommissionRow[] = data as any;
  const response = { bookingId, rows };
  return new Response(JSON.stringify(response), { status: 200, headers: { "Content-Type": "application/json" } });
}
