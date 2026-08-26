import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { loadGeographyCatalog } from "@/lib/geography-catalog-server";
import { SRI_LANKA_PROVINCES } from "@/lib/sri-lanka-locations";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const provinces = await loadGeographyCatalog(createSupabaseAdminClient());
    return NextResponse.json(
      { provinces },
      { headers: { "Cache-Control": "public, no-store, max-age=0" } }
    );
  } catch (error) {
    console.error("[geography] Falling back to the built-in catalog:", error);
    return NextResponse.json(
      { provinces: SRI_LANKA_PROVINCES, fallback: true },
      { headers: { "Cache-Control": "public, no-store, max-age=0" } }
    );
  }
}
