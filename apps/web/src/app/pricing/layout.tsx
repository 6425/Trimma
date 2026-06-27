import type { Metadata } from "next";
import { buildPublicPageMetadata } from "@/lib/public-page-metadata";

export const metadata: Metadata = buildPublicPageMetadata({
  title: "Pricing Plans for Salons",
  description:
    "View Trimma subscription plans for salon owners. List your salon, accept online bookings, and grow your business across Sri Lanka.",
  path: "/pricing",
});

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
