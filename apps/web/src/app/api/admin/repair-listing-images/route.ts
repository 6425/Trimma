import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { requirePlatformAdminFromCookies } from "@/lib/server-admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

type RepairCandidate = {
  id: string;
};

/**
 * Restores the existing Trimma Storage copy for each listing. This never
 * contacts Google, downloads a replacement, or chooses an image from another
 * business: a file is used only when it already exists under that salon's ID.
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
    .select("id")
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
      const { data: files, error: listError } = await supabase.storage
        .from("salon-images")
        .list(salon.id, {
          limit: 100,
          sortBy: { column: "created_at", order: "desc" },
        });
      if (listError) throw listError;

      const imageFile = (files || [])
        .filter((file) => /\.(?:avif|gif|jpe?g|png|webp)$/i.test(file.name))
        .sort((a, b) => {
          const aHero = /^hero[_-]/i.test(a.name) ? 0 : 1;
          const bHero = /^hero[_-]/i.test(b.name) ? 0 : 1;
          return aHero - bHero;
        })[0];
      if (!imageFile) {
        stats.skipped += 1;
        continue;
      }

      const { data: publicUrl } = supabase.storage
        .from("salon-images")
        .getPublicUrl(`${salon.id}/${imageFile.name}`);
      const { error: updateError } = await supabase
        .from("salons")
        .update({
          hero_url: publicUrl.publicUrl,
          cover_url: publicUrl.publicUrl,
          hero_image: publicUrl.publicUrl,
        })
        .eq("id", salon.id);
      if (updateError) throw updateError;
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
