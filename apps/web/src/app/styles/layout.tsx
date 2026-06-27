import type { Metadata } from "next";
import { buildPublicPageMetadata } from "@/lib/public-page-metadata";

export const metadata: Metadata = buildPublicPageMetadata({
  title: "Salon Styles & Inspiration",
  description:
    "Explore trending salon styles and looks across Sri Lanka. Find inspiration for your next haircut, colour, or beauty treatment.",
  path: "/styles",
});

export default function StylesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
