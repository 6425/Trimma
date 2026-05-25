import { redirect } from "next/navigation";
import { findDistrictForCity } from "@/lib/sri-lanka-locations";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function CityDetailRedirectPage({ params }: Props) {
  const resolvedParams = await params;
  const slug = resolvedParams?.slug || "colombo";
  const match = findDistrictForCity(slug);

  if (match) {
    redirect(`/locations/${match.provinceSlug}/${match.districtSlug}/${slug}`);
  }

  redirect(`/locations/western/colombo/${slug}`);
}
