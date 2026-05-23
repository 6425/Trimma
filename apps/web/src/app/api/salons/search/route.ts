import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from "@/config/supabase-server";
import { mapSalonRowToUI } from "@/lib/salons-mapper";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    const location = searchParams.get('location') || '';
    const category = searchParams.get('category') || '';
    const limit = parseInt(searchParams.get('limit') || '8', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const supabase = createServerSupabaseClient();
    
    let query = supabase
      .from("salons")
      .select(`
        id, name, slug, rating,
        city, district, category, logo_url, cover_url,
        is_featured, is_verified,
        services ( id, name, price, category )
      `);

    if (q) {
      // Basic text search on name, category, city, or district (case-insensitive)
      query = query.or(`name.ilike.%${q}%,category.ilike.%${q}%,city.ilike.%${q}%,district.ilike.%${q}%`);
    }
    if (location) {
      query = query.ilike('city', `%${location}%`);
    }
    if (category) {
      query = query.ilike('category', `%${category}%`);
    }

    query = query.range(offset, offset + limit - 1).order('rating', { ascending: false });

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const salons = (data || []).map((s: any, idx: number) => mapSalonRowToUI(s, idx));

    return NextResponse.json({ salons, hasMore: salons.length === limit });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
