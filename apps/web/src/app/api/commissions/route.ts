import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { canSessionAccessBookingCommissions } from "@/lib/api-booking-access";
import type { CommissionRow } from "@/lib/types/commission";
import {
  isRequestAuthError,
  requireStaffFromRequest,
} from "@/lib/server-request-auth";

export async function GET(request: NextRequest) {
  const auth = await requireStaffFromRequest(request);
  if (isRequestAuthError(auth)) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const bookingId = searchParams.get("bookingId");
  if (!bookingId) {
    return NextResponse.json({ error: "bookingId required" }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const allowed = await canSessionAccessBookingCommissions(supabase, auth, bookingId);
  if (!allowed) {
    return NextResponse.json({ error: "You do not have access to this booking." }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("commission_ledger")
    .select("entity_type, amount, description")
    .eq("booking_id", bookingId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows: CommissionRow[] = (data || []) as CommissionRow[];
  return NextResponse.json({ bookingId, rows });
}
