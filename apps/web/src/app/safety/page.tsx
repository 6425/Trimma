import type { Metadata } from "next";
import { SafetyContent } from "./SafetyContent";

export const metadata: Metadata = {
  title: "Safety & Trust Center | Trimma",
  description:
    "Learn how Trimma protects customers and salon partners with secure reservations, verified listings, safe payments, and fair dispute resolution.",
};

export default function SafetyPage() {
  return <SafetyContent />;
}
