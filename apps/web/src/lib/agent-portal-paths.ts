export const AGENT_PORTAL_BASE = "/agent";
export const REGIONAL_HEAD_PORTAL_BASE = "/regional-head";

export type AgentPortalBase =
  | typeof AGENT_PORTAL_BASE
  | typeof REGIONAL_HEAD_PORTAL_BASE;

export function resolveAgentPortalBase(pathname: string): AgentPortalBase {
  if (pathname.startsWith(REGIONAL_HEAD_PORTAL_BASE)) {
    return REGIONAL_HEAD_PORTAL_BASE;
  }
  return AGENT_PORTAL_BASE;
}

/** Build a portal path under the current base (`/agent` or `/regional-head`). */
export function agentPortalPath(base: AgentPortalBase, segment = ""): string {
  if (!segment || segment === "/") return base;
  const normalized = segment.startsWith("/") ? segment : `/${segment}`;
  if (normalized === base) return base;
  return `${base}${normalized}`;
}

/** Map a portal path to the equivalent under another portal base. */
export function remapAgentPortalPath(path: string, base: AgentPortalBase): string {
  if (path.startsWith(REGIONAL_HEAD_PORTAL_BASE)) {
    const suffix = path.slice(REGIONAL_HEAD_PORTAL_BASE.length);
    return agentPortalPath(base, suffix || "");
  }
  if (path.startsWith(AGENT_PORTAL_BASE)) {
    const suffix = path.slice(AGENT_PORTAL_BASE.length);
    return agentPortalPath(base, suffix || "");
  }
  return path;
}
