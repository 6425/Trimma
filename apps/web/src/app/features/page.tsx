import type { Metadata } from "next";
import { FeaturesContent } from "./FeaturesContent";

export const metadata: Metadata = {
  title: "Features | Trimma OS - Find. Book. Glow.",
  description:
    "Explore Trimma features — instant salon booking, salon dashboard, staff scheduling, deals, analytics, and more.",
};

export default function FeaturesPage() {
  return <FeaturesContent />;
}
