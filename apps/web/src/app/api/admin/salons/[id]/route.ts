import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { saveAdminSalonRecord } from "@/lib/admin-salon-save-core";
import { requirePlatformAdminFromCookies } from "@/lib/server-admin-auth";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const auth = await requirePlatformAdminFromCookies();
    if ("error" in auth) {
      return NextResponse.json({ success: false, error: auth.error }, { status: 401 });
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ success: false, error: "Salon id is required." }, { status: 400 });
    }

    let payload: Record<string, unknown>;
    try {
      payload = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ success: false, error: "Invalid JSON body." }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();
    const result = await saveAdminSalonRecord(supabase, id, payload);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save salon.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
