import type { Metadata } from "next";
import { buildPublicPageMetadata } from "@/lib/public-page-metadata";

export const metadata: Metadata = buildPublicPageMetadata({
  title: "Safety & Trust Center",
  description:
    "Learn how Trimma protects customers and salon partners with secure reservations, verified listings, safe payments, and fair dispute resolution.",
  path: "/safety",
});

export default function SafetyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
