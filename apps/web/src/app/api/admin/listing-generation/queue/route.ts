import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { requirePlatformAdminFromCookies } from "@/lib/server-admin-auth";
import { loadListingGenerationQueueRows, countListingGenerationQueue } from "@/lib/listing-generation-queue";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const adminAuth = await requirePlatformAdminFromCookies();
    if ("error" in adminAuth) {
      return NextResponse.json({ error: adminAuth.error }, { status: 401 });
    }

    const supabase = createSupabaseAdminClient();
    const [rows, counts] = await Promise.all([
      loadListingGenerationQueueRows(supabase),
      countListingGenerationQueue(supabase),
    ]);

    return NextResponse.json(
      { rows, pendingCount: counts.pendingCount, listedCount: counts.listedCount },
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
