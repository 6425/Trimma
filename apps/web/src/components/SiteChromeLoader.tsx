import { fetchPublicCategories } from "@/lib/public-categories";
import SiteChrome from "./SiteChrome";

export default async function SiteChromeLoader({
  children,
}: {
  children: React.ReactNode;
}) {
  const navCategories = await fetchPublicCategories();

  return <SiteChrome navCategories={navCategories}>{children}</SiteChrome>;
}
