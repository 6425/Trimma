import type { Metadata } from "next";
import { buildPublicPageMetadata } from "@/lib/public-page-metadata";

export const metadata: Metadata = buildPublicPageMetadata({
  title: "Privacy Policy",
  description:
    "Learn how Trimma collects, uses, and protects your personal data. Our privacy policy for customers and salon partners.",
  path: "/privacy-policy",
});

export default function PrivacyPolicyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
