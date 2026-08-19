import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { revalidateMarketplaceListingPages } from "@/lib/listing-marketplace-revalidate";
import { requirePlatformAdminFromCookies } from "@/lib/server-admin-auth";
import { setListingAboutRecord } from "@/lib/listing-generation-mutations";

export const dynamic = "force-dynamic";

function routeError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return "Failed to update the About section.";
}

export async function POST(req: Request) {
  try {
    const adminAuth = await requirePlatformAdminFromCookies();
    if ("error" in adminAuth) {
      return NextResponse.json({ error: adminAuth.error }, { status: 401 });
    }

    const body = (await req.json().catch(() => ({}))) as {
      salonId?: string;
      about?: string;
    };
    const salonId = String(body.salonId || "").trim();
    if (!salonId) {
      return NextResponse.json({ error: "salonId is required." }, { status: 400 });
    }
    if (typeof body.about !== "string") {
      return NextResponse.json({ error: "about must be a string." }, { status: 400 });
    }
    if (body.about.length > 4000) {
      return NextResponse.json({ error: "About text must be 4000 characters or less." }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();
    await setListingAboutRecord(supabase, salonId, body.about);
    revalidateMarketplaceListingPages();

    return NextResponse.json({
      success: true,
      about: body.about.trim() || null,
    });
  } catch (error: unknown) {
    console.error("[admin/listing-generation/about]", error);
    return NextResponse.json({ error: routeError(error) }, { status: 500 });
  }
}
