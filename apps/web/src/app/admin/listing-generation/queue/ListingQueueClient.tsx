"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, ExternalLink, Rocket, PauseCircle, Star, Search, FileText } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { trimmaFilterTabClass } from "@/lib/customer-dashboard-ui";
import { LISTING_ONBOARDING_STATUS, listingPipelineLabel, formatListingCapturedDate } from "@/lib/salon-listing-pipeline";
import { FEATURED_LISTING_COUNT } from "@/lib/listing-marketplace-rank";
import {
  featuredListingStatus,
  formatFeaturedDateRange,
  isValidFeaturedPeriod,
  todayInFeaturedTimezone,
} from "@/lib/listing-featured";
import { Input } from "@/components/ui/input";
import { fetchAdminSalonRequests, type SalonRequestRow } from "@/app/actions/salon-requests";
import { ADMIN_LEAD_DISCOVERY_CATEGORY_FALLBACKS } from "@/lib/admin-lead-categories";
import type { ListingQueuePayload, ListingQueueRow } from "@/lib/listing-generation-queue";
import type { PublicCategory } from "@/lib/public-categories";
import { getDistrictFilterOptions } from "@/lib/sri-lanka-locations";
import { buildSalonPublicPath } from "@/lib/salon-public-path";

const DISTRICT_OPTIONS = getDistrictFilterOptions();

function addIsoDays(iso: string, days: number): string {
  const date = new Date(`${iso}T12:00:00`);
  date.setDate(date.getDate() + days);
  return date.toLocaleDateString("en-CA");
}

const FILTER_SELECT_CLASS =
  "h-11 min-h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-800";

function listingAboutText(row: Pick<ListingQueueRow, "description" | "summary">): string {
  return row.description || row.summary || "";
}

type QueueTab = "pending" | "listed";

function isPendingQueueRow(row: { onboarding_status: string | null; source_type: string | null }) {
  if (row.onboarding_status === LISTING_ONBOARDING_STATUS.CAPTURED) return true;
  return row.source_type === "LISTING_GENERATION" && row.onboarding_status === "DISCOVERED";
}

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

export default function ListingQueueClient({
  initialQueue,
  categories = [],
}: {
  initialQueue: ListingQueuePayload;
  categories?: PublicCategory[];
}) {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <Loader2 className="w-10 h-10 text-brand animate-spin" />
          <p className="text-zinc-500 font-bold text-sm">Loading listing queue…</p>
        </div>
      }
    >
      <ListingQueueContent initialQueue={initialQueue} categories={categories} />
    </Suspense>
  );
}

