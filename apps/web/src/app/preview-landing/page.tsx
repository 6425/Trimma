import type { Metadata } from "next";
import { PreviewLandingContent } from "./PreviewLandingContent";

export const metadata: Metadata = {
  title: "Grow Your Salon, Not Your Stress | Trimma",
  description:
    "Trimma is the all-in-one salon platform for Sri Lanka — online booking, staff management, customer CRM, promotions, and revenue analytics in one place.",
  robots: { index: false, follow: false },
};

export default function PreviewLandingPage() {
  return <PreviewLandingContent />;
}
