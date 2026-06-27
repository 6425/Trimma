import type { Metadata } from "next";
import { buildPublicPageMetadata } from "@/lib/public-page-metadata";

export const metadata: Metadata = buildPublicPageMetadata({
  title: "Salon Categories",
  description:
    "Browse salon categories across Sri Lanka — barbers, beauty parlours, spas, nail studios, and more. Book your next appointment on Trimma.",
  path: "/categories",
});

export default function CategoriesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
