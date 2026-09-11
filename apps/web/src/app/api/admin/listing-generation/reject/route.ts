import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { revalidateMarketplaceListingPages } from "@/lib/listing-marketplace-revalidate";
import { requirePlatformAdminFromCookies } from "@/lib/server-admin-auth";
import { rejectListingSalonRecord } from "@/lib/listing-generation-mutations";

export const dynamic = "force-dynamic";

function routeError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return "Failed to reject listing.";
}

export async function POST(req: Request) {
  try {
    const adminAuth = await requirePlatformAdminFromCookies();
    if ("error" in adminAuth) {
      return NextResponse.json({ error: adminAuth.error }, { status: 401 });
    }

    const body = (await req.json().catch(() => ({}))) as {
      salonId?: string;
      reason?: string;
    };
    const salonId = String(body.salonId || "").trim();
    const reason = String(body.reason || "").trim();
    if (!salonId) {
      return NextResponse.json({ error: "salonId is required." }, { status: 400 });
    }
    if (!reason) {
      return NextResponse.json({ error: "A rejection reason is required." }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();
    await rejectListingSalonRecord(supabase, salonId, reason);
    revalidateMarketplaceListingPages();

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("[admin/listing-generation/reject]", error);
    return NextResponse.json({ error: routeError(error) }, { status: 500 });
  }
}
