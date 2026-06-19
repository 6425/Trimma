import type { Metadata } from "next";
import { CustomerHelpContent } from "@/components/help/CustomerHelpContent";

export const metadata: Metadata = {
  title: "Customer Help | Trimma",
  description:
    "Customer help for finding salons, booking appointments, paying your deposit, and managing your Trimma account.",
};

export default function CustomerHelpPage() {
  return <CustomerHelpContent />;
}
