import { redirect } from "next/navigation";
import { findProvinceSlugForDistrict } from "@/lib/sri-lanka-locations";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function DistrictDetailRedirectPage({ params }: Props) {
  const resolvedParams = await params;
  const slug = resolvedParams?.slug || "colombo";
  const provinceSlug = findProvinceSlugForDistrict(slug) || "western";
  redirect(`/locations/${provinceSlug}/${slug}`);
}
