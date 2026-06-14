"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AgentError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-xl font-bold text-zinc-900 mb-2">Agent portal error</h1>
      <p className="text-sm text-zinc-500 max-w-md mb-6">
        {error.message || "Something went wrong loading this page."}
      </p>
      <div className="flex flex-wrap gap-3 justify-center">
        <Button onClick={() => reset()}>Try again</Button>
        <Link href="/agent/login?redirectTo=/agent">
          <Button variant="outline">Sign in again</Button>
        </Link>
      </div>
    </div>
  );
}
