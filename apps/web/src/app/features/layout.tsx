import type { Metadata } from "next";
import { buildPublicPageMetadata } from "@/lib/public-page-metadata";

export const metadata: Metadata = buildPublicPageMetadata({
  title: "Features",
  description:
    "Explore Trimma features — instant salon booking, salon dashboard, staff scheduling, deals, analytics, and more for salons in Sri Lanka.",
  path: "/features",
});

export default function FeaturesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
