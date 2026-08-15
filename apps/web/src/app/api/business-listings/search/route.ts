import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/config/supabase-server";
import { fetchBusinessListingCards } from "@/lib/public-salon-search";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";
    const location = searchParams.get("location") || "";
    const category = searchParams.get("category") || "";
    const categoryName = searchParams.get("categoryName") || "";
    const sort = searchParams.get("sort") || "recommended";
    const minRating = parseFloat(searchParams.get("minRating") || "0");
    const publishedOnly = searchParams.get("publishedOnly") === "true";
    const limitParam = searchParams.get("limit");
    const limit = limitParam === "all" || limitParam === "0" ? 0 : parseInt(limitParam || "24", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const supabase = createServerSupabaseClient();
    const { listings, hasMore, totalCount } = await fetchBusinessListingCards(supabase, {
      q,
      location,
      category,
      categoryName,
      sort,
      minRating,
      publishedOnly,
      limit,
      offset,
    });

    return NextResponse.json(
      { listings, hasMore, totalCount },
      {
        headers: {
          "Cache-Control": "private, no-store, max-age=0",
        },
      }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Listing search failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
