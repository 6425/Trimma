import type { Metadata } from "next";
import { CareersContent } from "./CareersContent";

export const metadata: Metadata = {
  title: "Careers | Trimma OS - Agent Program",
  description:
    "Join the Trimma Agent program. Earn commission onboarding salons, use the Agent Cockpit, Territory Explorer, and Commission Ledger.",
};

export default function CareersPage() {
  return <CareersContent />;
}
