import type { Metadata } from "next";
import { buildPublicPageMetadata } from "@/lib/public-page-metadata";

export const metadata: Metadata = buildPublicPageMetadata({
  title: "Partner Portal Login",
  description:
    "Sign in to the Trimma partner portal for sales agents and regional heads. Manage leads, onboard salons, and track commissions.",
  path: "/agent/login",
});

export default function AgentLoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
