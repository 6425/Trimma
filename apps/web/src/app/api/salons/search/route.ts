import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/config/supabase-server";
import { fetchPublicSalons } from "@/lib/public-salon-search";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";
    const location = searchParams.get("location") || "";
    const category = searchParams.get("category") || "";
    const sort = searchParams.get("sort") || "recommended";
    const minRating = parseFloat(searchParams.get("minRating") || "0");
    const verifiedOnly = searchParams.get("verified") === "true";
    const limit = parseInt(searchParams.get("limit") || "12", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const supabase = createServerSupabaseClient();
    const { salons, hasMore } = await fetchPublicSalons(supabase, {
      q,
      location,
      category,
      sort,
      minRating,
      verifiedOnly,
      limit,
      offset,
    });

    return NextResponse.json(
      { salons, hasMore },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Search failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
