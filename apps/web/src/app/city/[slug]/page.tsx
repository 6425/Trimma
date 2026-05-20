import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function CityDetailRedirectPage({ params }: Props) {
  const resolvedParams = await params;
  const slug = resolvedParams?.slug || "colombo-07";
  // Cities mapped belong to Colombo District, Western Province
  redirect(`/locations/western/colombo/${slug}`);
}
