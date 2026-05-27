"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Trimma page error:", error);
  }, [error]);

  const isDev = process.env.NODE_ENV !== "production";

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-lg w-full rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-bold text-zinc-900">Something went wrong</h1>
        <p className="text-sm text-zinc-500 mt-2 leading-relaxed">
          {isDev
            ? "Local dev cache may be stale after code changes. Restart the dev server with a clean cache."
            : "This page hit a temporary error. Please try again in a moment."}
        </p>
        {isDev ? (
          <p className="mt-3 text-xs font-mono text-rose-600 bg-rose-50 rounded-lg px-3 py-2 break-all">
            cd apps/web && npm run dev:restart
          </p>
        ) : null}
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={() => reset()} className="rounded-xl">
            Try again
          </Button>
          <Button variant="outline" onClick={() => window.location.assign("/")} className="rounded-xl">
            Go home
          </Button>
        </div>
      </div>
    </div>
  );
}
