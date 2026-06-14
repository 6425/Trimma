import type { Metadata } from "next";
import { CancellationContent } from "./CancellationContent";

export const metadata: Metadata = {
  title: "Cancellation & Reservation Policy | Trimma",
  description:
    "Transparent cancellation and reservation policies designed to protect customers, salon owners, and appointment availability on Trimma.",
};

export default function CancellationPolicyPage() {
  return <CancellationContent />;
}