function ListingQueueContent({
  initialQueue,
  categories,
}: {
  initialQueue: ListingQueuePayload;
  categories: PublicCategory[];
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [rows, setRows] = useState<ListingQueueRow[]>(initialQueue.rows);
  const [pendingCount, setPendingCount] = useState(initialQueue.pendingCount);
  const [listedCount, setListedCount] = useState(initialQueue.listedCount);
  const [requests, setRequests] = useState<SalonRequestRow[]>([]);
  const [loading, setLoading] = useState(initialQueue.rows.length === 0);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [districtSlug, setDistrictSlug] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [searchRows, setSearchRows] = useState<ListingQueueRow[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchTick, setSearchTick] = useState(0);
  const [featureEditor, setFeatureEditor] = useState<{
    salonId: string;
    name: string;
    start: string;
    end: string;
    isFeatured: boolean;
  } | null>(null);
  const [aboutEditor, setAboutEditor] = useState<{
    salonId: string;
    name: string;
    about: string;
  } | null>(null);
  const activeTab: QueueTab = searchParams.get("tab") === "listed" ? "listed" : "pending";

  const pendingRows = useMemo(
    () => rows.filter(isPendingQueueRow),
    [rows]
  );
  const listedRows = useMemo(
    () =>
      rows
        .filter((row) => row.onboarding_status === LISTING_ONBOARDING_STATUS.PUBLISHED)
        .sort((a, b) => {
          const aLive = featuredListingStatus(a) === "live" ? 1 : 0;
          const bLive = featuredListingStatus(b) === "live" ? 1 : 0;
          if (aLive !== bLive) return bLive - aLive;
          if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1;
          const byCaptured = String(b.captured_at || "").localeCompare(String(a.captured_at || ""));
          if (byCaptured) return byCaptured;
          return String(b.created_at || "").localeCompare(String(a.created_at || ""));
        }),
    [rows]
  );
  const tabRows = activeTab === "listed" ? listedRows : pendingRows;
  const categoryOptions = useMemo(
    () =>
      categories.length
        ? [...categories].sort((a, b) => a.name.localeCompare(b.name))
        : ADMIN_LEAD_DISCOVERY_CATEGORY_FALLBACKS.map((name) => ({ id: name, name, slug: name, icon: null })),
    [categories]
  );
  const hasActiveFilters = Boolean(searchQuery.trim() || districtSlug || categoryName);
  const visibleRows = hasActiveFilters ? searchRows || [] : tabRows;
  const tableLoading = loading || (hasActiveFilters && searching && searchRows === null);
  const featuredCount = listedRows.filter((row) => featuredListingStatus(row) === "live").length;

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
          : nextRows.filter(isPendingQueueRow).length
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

  useEffect(() => {
    if (!hasActiveFilters) return;

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        setSearching(true);
        const params = new URLSearchParams({
          tab: activeTab,
          q: searchQuery.trim(),
          district: districtSlug,
          category: categoryName,
        });
        const response = await fetch(`/api/admin/listing-generation/queue/search?${params}`, {
          cache: "no-store",
          credentials: "same-origin",
          signal: controller.signal,
        });
        const data = (await response.json().catch(() => ({}))) as { rows?: ListingQueueRow[]; error?: string };
        if (!response.ok) {
          throw new Error(data.error || `Search failed (${response.status}).`);
        }
        setSearchRows(data.rows || []);
      } catch (error: unknown) {
        if (controller.signal.aborted) return;
        toast.error(error instanceof Error ? error.message : "Failed to search listed salons.");
        setSearchRows([]);
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [hasActiveFilters, searchQuery, districtSlug, categoryName, activeTab, searchTick]);

  const runAction = async (salonId: string, action: () => Promise<{ success: boolean; error?: string }>) => {
    try {
      setBusyId(salonId);
      const result = await action();
      if (result.success === false) throw new Error(result.error);
      await load();
      setSearchTick((current) => current + 1);
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
            Feature a listed salon with a start and end date. The public{" "}
            <strong>Featured Beauty Business</strong> row shows up to {FEATURED_LISTING_COUNT} currently
            live featured listings on the homepage and on each category page. Extra live featured
            listings are ranked by reviews.
          </p>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm">
        <div className="border-b border-zinc-100 p-2.5">
          <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_11rem_12rem]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={
                  activeTab === "listed"
                    ? "Search listed salons by name or address…"
                    : "Search pending salons by name or address…"
                }
                className="h-11 min-h-11 rounded-xl pl-10 text-sm"
              />
            </div>
            <label className="sr-only" htmlFor="queue-district-filter">
              District
            </label>
            <select
              id="queue-district-filter"
              value={districtSlug}
              onChange={(event) => setDistrictSlug(event.target.value)}
              className={FILTER_SELECT_CLASS}
            >
              <option value="">Any district</option>
              {DISTRICT_OPTIONS.map((district) => (
                <option key={district.value} value={district.value}>
                  {district.label}
                </option>
              ))}
            </select>
            <label className="sr-only" htmlFor="queue-category-filter">
              Category
            </label>
            <select
              id="queue-category-filter"
              value={categoryName}
              onChange={(event) => setCategoryName(event.target.value)}
              className={FILTER_SELECT_CLASS}
            >
              <option value="">Any category</option>
              {categoryOptions.map((category) => (
                <option key={category.slug || category.name} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <table className="w-full table-fixed text-[11px] leading-tight">
          <thead className="border-b border-zinc-100 bg-zinc-50 text-left text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            <tr>
              <th className="w-[20%] px-2 py-1.5">Business</th>
              <th className="w-[14%] px-2 py-1.5">Category</th>
              <th className="w-[16%] px-2 py-1.5">Location</th>
              <th className="w-[11%] px-2 py-1.5">Captured</th>
              <th className="w-[15%] px-2 py-1.5">Status</th>
              <th className="w-[24%] px-2 py-1.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tableLoading ? (
              <tr>
                <td colSpan={6} className="px-2 py-12 text-center">
                  <Loader2 className="mx-auto h-8 w-8 animate-spin text-brand" />
                </td>
              </tr>
            ) : visibleRows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-2 py-12 text-center text-zinc-500">
                  {tabRows.length > 0 && hasActiveFilters ? (
                    <>No {activeTab === "listed" ? "listed" : "pending"} salons match these filters.</>
                  ) : activeTab === "pending" ? (
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
                    <td className="truncate px-2 py-1.5">
                      <div className="truncate font-semibold text-zinc-900">{row.name}</div>
                      <div className="truncate text-[10px] text-zinc-500">
                        {row.rating != null ? `${row.rating}★` : "—"}
                        {row.review_count ? ` · ${row.review_count} reviews` : ""}
                      </div>
                    </td>
                    <td className="truncate px-2 py-1.5 text-zinc-700">{row.category || "Uncategorized"}</td>
                    <td className="truncate px-2 py-1.5 text-zinc-700">{location}</td>
                    <td className="truncate px-2 py-1.5 whitespace-nowrap text-zinc-600">
                      {formatListingCapturedDate(row.captured_at)}
                    </td>
                    <td className="px-2 py-1.5">
                      <div className="flex flex-wrap items-center gap-1">
                        <Badge variant="outline" className={cn("px-1.5 py-0 text-[10px]", isPublished ? "border-emerald-200 text-emerald-700" : "")}>
                          {listingPipelineLabel(row.onboarding_status)}
                        </Badge>
                        {row.is_featured ? (
                          <Badge
                            className={cn(
                              "px-1.5 py-0 text-[10px]",
                              featuredListingStatus(row) === "live"
                                ? "border-none bg-[#ffde5a] text-black"
                                : "border-none bg-zinc-200 text-zinc-800"
                            )}
                          >
                            {featuredListingStatus(row) === "live"
                              ? "Featured"
                              : featuredListingStatus(row) === "scheduled"
                                ? "Scheduled"
                                : "Expired"}
                            {formatFeaturedDateRange(row.featured_starts_at, row.featured_ends_at)
                              ? ` · ${formatFeaturedDateRange(row.featured_starts_at, row.featured_ends_at)}`
                              : ""}
                          </Badge>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-2 py-1.5">
                      <div className="flex flex-wrap justify-end gap-1">
                        {isPublished ? (
                          <>
                            <Button
                              type="button"
                              variant={featuredListingStatus(row) === "live" ? "default" : "outline"}
                              size="sm"
                              className="h-7 min-h-7 px-2 text-[10px] font-bold"
                              disabled={busyId !== null}
                              onClick={() => {
                                const today = todayInFeaturedTimezone();
                                setFeatureEditor({
                                  salonId: row.id,
                                  name: row.name,
                                  start: row.featured_starts_at || today,
                                  end: row.featured_ends_at || addIsoDays(today, 13),
                                  isFeatured: row.is_featured,
                                });
                              }}
                            >
                              {busyId === row.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <>
                                  <Star className={cn("mr-0.5 h-3 w-3", featuredListingStatus(row) === "live" && "fill-current")} />
                                  {row.is_featured ? "Edit" : "Feature"}
                                </>
                              )}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-7 min-h-7 px-2 text-[10px] font-bold"
                              disabled={busyId !== null}
                              onClick={() =>
                                setAboutEditor({
                                  salonId: row.id,
                                  name: row.name,
                                  about: listingAboutText(row),
                                })
                              }
                            >
                              <FileText className="mr-0.5 h-3 w-3" />
                              About
                            </Button>
                            <Link
                              href={buildSalonPublicPath(row)}
                              target="_blank"
                              className={buttonVariants({ variant: "outline", size: "sm", className: "h-7 min-h-7 px-2 text-[10px]" })}
                            >
                              <ExternalLink className="mr-0.5 h-3 w-3" />
                              View
                            </Link>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-7 min-h-7 px-2 text-[10px]"
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
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <>
                                  <PauseCircle className="mr-0.5 h-3 w-3" />
                                  Unpub
                                </>
                              )}
                            </Button>
                          </>
                        ) : (
                          <Button
                            type="button"
                            variant="default"
                            size="sm"
                            className="h-7 min-h-7 px-2 text-[10px] font-bold"
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
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <>
                                <Rocket className="mr-0.5 h-3 w-3" />
                                Publish
                              </>
                            )}
                          </Button>
                        )}

                        <Button
                          type="button"
                          variant="dark"
                          size="sm"
                          className="h-7 min-h-7 px-2 text-[10px] font-bold"
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
                          Onboard
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        <p className="border-t border-zinc-100 px-2.5 py-1.5 text-[11px] text-zinc-500">
          Showing {visibleRows.length}
          {hasActiveFilters
            ? ` match${visibleRows.length === 1 ? "" : "es"} across all ${activeTab}`
            : ` ${activeTab === "listed" ? "listed" : "pending"}`}{" "}
          · Pending {pendingCount} · Listed {listedCount}
          {activeTab === "listed" ? ` · Featured live ${featuredCount}` : ""}
        </p>
      </div>

      {featureEditor ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <h2 className="text-lg font-bold text-zinc-900">Feature {featureEditor.name}</h2>
            <p className="mt-1 text-sm text-zinc-600">
              This business will appear in Featured Beauty Business on the homepage and matching category pages between these dates (inclusive).
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                Start date
                <Input
                  type="date"
                  className="mt-1 min-h-11"
                  value={featureEditor.start}
                  onChange={(event) =>
                    setFeatureEditor((current) =>
                      current ? { ...current, start: event.target.value } : current
                    )
                  }
                />
              </label>
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                End date
                <Input
                  type="date"
                  className="mt-1 min-h-11"
                  value={featureEditor.end}
                  min={featureEditor.start}
                  onChange={(event) =>
                    setFeatureEditor((current) =>
                      current ? { ...current, end: event.target.value } : current
                    )
                  }
                />
              </label>
            </div>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
              {featureEditor.isFeatured ? (
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 min-h-11 w-full font-bold sm:w-auto"
                  disabled={busyId !== null}
                  onClick={() =>
                    void runAction(featureEditor.salonId, async () => {
                      const result = await postListingAction("/api/admin/listing-generation/feature", {
                        salonId: featureEditor.salonId,
                        featured: false,
                      });
                      if (result.success) {
                        toast.success("Removed from featured.");
                        setFeatureEditor(null);
                      }
                      return result;
                    })
                  }
                >
                  Remove featured
                </Button>
              ) : null}
              <Button
                type="button"
                variant="outline"
                className="h-11 min-h-11 w-full font-bold sm:w-auto"
                disabled={busyId !== null}
                onClick={() => setFeatureEditor(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="default"
                className="h-11 min-h-11 w-full font-bold sm:w-auto"
                disabled={busyId !== null}
                onClick={() =>
                  void runAction(featureEditor.salonId, async () => {
                    if (!isValidFeaturedPeriod(featureEditor.start, featureEditor.end)) {
                      return { success: false, error: "Choose a start date and an end date on or after start." };
                    }
                    const result = await postListingAction("/api/admin/listing-generation/feature", {
                      salonId: featureEditor.salonId,
                      featured: true,
                      featuredStartsAt: featureEditor.start,
                      featuredEndsAt: featureEditor.end,
                    });
                    if (result.success) {
                      if (featuredCount >= FEATURED_LISTING_COUNT) {
                        toast.success(
                          `Featured for this period. Homepage and category pages show up to ${FEATURED_LISTING_COUNT}; extras are ranked by reviews.`
                        );
                      } else {
                        toast.success("Featured for the selected period.");
                      }
                      setFeatureEditor(null);
                    }
                    return result;
                  })
                }
              >
                Save featured period
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {aboutEditor ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl">
            <h2 className="text-lg font-bold text-zinc-900">About {aboutEditor.name}</h2>
            <p className="mt-1 text-sm text-zinc-600">
              This text appears in the About the salon section on the public listing page.
            </p>
            <label className="mt-4 block text-xs font-bold uppercase tracking-widest text-zinc-500">
              About the salon
              <textarea
                className="mt-1 min-h-32 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-800 outline-none focus:ring-2 focus:ring-brand/20"
                maxLength={4000}
                value={aboutEditor.about}
                onChange={(event) =>
                  setAboutEditor((current) =>
                    current ? { ...current, about: event.target.value } : current
                  )
                }
                placeholder="Describe the salon, services, and what guests can expect."
              />
            </label>
            <p className="mt-1 text-right text-[11px] text-zinc-400">{aboutEditor.about.length} / 4000</p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                className="h-11 min-h-11 w-full font-bold sm:w-auto"
                disabled={busyId !== null}
                onClick={() => setAboutEditor(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="default"
                className="h-11 min-h-11 w-full font-bold sm:w-auto"
                disabled={busyId !== null}
                onClick={() =>
                  void runAction(aboutEditor.salonId, async () => {
                    const result = await postListingAction("/api/admin/listing-generation/about", {
                      salonId: aboutEditor.salonId,
                      about: aboutEditor.about,
                    });
                    if (result.success) {
                      toast.success("About the salon updated.");
                      setAboutEditor(null);
                    }
                    return result;
                  })
                }
              >
                Save about
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
