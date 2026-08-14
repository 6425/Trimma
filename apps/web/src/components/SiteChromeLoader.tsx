import { fetchPublicCategories } from "@/lib/public-categories";
import SiteChrome from "./SiteChrome";

export default async function SiteChromeLoader({
  children,
}: {
  children: React.ReactNode;
}) {
  let navCategories: Awaited<ReturnType<typeof fetchPublicCategories>> = [];
  try {
    navCategories = await fetchPublicCategories();
  } catch (error) {
    console.error("SiteChromeLoader categories:", error);
  }

  return <SiteChrome navCategories={navCategories}>{children}</SiteChrome>;
}
