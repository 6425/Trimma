import { redirect } from "next/navigation";

/** Salon approval is handled in the Field Editor (/agent/leads). */
export default function AgentSalonApprovalDetailRedirect() {
  redirect("/agent/leads");
}
