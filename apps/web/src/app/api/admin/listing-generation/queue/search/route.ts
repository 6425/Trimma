import { NextResponse } from "next/server";
import { requirePlatformAdminFromCookies } from "@/lib/server-admin-auth";
import { loadListingGenerationQueuePage } from "@/lib/listing-generation-queue";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const adminAuth = await requirePlatformAdminFromCookies();
    if ("error" in adminAuth) {
      return NextResponse.json({ error: adminAuth.error }, { status: 401 });
    }

    const url = new URL(req.url);
    const tab = url.searchParams.get("tab") === "pending" ? "pending" : "listed";
    const result = await loadListingGenerationQueuePage({
      tab,
      page: Number(url.searchParams.get("page") || 1),
      q: url.searchParams.get("q") || "",
      district: url.searchParams.get("district") || "",
      category: url.searchParams.get("category") || "",
    });

    return NextResponse.json(
      result,
      {
        headers: {
          "Cache-Control": "private, no-store, max-age=0",
        },
      }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to search listing queue.";
    console.error("[admin/listing-generation/queue/search]", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
