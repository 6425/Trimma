import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function DistrictDetailRedirectPage({ params }: Props) {
  const resolvedParams = await params;
  const slug = resolvedParams?.slug || "colombo";
  // All active districts belong to Western Province in trimma core showcase
  redirect(`/locations/western/${slug}`);
}
