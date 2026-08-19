import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { revalidateMarketplaceListingPages } from "@/lib/listing-marketplace-revalidate";
import { requirePlatformAdminFromCookies } from "@/lib/server-admin-auth";
import { applyFeaturedBatchPeriod } from "@/lib/listing-generation-mutations";

export const dynamic = "force-dynamic";

function routeError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return "Failed to update the featured batch.";
}

export async function POST(req: Request) {
  try {
    const adminAuth = await requirePlatformAdminFromCookies();
    if ("error" in adminAuth) {
      return NextResponse.json({ error: adminAuth.error }, { status: 401 });
    }

    const body = (await req.json().catch(() => ({}))) as {
      featuredStartsAt?: string;
      featuredEndsAt?: string;
    };

    const supabase = createSupabaseAdminClient();
    const result = await applyFeaturedBatchPeriod(supabase, {
      startsAt: body.featuredStartsAt,
      endsAt: body.featuredEndsAt,
    });
    revalidateMarketplaceListingPages();

    return NextResponse.json({
      success: true,
      updatedCount: result.updatedCount,
      featuredStartsAt: body.featuredStartsAt,
      featuredEndsAt: body.featuredEndsAt,
    });
  } catch (error: unknown) {
    console.error("[admin/listing-generation/feature-batch]", error);
    return NextResponse.json({ error: routeError(error) }, { status: 500 });
  }
}
