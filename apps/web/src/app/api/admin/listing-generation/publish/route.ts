import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { requirePlatformAdminFromCookies } from "@/lib/server-admin-auth";
import {
  publishAllPendingListingSalonRecords,
  publishListingSalonRecord,
} from "@/lib/listing-generation-mutations";

export const dynamic = "force-dynamic";

function routeError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return "Failed to publish listing.";
}

export async function POST(req: Request) {
  try {
    const adminAuth = await requirePlatformAdminFromCookies();
    if ("error" in adminAuth) {
      return NextResponse.json({ error: adminAuth.error }, { status: 401 });
    }

    const body = (await req.json().catch(() => ({}))) as { salonId?: string; allPending?: boolean };
    const supabase = createSupabaseAdminClient();

    if (body.allPending) {
      const result = await publishAllPendingListingSalonRecords(supabase);
      revalidatePath("/admin/listing-generation/queue");
      revalidatePath("/");
      return NextResponse.json({ success: true, publishedCount: result.publishedCount });
    }

    const salonId = String(body.salonId || "").trim();
    if (!salonId) {
      return NextResponse.json({ error: "salonId is required." }, { status: 400 });
    }

    await publishListingSalonRecord(supabase, salonId);

    revalidatePath("/admin/listing-generation/queue");
    revalidatePath("/");

    return NextResponse.json({ success: true, publishedCount: 1 });
  } catch (error: unknown) {
    console.error("[admin/listing-generation/publish]", error);
    return NextResponse.json({ error: routeError(error) }, { status: 500 });
  }
}
