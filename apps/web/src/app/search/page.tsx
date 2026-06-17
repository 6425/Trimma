import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type SearchPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function readParam(
  searchParams: Record<string, string | string[] | undefined>,
  ...keys: string[]
): string {
  for (const key of keys) {
    const value = searchParams[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return "";
}

/** Legacy /search route — forwards to the main salon directory on `/`. */
export default async function SearchRedirectPage({ searchParams }: SearchPageProps) {
  const sp = await searchParams;
  const params = new URLSearchParams();

  const q = readParam(sp, "q", "query", "search");
  const l = readParam(sp, "l", "location", "loc");
  const category = readParam(sp, "category", "cat");

  if (q) params.set("q", q);
  if (l) params.set("l", l);
  if (category) params.set("category", category);

  const query = params.toString();
  redirect(query ? `/?${query}` : "/");
}
