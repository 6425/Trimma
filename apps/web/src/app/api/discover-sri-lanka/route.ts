import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { requirePlatformAdminFromCookies } from "@/lib/server-admin-auth";
import {
  BEAUTY_DISCOVERY_CATEGORIES,
  discoverGooglePlacesInContext,
  sleep,
} from "@/lib/google-places-discovery";
import { SRI_LANKA_PROVINCES } from "@/lib/sri-lanka-locations";

function getRouteErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Failed to run Sri Lanka discovery";
}

type SriLankaDiscoveryJob = {
  province: string;
  district: string;
  city: string;
  category: string;
  count: number;
  message: string;
  warning?: string;
};

export async function POST(req: Request) {
  try {
    const adminAuth = await requirePlatformAdminFromCookies();
    if ("error" in adminAuth) {
      return NextResponse.json({ error: adminAuth.error }, { status: 401 });
    }

    const apiKey = process.env.GOOGLE_API;
    if (!apiKey) {
      return NextResponse.json({ error: "Google API key is not configured" }, { status: 500 });
    }

    const body = await req.json().catch(() => ({}));
    const perCityLimit = Math.min(Math.max(Number(body.limitPerCity) || 12, 1), 20);
    const categoryFilter =
      typeof body.category === "string" && body.category.trim()
        ? [body.category.trim()]
        : [...BEAUTY_DISCOVERY_CATEGORIES];
    const dryRun = Boolean(body.dryRun);

    const supabase = createSupabaseAdminClient();
    const jobs: SriLankaDiscoveryJob[] = [];
    let totalCount = 0;

    for (const province of SRI_LANKA_PROVINCES) {
      for (const district of province.districts) {
        for (const city of district.cities) {
          for (const category of categoryFilter) {
            if (dryRun) {
              jobs.push({
                province: province.name,
                district: district.name,
                city,
                category,
                count: 0,
                message: "Dry run — skipped API call",
              });
              continue;
            }

            try {
              const result = await discoverGooglePlacesInContext(
                supabase,
                apiKey,
                {
                  province: province.name,
                  district: district.name,
                  city,
                  category,
                },
                {
                  limit: perCityLimit,
                  assignTerritoryAgent: true,
                  enrichProfiles: true,
                  syncImages: Boolean(body.syncImages),
                }
              );

              totalCount += result.count;
              jobs.push({
                province: province.name,
                district: district.name,
                city,
                category,
                count: result.count,
                message: result.message,
                warning: result.warning,
              });
            } catch (jobError) {
              jobs.push({
                province: province.name,
                district: district.name,
                city,
                category,
                count: 0,
                message: getRouteErrorMessage(jobError),
              });
            }

            await sleep(350);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      totalCount,
      jobsRun: jobs.length,
      jobs,
      message: dryRun
        ? `Dry run complete — ${jobs.length} discovery queries planned across Sri Lanka.`
        : `Sri Lanka discovery complete — published ${totalCount} listing update(s) across ${jobs.length} city/category queries.`,
    });
  } catch (error: unknown) {
    console.error("[discover-sri-lanka] failure:", error);
    return NextResponse.json({ error: getRouteErrorMessage(error) }, { status: 500 });
  }
}
