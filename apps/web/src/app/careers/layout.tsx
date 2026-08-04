import type { Metadata } from "next";
import { buildPublicPageMetadata } from "@/lib/public-page-metadata";

export const metadata: Metadata = buildPublicPageMetadata({
  title: "Careers",
  description:
    "Join the Trimma Agent program. Earn commission onboarding salons, use the Agent Cockpit, Territory Explorer, and Commission Ledger.",
  path: "/careers",
});

export default function CareersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
