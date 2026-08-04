import type { Metadata } from "next";
import { buildPublicPageMetadata } from "@/lib/public-page-metadata";

export const metadata: Metadata = buildPublicPageMetadata({
  title: "About Trimma",
  description:
    "Learn about Trimma — the beauty and wellness appointment booking and business management platform built for salons across Sri Lanka and beyond.",
  path: "/about",
});

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
