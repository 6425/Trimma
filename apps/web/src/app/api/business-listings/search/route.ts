import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/config/supabase-server";
import { fetchBusinessListingCards } from "@/lib/public-salon-search";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";
    const location = searchParams.get("location") || "";
    const category = searchParams.get("category") || "";
    const sort = searchParams.get("sort") || "recommended";
    const minRating = parseFloat(searchParams.get("minRating") || "0");
    const limit = parseInt(searchParams.get("limit") || "24", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const supabase = createServerSupabaseClient();
    const { listings, hasMore } = await fetchBusinessListingCards(supabase, {
      q,
      location,
      category,
      sort,
      minRating,
      limit,
      offset,
    });

    return NextResponse.json(
      { listings, hasMore },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Listing search failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
