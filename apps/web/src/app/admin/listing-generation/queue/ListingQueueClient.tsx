"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, ExternalLink, Rocket, PauseCircle } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { trimmaFilterTabClass } from "@/lib/customer-dashboard-ui";
import { LISTING_ONBOARDING_STATUS, listingPipelineLabel, formatListingCapturedDate } from "@/lib/salon-listing-pipeline";
import { fetchAdminSalonRequests, type SalonRequestRow } from "@/app/actions/salon-requests";
import type { ListingQueuePayload, ListingQueueRow } from "@/lib/listing-generation-queue";
import { buildSalonPublicPath } from "@/lib/salon-public-path";

type QueueTab = "pending" | "listed";

async function postListingAction(
  path: string,
  body: Record<string, unknown>
): Promise<{ success: boolean; error?: string; publishedCount?: number }> {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(body),
  });
  const data = (await response.json().catch(() => ({}))) as { error?: string; publishedCount?: number };
  if (!response.ok) {
    return { success: false, error: data.error || `Request failed (${response.status}).` };
  }
  return { success: true, publishedCount: data.publishedCount };
}

export default function ListingQueueClient({ initialQueue }: { initialQueue: ListingQueuePayload }) {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <Loader2 className="w-10 h-10 text-brand animate-spin" />
          <p className="text-zinc-500 font-bold text-sm">Loading listing queue…</p>
        </div>
      }
    >
      <ListingQueueContent initialQueue={initialQueue} />
    </Suspense>
  );
}

