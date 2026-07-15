import type { Metadata } from "next";
import { buildPublicPageMetadata } from "@/lib/public-page-metadata";

export const metadata: Metadata = buildPublicPageMetadata({
  title: "Cancellation & Reservation Policy",
  description:
    "Transparent cancellation and reservation policies designed to protect customers, salon owners, and appointment availability on Trimma.",
  path: "/cancellation-help",
});

export default function CancellationHelpLayout({ children }: { children: React.ReactNode }) {
  return children;
}
