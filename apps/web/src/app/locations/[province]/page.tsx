import { redirect } from "next/navigation";
import {
  buildLocationSearchHref,
  getProvinceByRouteSlug,
  normalizeProvinceSlug,
} from "@/lib/sri-lanka-locations";

type ProvincePageProps = {
  params: Promise<{ province: string }>;
};

/**
 * Dedicated province pages previously crashed at runtime.
 * Match the district nav pattern: send users to the home search directory filtered by province.
 */
export default async function ProvinceDetailRedirectPage({ params }: ProvincePageProps) {
  const { province } = await params;
  const slug = normalizeProvinceSlug(province || "western");
  const meta = getProvinceByRouteSlug(slug);
  redirect(buildLocationSearchHref(meta?.name || province || "Western Province"));
}