function ListingQueueContent({ initialQueue }: { initialQueue: ListingQueuePayload }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [rows, setRows] = useState<ListingQueueRow[]>(initialQueue.rows);
  const [pendingCount, setPendingCount] = useState(initialQueue.pendingCount);
  const [listedCount, setListedCount] = useState(initialQueue.listedCount);
  const [requests, setRequests] = useState<SalonRequestRow[]>([]);
  const [loading, setLoading] = useState(initialQueue.rows.length === 0);
  const [busyId, setBusyId] = useState<string | null>(null);
  const activeTab: QueueTab = searchParams.get("tab") === "listed" ? "listed" : "pending";

  const pendingRows = useMemo(
    () => rows.filter((row) => row.onboarding_status === LISTING_ONBOARDING_STATUS.CAPTURED),
    [rows]
  );
  const listedRows = useMemo(
    () => rows.filter((row) => row.onboarding_status === LISTING_ONBOARDING_STATUS.PUBLISHED),
    [rows]
  );
  const visibleRows = activeTab === "listed" ? listedRows : pendingRows;

  const load = useCallback(async (options?: { showLoading?: boolean }) => {
    const showLoading = options?.showLoading !== false;
    try {
      if (showLoading) setLoading(true);

      const [queueRes, requestResult] = await Promise.all([
        fetch(`/api/admin/listing-generation/queue?t=${Date.now()}`, {
          cache: "no-store",
          credentials: "same-origin",
        }),
        fetchAdminSalonRequests().catch(() => ({ success: false as const, error: "Salon requests unavailable." })),
      ]);

      const queuePayload = (await queueRes.json()) as {
        rows?: ListingQueueRow[];
        pendingCount?: number;
        listedCount?: number;
        error?: string;
      };
      if (!queueRes.ok) {
        throw new Error(queuePayload.error || `Listing queue failed (${queueRes.status}).`);
      }

      const nextRows = queuePayload.rows || [];
      setRows(nextRows);
      setPendingCount(
        typeof queuePayload.pendingCount === "number"
          ? queuePayload.pendingCount
          : nextRows.filter((row) => row.onboarding_status === LISTING_ONBOARDING_STATUS.CAPTURED).length
      );
      setListedCount(
        typeof queuePayload.listedCount === "number"
          ? queuePayload.listedCount
          : nextRows.filter((row) => row.onboarding_status === LISTING_ONBOARDING_STATUS.PUBLISHED).length
      );

      if (requestResult.success === false) {
        setRequests([]);
      } else {
        setRequests(
          requestResult.requests.filter(
            (r) => (r.status === "new" || r.status === "reviewing") && !r.salon_id
          )
        );
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to load listing queue.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect -- mount fetch populates admin queue table */
  useEffect(() => {
    void load({ showLoading: false });
  }, [load]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const runAction = async (salonId: string, action: () => Promise<{ success: boolean; error?: string }>) => {
    try {
      setBusyId(salonId);
      const result = await action();
      if (result.success === false) throw new Error(result.error);
      await load();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Action failed.");
    } finally {
      setBusyId(null);
    }
  };

  const publishAllPending = async () => {
    if (pendingCount < 1) {
      toast.message("There are no pending listings to publish.");
      return;
    }
    const confirmed = window.confirm(
      `Publish all ${pendingCount} pending listing${pendingCount === 1 ? "" : "s"} to the marketplace? Booking stays off until onboarding starts.`
    );
    if (!confirmed) return;

    try {
      setBusyId("__all__");
      const result = await postListingAction("/api/admin/listing-generation/publish", { allPending: true });
      if (result.success === false) throw new Error(result.error);
      const count = result.publishedCount ?? pendingCount;
      toast.success(
        count === 0 ? "No pending listings were left to publish." : `Published ${count} listing${count === 1 ? "" : "s"}.`
      );
      await load();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Publish all failed.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6 pb-12 duration-500">
      <div>
        <Link href="/admin/listing-generation" className="text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-800">
          ← Salon Listing Generation
        </Link>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#1A1C29]">
          Listing queue · {listedCount} listed
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-zinc-600">
          Publish captured salons to the customer marketplace by category and location. When an owner is ready for
          bookings (via claim or salon request), start booking onboarding — both paths use the same verification flow.
        </p>
      </div>

      {requests.length > 0 && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950">
          <p className="font-bold">{requests.length} open salon request(s)</p>
          <p className="mt-1">
            Link a request to a listing row below, then use <strong>Start booking onboarding</strong> to enter the shared
            agent + admin verification pipeline.
          </p>
          <Link href="/admin/leads?tab=salon-requests" className="mt-2 inline-block font-bold underline">
            View salon requests
          </Link>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="trimma-filter-tabs flex flex-wrap gap-2">
          <button
            type="button"
            className={cn(trimmaFilterTabClass(activeTab === "pending"), "trimma-filter-tab px-4 py-2 text-sm font-bold")}
            onClick={() => {
              router.replace("/admin/listing-generation/queue?tab=pending");
            }}
          >
            Pending
            <span className="ml-2 rounded-full bg-black/10 px-2 py-0.5 text-xs">{pendingCount}</span>
          </button>
          <button
            type="button"
            className={cn(trimmaFilterTabClass(activeTab === "listed"), "trimma-filter-tab px-4 py-2 text-sm font-bold")}
            onClick={() => {
              router.replace("/admin/listing-generation/queue?tab=listed");
            }}
          >
            Listed
            <span className="ml-2 rounded-full bg-black/10 px-2 py-0.5 text-xs">{listedCount}</span>
          </button>
        </div>
        {activeTab === "pending" ? (
          <Button
            type="button"
            variant="default"
            className="h-11 min-h-11 w-full font-bold sm:w-auto"
            disabled={busyId !== null || pendingCount < 1}
            onClick={() => void publishAllPending()}
          >
            {busyId === "__all__" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Rocket className="mr-1.5 h-4 w-4" />
                Publish all{pendingCount > 0 ? ` (${pendingCount})` : ""}
              </>
            )}
          </Button>
        ) : (
          <p className="text-xs font-medium text-zinc-500">
            Captured listings stay in <strong>Pending</strong> until you publish them to the marketplace.
          </p>
        )}
      </div>

      <div className="overflow-hidden rounded-3xl border border-zinc-100 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="border-b border-zinc-100 bg-zinc-50 text-left text-[11px] font-bold uppercase tracking-widest text-zinc-500">
            <tr>
              <th className="px-4 py-3">Business</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Captured</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-16 text-center">
                  <Loader2 className="mx-auto h-8 w-8 animate-spin text-brand" />
                </td>
              </tr>
            ) : visibleRows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-16 text-center text-zinc-500">
                  {activeTab === "pending" ? (
                    <>
                      No pending listings. Run{" "}
                      <Link href="/admin/listing-generation/capture" className="font-bold underline">
                        Data Capture
                      </Link>{" "}
                      to add salons to the Pending queue.
                    </>
                  ) : (
                    <>No listed salons yet. Publish rows from the Pending tab.</>
                  )}
                </td>
              </tr>
            ) : (
              visibleRows.map((row) => {
                const isPublished = row.onboarding_status === LISTING_ONBOARDING_STATUS.PUBLISHED;
                const location = [row.city, row.district].filter(Boolean).join(", ") || row.province || "—";
                const pendingRequest = requests.find(
                  (r) =>
                    !r.salon_id &&
                    r.business_name &&
                    row.name.toLowerCase().includes(r.business_name.toLowerCase().slice(0, 8))
                );

                return (
                  <tr key={row.id} className="border-b border-zinc-50 hover:bg-zinc-50/80">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-zinc-900">{row.name}</div>
                      <div className="text-xs text-zinc-500">
                        {row.rating != null ? `${row.rating}★` : "—"}
                        {row.review_count ? ` · ${row.review_count} reviews` : ""}
                      </div>
                    </td>
                    <td className="px-4 py-3">{row.category || "Uncategorized"}</td>
                    <td className="px-4 py-3">{location}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-zinc-600">
                      {formatListingCapturedDate(row.captured_at)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={isPublished ? "border-emerald-200 text-emerald-700" : ""}>
                        {listingPipelineLabel(row.onboarding_status)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap justify-end gap-1.5">
                        {isPublished ? (
                          <>
                            <Link
                              href={buildSalonPublicPath(row)}
                              target="_blank"
                              className={buttonVariants({ variant: "outline", size: "sm", className: "h-9" })}
                            >
                              <ExternalLink className="mr-1 h-3.5 w-3.5" />
                              View
                            </Link>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-9"
                              disabled={busyId !== null}
                              onClick={() =>
                                void runAction(row.id, () =>
                                  postListingAction("/api/admin/listing-generation/unpublish", {
                                    salonId: row.id,
                                  })
                                )
                              }
                            >
                              {busyId === row.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <>
                                  <PauseCircle className="mr-1 h-3.5 w-3.5" />
                                  Unpublish
                                </>
                              )}
                            </Button>
                          </>
                        ) : (
                          <Button
                            type="button"
                            variant="default"
                            size="sm"
                            className="h-9 font-bold"
                            disabled={busyId !== null}
                            onClick={() =>
                              void runAction(row.id, () =>
                                postListingAction("/api/admin/listing-generation/publish", {
                                  salonId: row.id,
                                })
                              )
                            }
                          >
                            {busyId === row.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <>
                                <Rocket className="mr-1 h-3.5 w-3.5" />
                                Publish listing
                              </>
                            )}
                          </Button>
                        )}

                        <Button
                          type="button"
                          variant="dark"
                          size="sm"
                          className="h-9 font-bold"
                          disabled={busyId !== null}
                          onClick={() =>
                            void runAction(row.id, () =>
                              pendingRequest
                                ? postListingAction("/api/admin/listing-generation/start-booking", {
                                    salonId: row.id,
                                    salonRequestId: pendingRequest.id,
                                    assignAgent: true,
                                    linkRequest: true,
                                  })
                                : postListingAction("/api/admin/listing-generation/start-booking", {
                                    salonId: row.id,
                                    assignAgent: true,
                                  })
                            )
                          }
                        >
                          Start booking onboarding
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        <p className="border-t border-zinc-100 px-4 py-2 text-xs text-zinc-500">
          Showing {visibleRows.length} {activeTab === "listed" ? "listed" : "pending"} · Pending {pendingCount} · Listed {listedCount}
        </p>
      </div>
    </div>
  );
}
