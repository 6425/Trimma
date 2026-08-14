"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, ExternalLink, Rocket, PauseCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  connectSalonRequestToListing,
  fetchListingGenerationQueue,
  publishListingSalon,
  startBookingOnboardingFromListing,
  unpublishListingSalon,
  type ListingQueueRow,
} from "@/app/actions/listing-generation";
import { LISTING_ONBOARDING_STATUS, listingPipelineLabel } from "@/lib/salon-listing-pipeline";
import { fetchAdminSalonRequests, type SalonRequestRow } from "@/app/actions/salon-requests";

export default function ListingQueuePage() {
  const [rows, setRows] = useState<ListingQueueRow[]>([]);
  const [requests, setRequests] = useState<SalonRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [queueResult, requestRows] = await Promise.all([
        fetchListingGenerationQueue(),
        fetchAdminSalonRequests(),
      ]);
      if (queueResult.success === false) throw new Error(queueResult.error);
      setRows(queueResult.rows);
      setRequests(
        (requestRows.success === false ? [] : requestRows.requests).filter(
          (r) => (r.status === "new" || r.status === "reviewing") && !r.salon_id
        )
      );
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to load listing queue.");
    } finally {
      setLoading(false);
    }
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect -- initial queue fetch on mount */
  useEffect(() => {
    void load();
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

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6 pb-12 duration-500">
      <div>
        <Link href="/admin/listing-generation" className="text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-800">
          ← Salon Listing Generation
        </Link>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#1A1C29]">Listing queue</h1>
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

      <div className="overflow-hidden rounded-3xl border border-zinc-100 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="border-b border-zinc-100 bg-zinc-50 text-left text-[11px] font-bold uppercase tracking-widest text-zinc-500">
            <tr>
              <th className="px-4 py-3">Business</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-16 text-center">
                  <Loader2 className="mx-auto h-8 w-8 animate-spin text-brand" />
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-16 text-center text-zinc-500">
                  No listing pipeline rows yet. Run{" "}
                  <Link href="/admin/listing-generation/capture" className="font-bold underline">
                    Data Capture
                  </Link>
                  .
                </td>
              </tr>
            ) : (
              rows.map((row) => {
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
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={isPublished ? "border-emerald-200 text-emerald-700" : ""}>
                        {listingPipelineLabel(row.onboarding_status)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap justify-end gap-1.5">
                        {isPublished ? (
                          <>
                            <Button asChild variant="outline" size="sm" className="h-9">
                              <Link href={`/salons/${row.slug}`} target="_blank">
                                <ExternalLink className="mr-1 h-3.5 w-3.5" />
                                View
                              </Link>
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-9"
                              disabled={busyId === row.id}
                              onClick={() =>
                                void runAction(row.id, () => unpublishListingSalon(row.id))
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
                            disabled={busyId === row.id}
                            onClick={() => void runAction(row.id, () => publishListingSalon(row.id))}
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
                          disabled={busyId === row.id}
                          onClick={() =>
                            void runAction(row.id, () =>
                              pendingRequest
                                ? connectSalonRequestToListing({
                                    salonRequestId: pendingRequest.id,
                                    salonId: row.id,
                                    assignAgent: true,
                                  })
                                : startBookingOnboardingFromListing({
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
      </div>
    </div>
  );
}
