"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type BatchResult = {
  attempted: number;
  repaired: number;
  skipped: number;
  failed: number;
  nextCursor: string | null;
  complete: boolean;
  error?: string;
};

export default function AdminImageRepairPage() {
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState("Ready to repair expired external listing photos.");

  const repairAll = async () => {
    setRunning(true);
    let cursor = "";
    let repaired = 0;
    let skipped = 0;
    let failed = 0;
    let batches = 0;

    try {
      while (true) {
        const response = await fetch("/api/admin/repair-listing-images", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cursor, limit: 10 }),
        });
        const result = (await response.json()) as BatchResult;
        if (!response.ok || result.error) throw new Error(result.error || "Image repair failed.");

        repaired += result.repaired;
        skipped += result.skipped;
        failed += result.failed;
        batches += 1;
        setMessage(`Repairing images: ${repaired} repaired, ${skipped} unavailable, ${failed} failed (${batches} batches).`);

        if (result.complete || !result.nextCursor) break;
        cursor = result.nextCursor;
      }
      setMessage(`Repair complete: ${repaired} permanent images saved; ${skipped} had no current Google photo; ${failed} can be retried.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Image repair stopped unexpectedly.");
    } finally {
      setRunning(false);
    }
  };

  return (
    <main className="mx-auto max-w-2xl space-y-6 p-8">
      <div>
        <h1 className="text-2xl font-black text-zinc-900">Repair listing images</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Replaces expired external listing photos with one permanent Trimma Storage image per eligible salon.
          Salon details, verification, and publication status are not changed.
        </p>
      </div>
      <Button type="button" size="lg" onClick={repairAll} disabled={running}>
        {running ? "Repairing images…" : "Repair all expired images"}
      </Button>
      <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-medium text-zinc-700">{message}</p>
    </main>
  );
}
