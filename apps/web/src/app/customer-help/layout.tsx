import type { Metadata } from "next";
import { buildPublicPageMetadata } from "@/lib/public-page-metadata";

export const metadata: Metadata = buildPublicPageMetadata({
  title: "Customer Help",
  description:
    "Customer help for finding salons, booking appointments, paying your deposit, and managing your Trimma account.",
  path: "/customer-help",
});

export default function CustomerHelpLayout({ children }: { children: React.ReactNode }) {
  return children;
}
