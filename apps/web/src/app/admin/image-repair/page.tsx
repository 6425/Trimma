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
  const [message, setMessage] = useState("Ready to restore existing Trimma listing photos.");

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
        setMessage(`Restoring images: ${repaired} restored, ${skipped} no stored file found, ${failed} failed (${batches} batches).`);

        if (result.complete || !result.nextCursor) break;
        cursor = result.nextCursor;
      }
      setMessage(`Restore complete: ${repaired} original Trimma images restored; ${skipped} had no stored Trimma file; ${failed} can be retried.`);
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
          Restores only a photo already stored under the same salon’s Trimma Storage folder.
          It does not contact Google, choose a new image, or change salon details, verification, or publication status.
        </p>
      </div>
      <Button type="button" size="lg" onClick={repairAll} disabled={running}>
        {running ? "Restoring stored images…" : "Restore existing Trimma images"}
      </Button>
      <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-medium text-zinc-700">{message}</p>
    </main>
  );
}
