import { redirect } from "next/navigation";
import {
  buildLocationSearchHref,
  getProvinceByRouteSlug,
  normalizeProvinceSlug,
} from "@/lib/sri-lanka-locations";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function ProvinceDetailRedirectPage({ params }: Props) {
  const resolvedParams = await params;
  const slug = normalizeProvinceSlug(resolvedParams?.slug || "western");
  const meta = getProvinceByRouteSlug(slug);
  redirect(buildLocationSearchHref(meta?.name || "Western Province"));
}
