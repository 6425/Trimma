import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { requireCustomerFromCookies } from "@/lib/server-customer-auth";
import {
  loadCustomerProfile,
  saveCustomerProfileRecord,
} from "@/lib/customer-profile-save";

export async function GET() {
  try {
    const auth = await requireCustomerFromCookies();
    if ("error" in auth) {
      return NextResponse.json({ success: false, error: auth.error }, { status: 401 });
    }

    const supabase = createSupabaseAdminClient();
    const profile = await loadCustomerProfile(supabase, auth);
    return NextResponse.json({ success: true, ...profile });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not load profile.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await requireCustomerFromCookies();
    if ("error" in auth) {
      return NextResponse.json({ success: false, error: auth.error }, { status: 401 });
    }

    let body: { firstName?: string; lastName?: string; phone?: string };
    try {
      body = (await request.json()) as { firstName?: string; lastName?: string; phone?: string };
    } catch {
      return NextResponse.json({ success: false, error: "Invalid JSON body." }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();
    const result = await saveCustomerProfileRecord(supabase, auth, {
      firstName: String(body.firstName || ""),
      lastName: String(body.lastName || ""),
      phone: String(body.phone || ""),
    });

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update profile.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
