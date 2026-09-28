import { NextResponse } from "next/server";
import { requirePlatformAdminFromCookies } from "@/lib/server-admin-auth";
import { loadAllPendingListingGenerationQueueRows } from "@/lib/listing-generation-queue";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const adminAuth = await requirePlatformAdminFromCookies();
    if ("error" in adminAuth) {
      return NextResponse.json({ error: adminAuth.error }, { status: 401 });
    }

    const rows = await loadAllPendingListingGenerationQueueRows();
    return NextResponse.json(
      { rows },
      { headers: { "Cache-Control": "private, no-store, max-age=0" } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to export pending listings.";
    console.error("[admin/listing-generation/queue/export]", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
