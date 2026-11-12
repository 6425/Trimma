import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { applySalonGoogleImageSync, syncSalonImagesFromGooglePlace } from "@/lib/google-place-images";
import { requirePlatformAdminFromCookies } from "@/lib/server-admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

type RepairCandidate = {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  district: string | null;
  place_id: string | null;
};

/**
 * Repairs a small, ordered batch of expired Google-hosted listing photos.
 * A single permanent copy is enough for a directory card, and avoids the
 * unnecessary cost of downloading a full gallery for every discovered salon.
 */
export async function POST(request: Request) {
  const auth = await requirePlatformAdminFromCookies();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const cursor = typeof body.cursor === "string" ? body.cursor : "";
  const limit = Math.min(Math.max(Number(body.limit) || 10, 1), 20);
  const supabase = createSupabaseAdminClient();

  let query = supabase
    .from("salons")
    .select("id, name, address, city, district, place_id")
    .or("onboarding_status.eq.LISTING_PUBLISHED,onboarding_status.eq.VERIFIED,is_verified.eq.true")
    .not("status", "in", "(rejected,inactive)")
    .or("hero_url.ilike.%googleusercontent.com%,cover_url.ilike.%googleusercontent.com%,hero_image.ilike.%googleusercontent.com%,logo_url.ilike.%googleusercontent.com%")
    .order("id", { ascending: true })
    .limit(limit);

  if (cursor) query = query.gt("id", cursor);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const salons = (data || []) as RepairCandidate[];
  const stats = { attempted: salons.length, repaired: 0, skipped: 0, failed: 0 };

  for (const salon of salons) {
    try {
      const images = await syncSalonImagesFromGooglePlace(supabase, salon, { maxPhotos: 1 });
      if (!images) {
        stats.skipped += 1;
        continue;
      }
      await applySalonGoogleImageSync(supabase, salon.id, images, salon.place_id);
      stats.repaired += 1;
    } catch {
      // Continue with the remaining businesses. A retry can pick this one up
      // after its Google Place data becomes available.
      stats.failed += 1;
    }
  }

  const nextCursor = salons.at(-1)?.id || null;
  return NextResponse.json({
    ...stats,
    nextCursor,
    complete: salons.length < limit,
  });
}
