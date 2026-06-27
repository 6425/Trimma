import type { Metadata } from "next";
import { buildPublicPageMetadata } from "@/lib/public-page-metadata";

export const metadata: Metadata = buildPublicPageMetadata({
  title: "Data Deletion Request",
  description:
    "Request deletion of your Trimma account and personal data. Learn how to submit a data deletion request under our privacy policy.",
  path: "/data-deletion",
});

export default function DataDeletionLayout({ children }: { children: React.ReactNode }) {
  return children;
}
