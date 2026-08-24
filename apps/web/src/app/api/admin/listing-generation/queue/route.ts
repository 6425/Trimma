import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { requirePlatformAdminFromCookies } from "@/lib/server-admin-auth";
import { loadListingGenerationQueue } from "@/lib/listing-generation-queue";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const adminAuth = await requirePlatformAdminFromCookies();
    if ("error" in adminAuth) {
      return NextResponse.json({ error: adminAuth.error }, { status: 401 });
    }

    const supabase = createSupabaseAdminClient();
    const payload = await loadListingGenerationQueue(supabase);

    return NextResponse.json(
      {
        rows: payload.rows,
        featuredRows: payload.featuredRows,
        featuredCount: payload.featuredCount,
        pendingCount: payload.pendingCount,
        listedCount: payload.listedCount,
      },
      {
        headers: {
          "Cache-Control": "private, no-store, max-age=0",
        },
      }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load listing queue.";
    console.error("[admin/listing-generation/queue]", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
