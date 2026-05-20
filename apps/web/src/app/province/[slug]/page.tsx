import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function ProvinceDetailRedirectPage({ params }: Props) {
  const resolvedParams = await params;
  const slug = resolvedParams?.slug || "western";
  redirect(`/locations/${slug}`);
}
