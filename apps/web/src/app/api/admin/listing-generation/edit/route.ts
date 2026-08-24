import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { revalidateMarketplaceListingPages } from "@/lib/listing-marketplace-revalidate";
import { updateListingSalonRecord } from "@/lib/listing-generation-mutations";
import { requirePlatformAdminFromCookies } from "@/lib/server-admin-auth";

export const dynamic = "force-dynamic";

function routeError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return "Failed to update the business listing.";
}

export async function POST(req: Request) {
  try {
    const adminAuth = await requirePlatformAdminFromCookies();
    if ("error" in adminAuth) {
      return NextResponse.json({ error: adminAuth.error }, { status: 401 });
    }

    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const salonId = String(body.salonId || "").trim();
    if (!salonId) {
      return NextResponse.json({ error: "salonId is required." }, { status: 400 });
    }

    const latitude = body.latitude === "" || body.latitude == null ? null : Number(body.latitude);
    const longitude = body.longitude === "" || body.longitude == null ? null : Number(body.longitude);
    const supabase = createSupabaseAdminClient();
    const result = await updateListingSalonRecord(supabase, salonId, {
      name: String(body.name || ""),
      category: String(body.category || ""),
      province: String(body.province || ""),
      district: String(body.district || ""),
      city: String(body.city || ""),
      address: String(body.address || ""),
      phone: String(body.phone || ""),
      rating: body.rating === "" || body.rating == null ? null : Number(body.rating),
      reviewCount: body.reviewCount === "" || body.reviewCount == null ? null : Number(body.reviewCount),
      website: String(body.website || ""),
      mapUrl: String(body.mapUrl || ""),
      placeId: String(body.placeId || ""),
      latitude,
      longitude,
      description: String(body.description || ""),
      logoUrl: String(body.logoUrl || ""),
      heroUrl: String(body.heroUrl || ""),
    });

    revalidateMarketplaceListingPages();

    return NextResponse.json({
      success: true,
      salonId: result.salonId,
      name: result.name,
    });
  } catch (error: unknown) {
    console.error("[admin/listing-generation/edit]", error);
    return NextResponse.json({ error: routeError(error) }, { status: 500 });
  }
}
