import type { Metadata } from "next";
import { buildPublicPageMetadata } from "@/lib/public-page-metadata";

export const metadata: Metadata = buildPublicPageMetadata({
  title: "Salon Locations in Sri Lanka",
  description:
    "Browse salons by province, district, and city across Sri Lanka. Find barbers, spas, beauty parlours, and wellness centres near you on Trimma.",
  path: "/locations",
});

export default function LocationsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
