export const AGENT_SALON_STATUS_LABELS: Record<string, string> = {
  ASSIGNED_TO_AGENT: "Assigned",
  AGENT_VERIFIED: "Field verified",
  OWNER_INVITED: "Owner invited",
  OWNER_ACTIVATED: "Owner activated",
  PENDING_ADMIN_VERIFICATION: "Pending admin review",
  AGENT_APPROVED: "Live (legacy)",
  VERIFIED: "Verified",
  REJECTED: "Rejected",
  DISCOVERED: "Discovered",
};

export function getAgentSalonStatusLabel(status: string | null | undefined): string {
  const key = status || "ASSIGNED_TO_AGENT";
  return AGENT_SALON_STATUS_LABELS[key] || key.replace(/_/g, " ");
}

export function getAgentSalonStatusClass(status: string | null | undefined): string {
  const key = status || "ASSIGNED_TO_AGENT";
  const map: Record<string, string> = {
    ASSIGNED_TO_AGENT: "bg-blue-100 text-blue-700",
    AGENT_VERIFIED: "bg-indigo-100 text-indigo-700",
    OWNER_INVITED: "bg-emerald-100 text-emerald-700",
    OWNER_ACTIVATED: "bg-amber-100 text-amber-700",
    PENDING_ADMIN_VERIFICATION: "bg-indigo-100 text-indigo-700",
    AGENT_APPROVED: "bg-violet-100 text-violet-700",
    VERIFIED: "bg-green-100 text-green-700",
    REJECTED: "bg-rose-100 text-rose-700",
    DISCOVERED: "bg-zinc-100 text-zinc-600",
  };
  return map[key] || "bg-zinc-100 text-zinc-600";
}

export function isAgentSalonActive(status: string | null | undefined): boolean {
  return !["VERIFIED", "REJECTED"].includes(status || "");
}

export function isAgentSalonLive(status: string | null | undefined): boolean {
  return ["PENDING_ADMIN_VERIFICATION", "AGENT_APPROVED", "VERIFIED"].includes(status || "");
}
