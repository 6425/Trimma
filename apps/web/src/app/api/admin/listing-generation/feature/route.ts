import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { revalidateMarketplaceListingPages } from "@/lib/listing-marketplace-revalidate";
import { requirePlatformAdminFromCookies } from "@/lib/server-admin-auth";
import { setListingFeaturedRecord } from "@/lib/listing-generation-mutations";

export const dynamic = "force-dynamic";

function routeError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return "Failed to update featured listing.";
}

export async function POST(req: Request) {
  try {
    const adminAuth = await requirePlatformAdminFromCookies();
    if ("error" in adminAuth) {
      return NextResponse.json({ error: adminAuth.error }, { status: 401 });
    }

    const body = (await req.json().catch(() => ({}))) as { salonId?: string; featured?: boolean };
    const salonId = String(body.salonId || "").trim();
    if (!salonId) {
      return NextResponse.json({ error: "salonId is required." }, { status: 400 });
    }
    if (typeof body.featured !== "boolean") {
      return NextResponse.json({ error: "featured must be true or false." }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();
    await setListingFeaturedRecord(supabase, salonId, body.featured);
    revalidateMarketplaceListingPages();

    return NextResponse.json({ success: true, featured: body.featured });
  } catch (error: unknown) {
    console.error("[admin/listing-generation/feature]", error);
    return NextResponse.json({ error: routeError(error) }, { status: 500 });
  }
}
