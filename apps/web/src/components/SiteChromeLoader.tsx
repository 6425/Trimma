import SiteChrome from "./SiteChrome";

export default function SiteChromeLoader({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SiteChrome>{children}</SiteChrome>;
}
