import type { Metadata } from "next";
import { buildPublicPageMetadata } from "@/lib/public-page-metadata";

export const metadata: Metadata = buildPublicPageMetadata({
  title: "List Your Salon",
  description:
    "Join Sri Lanka's next-generation salon discovery and booking platform. List your salon on Trimma and accept online bookings.",
  path: "/onboarding",
});

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
