"use client";

import { createContext, useContext, useMemo } from "react";
import { usePathname } from "next/navigation";
import {
  agentPortalPath,
  remapAgentPortalPath,
  resolveAgentPortalBase,
  type AgentPortalBase,
} from "@/lib/agent-portal-paths";

type AgentPortalContextValue = {
  base: AgentPortalBase;
  path: (segment?: string) => string;
  remap: (agentPath: string) => string;
};

const AgentPortalContext = createContext<AgentPortalContextValue>({
  base: "/agent",
  path: (segment = "") => agentPortalPath("/agent", segment),
  remap: (agentPath) => agentPath,
});

export function AgentPortalProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const base = resolveAgentPortalBase(pathname);

  const value = useMemo<AgentPortalContextValue>(
    () => ({
      base,
      path: (segment = "") => agentPortalPath(base, segment),
      remap: (agentPath: string) => remapAgentPortalPath(agentPath, base),
    }),
    [base]
  );

  return <AgentPortalContext.Provider value={value}>{children}</AgentPortalContext.Provider>;
}

export function useAgentPortal() {
  return useContext(AgentPortalContext);
}
