import type { Metadata } from "next";
import { buildPublicPageMetadata } from "@/lib/public-page-metadata";

export const metadata: Metadata = buildPublicPageMetadata({
  title: "Salon Deals & Offers",
  description:
    "Discover the latest salon deals and promotional packages across Sri Lanka. Save on haircuts, spa treatments, and beauty services.",
  path: "/deals",
});

export default function DealsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
