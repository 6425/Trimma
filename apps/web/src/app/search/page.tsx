import { redirect } from "next/navigation";

type SearchPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function buildDirectoryQuery(
  searchParams: Record<string, string | string[] | undefined>
): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === "string" && value.trim()) {
      params.set(key, value.trim());
    }
  }

  return params.toString();
}

/** Legacy /search route — forwards to the main salon directory on `/`. */
export default async function SearchRedirectPage({ searchParams }: SearchPageProps) {
  const sp = await searchParams;
  const query = buildDirectoryQuery(sp);
  redirect(query ? `/?${query}` : "/");
}
