export const dynamic = "force-dynamic";

import AgentLayoutClient from "./layout-client";

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  return <AgentLayoutClient>{children}</AgentLayoutClient>;
}
