"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function AgentTeamRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    void Promise.resolve().then(() => {
      router.replace("/regional-head/team");
    });
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[40vh] text-zinc-500 gap-2">
      <Loader2 className="w-5 h-5 animate-spin" />
      Redirecting to regional head team...
    </div>
  );
}
