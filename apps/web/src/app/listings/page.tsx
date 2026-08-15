import { redirect } from "next/navigation";
import { canonicalizeCategorySlug } from "@/lib/public-categories";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] || "";
  return value || "";
}

/** Legacy alias — business listings live on the home page; category filters open category pages. */
export default async function ListingsAliasPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const category = firstParam(sp.category).trim();
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(sp)) {
    if (key === "category") continue;
    if (typeof value === "string") params.set(key, value);
    else if (Array.isArray(value)) value.forEach((entry) => params.append(key, entry));
  }
  const suffix = params.toString();
  if (category) {
    const slug = canonicalizeCategorySlug(category);
    redirect(suffix ? `/category/${slug}?${suffix}` : `/category/${slug}`);
  }
  redirect(suffix ? `/?${suffix}` : "/");
}
