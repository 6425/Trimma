import type { Metadata } from "next";
import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { buildPublicPageMetadata } from "@/lib/public-page-metadata";
import { slugToLabel } from "@/lib/site-seo";

type Props = {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Pick<Props, "params">): Promise<Metadata> {
  const { slug } = await params;
  let name = slugToLabel(slug);

  try {
    const supabase = createSupabaseAdminClient();
    const { data } = await supabase
      .from("categories")
      .select("name")
      .eq("slug", slug)
      .maybeSingle();

    if (data?.name) name = data.name;
  } catch {
    // Fall back to slug-derived label.
  }

  return buildPublicPageMetadata({
    title: `${name} Salons in Sri Lanka`,
    description: `Browse and book top-rated ${name.toLowerCase()} salons across Sri Lanka. Compare services, read reviews, and book online with Trimma.`,
    path: `/category/${slug}`,
  });
}

export default function CategorySlugLayout({ children }: Pick<Props, "children">) {
  return children;
}
