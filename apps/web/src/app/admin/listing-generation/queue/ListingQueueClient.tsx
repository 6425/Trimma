"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, ExternalLink, Rocket, PauseCircle, Star, Search, Pencil } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { trimmaFilterTabClass } from "@/lib/customer-dashboard-ui";
import { LISTING_ONBOARDING_STATUS, listingPipelineLabel, formatListingCapturedDate } from "@/lib/salon-listing-pipeline";
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
import { ListingEditDialog, type ListingEditValues } from "./ListingEditDialog";

const DISTRICT_OPTIONS = getDistrictFilterOptions();
const LISTING_DISPLAY_SIZE = 40;

function addIsoDays(iso: string, days: number): string {
  const date = new Date(`${iso}T12:00:00`);
  date.setDate(date.getDate() + days);
  return date.toLocaleDateString("en-CA");
}

const FILTER_SELECT_CLASS =
  "h-11 min-h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-800";

type QueueTab = "pending" | "listed";

function isPendingQueueRow(row: { onboarding_status: string | null; source_type: string | null }) {
  if (row.onboarding_status === LISTING_ONBOARDING_STATUS.CAPTURED) return true;
  return row.source_type === "LISTING_GENERATION" && row.onboarding_status === "DISCOVERED";
}

async function postListingAction(
  path: string,
  body: Record<string, unknown>
): Promise<{ success: boolean; error?: string; publishedCount?: number; updatedCount?: number }> {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(body),
  });
  const data = (await response.json().catch(() => ({}))) as {
    error?: string;
    publishedCount?: number;
    updatedCount?: number;
  };
  if (!response.ok) {
    return { success: false, error: data.error || `Request failed (${response.status}).` };
  }
  return { success: true, publishedCount: data.publishedCount, updatedCount: data.updatedCount };
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
  const activeTab: QueueTab = searchParams.get("tab") === "listed" ? "listed" : "pending";
  const [pageRows, setPageRows] = useState<ListingQueueRow[]>(() =>
    initialQueue.rows.filter((row) =>
      activeTab === "listed"
        ? row.onboarding_status === LISTING_ONBOARDING_STATUS.PUBLISHED
        : isPendingQueueRow(row)
    )
  );
  const [featuredRows, setFeaturedRows] = useState<ListingQueueRow[]>(initialQueue.featuredRows || []);
  const [featuredTotal, setFeaturedTotal] = useState(initialQueue.featuredCount ?? initialQueue.featuredRows.length);
  const [featuredResultTotal, setFeaturedResultTotal] = useState(
    initialQueue.featuredCount ?? initialQueue.featuredRows.length
  );
  const [featuredSearchQuery, setFeaturedSearchQuery] = useState("");
  const [featuredDistrictSlug, setFeaturedDistrictSlug] = useState("");
  const [featuredCategoryName, setFeaturedCategoryName] = useState("");
  const [featuredLoading, setFeaturedLoading] = useState(false);
  const [pendingCount, setPendingCount] = useState(initialQueue.pendingCount);
  const [listedCount, setListedCount] = useState(initialQueue.listedCount);
  const [page, setPage] = useState(1);
  const [pageTotal, setPageTotal] = useState(
    activeTab === "listed" ? initialQueue.listedCount : initialQueue.pendingCount
  );
  const [requests, setRequests] = useState<SalonRequestRow[]>([]);
  const [loading, setLoading] = useState(pageRows.length === 0);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [districtSlug, setDistrictSlug] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [featureEditor, setFeatureEditor] = useState<{
    salonId: string;
    name: string;
    start: string;
    end: string;
    isFeatured: boolean;
  } | null>(null);
  const [listingEditor, setListingEditor] = useState<ListingQueueRow | null>(null);
  const [batchDraft, setBatchDraft] = useState<{ start: string; end: string } | null>(null);
  const categoryOptions = useMemo(
    () =>
      categories.length
        ? [...categories].sort((a, b) => a.name.localeCompare(b.name))
        : ADMIN_LEAD_DISCOVERY_CATEGORY_FALLBACKS.map((name) => ({ id: name, name, slug: name, icon: null })),
    [categories]
  );
  const hasActiveFilters = Boolean(searchQuery.trim() || districtSlug || categoryName);
  const hasFeaturedFilters = Boolean(
    featuredSearchQuery.trim() || featuredDistrictSlug || featuredCategoryName
  );
  const visibleRows = pageRows;
  const pageCount = Math.max(1, Math.ceil(pageTotal / LISTING_DISPLAY_SIZE));
  const tableLoading = loading;
  const featuredBatch = useMemo(() => {
    return [...featuredRows]
      .filter((row) => row.is_featured)
      .sort((a, b) => {
        const rank = (row: ListingQueueRow) => {
          const status = featuredListingStatus(row);
          if (status === "live") return 0;
          if (status === "scheduled") return 1;
          return 2;
        };
        if (rank(a) !== rank(b)) return rank(a) - rank(b);
        return a.name.localeCompare(b.name);
      });
  }, [featuredRows]);
  const featuredDisplayRows = hasFeaturedFilters ? featuredRows : featuredBatch;
  const featuredLiveCount = featuredDisplayRows.filter(
    (row) => row.is_featured && featuredListingStatus(row) === "live"
  ).length;
  const sharedBatchPeriod = useMemo(() => {
    const today = todayInFeaturedTimezone();
    const fallback = { start: today, end: addIsoDays(today, 13) };
    if (!featuredBatch.length) return fallback;
    const start = featuredBatch[0].featured_starts_at;
    const end = featuredBatch[0].featured_ends_at;
    const same = featuredBatch.every(
      (row) => row.featured_starts_at === start && row.featured_ends_at === end
    );
    if (same && start && end) return { start, end };
    return { start: start || fallback.start, end: end || fallback.end };
  }, [featuredBatch]);
  const batchStart = batchDraft?.start || sharedBatchPeriod.start;
  const batchEnd = batchDraft?.end || sharedBatchPeriod.end;
  const featuredCount = featuredLiveCount;

  const loadFeatured = useCallback(async (options?: { offset?: number; append?: boolean; signal?: AbortSignal }) => {
    const offset = Math.max(0, options?.offset || 0);
    try {
      setFeaturedLoading(true);
      const params = new URLSearchParams({
        offset: String(offset),
        q: featuredSearchQuery.trim(),
        district: featuredDistrictSlug,
        category: featuredCategoryName,
      });
      const response = await fetch(`/api/admin/listing-generation/queue/featured?${params}`, {
        cache: "no-store",
        credentials: "same-origin",
        signal: options?.signal,
      });
      const payload = (await response.json().catch(() => ({}))) as {
        rows?: ListingQueueRow[];
        total?: number;
        error?: string;
      };
      if (!response.ok) throw new Error(payload.error || `Featured salons failed (${response.status}).`);
      const nextRows = payload.rows || [];
      setFeaturedRows((current) => {
        if (!options?.append) return nextRows;
        const byId = new Map(current.map((row) => [row.id, row]));
        nextRows.forEach((row) => byId.set(row.id, row));
        return [...byId.values()];
      });
      const total = typeof payload.total === "number" ? payload.total : nextRows.length;
      setFeaturedResultTotal(total);
      if (!hasFeaturedFilters) setFeaturedTotal(total);
    } catch (error: unknown) {
      if (options?.signal?.aborted) return;
      toast.error(error instanceof Error ? error.message : "Failed to load featured salons.");
    } finally {
      if (!options?.signal?.aborted) setFeaturedLoading(false);
    }
  }, [featuredCategoryName, featuredDistrictSlug, featuredSearchQuery, hasFeaturedFilters]);

  const loadPage = useCallback(async (options?: { showLoading?: boolean; signal?: AbortSignal; page?: number; append?: boolean }) => {
    const showLoading = options?.showLoading !== false;
    const requestedPage = options?.page ?? 1;
    try {
      if (showLoading) setLoading(true);

      const params = new URLSearchParams({
        tab: activeTab,
        page: String(requestedPage),
        q: searchQuery.trim(),
        district: districtSlug,
        category: categoryName,
      });
      const response = await fetch(`/api/admin/listing-generation/queue/search?${params}`, {
        cache: "no-store",
        credentials: "same-origin",
        signal: options?.signal,
      });
      const payload = (await response.json().catch(() => ({}))) as {
        rows?: ListingQueueRow[];
        total?: number;
        page?: number;
        pageSize?: number;
        error?: string;
      };
      if (!response.ok) {
        throw new Error(payload.error || `Listing queue failed (${response.status}).`);
      }
      const nextRows = payload.rows || [];
      setPageRows((current) => {
        if (!options?.append) return nextRows;
        const byId = new Map(current.map((row) => [row.id, row]));
        nextRows.forEach((row) => byId.set(row.id, row));
        return [...byId.values()];
      });
      setPage(requestedPage);
      const total = typeof payload.total === "number" ? payload.total : 0;
      setPageTotal(total);
      const lastPage = Math.max(1, Math.ceil(total / LISTING_DISPLAY_SIZE));
      if (requestedPage > lastPage) setPage(lastPage);
      if (!hasActiveFilters) {
        if (activeTab === "listed") setListedCount(total);
        else setPendingCount(total);
      }
    } catch (error: unknown) {
      if (options?.signal?.aborted) return;
      const message = error instanceof Error ? error.message : "Failed to load listing queue.";
      toast.error(message);
    } finally {
      if (!options?.signal?.aborted) setLoading(false);
    }
  }, [activeTab, categoryName, districtSlug, hasActiveFilters, searchQuery]);

  const refreshQueueMetadata = useCallback(async () => {
    const response = await fetch(`/api/admin/listing-generation/queue?t=${Date.now()}`, {
      cache: "no-store",
      credentials: "same-origin",
    });
    const payload = (await response.json().catch(() => ({}))) as Partial<ListingQueuePayload> & { error?: string };
    if (!response.ok) {
      throw new Error(payload.error || `Listing summary failed (${response.status}).`);
    }
    setFeaturedTotal(payload.featuredCount ?? payload.featuredRows?.length ?? 0);
    setPendingCount(payload.pendingCount ?? 0);
    setListedCount(payload.listedCount ?? 0);
    setBatchDraft(null);
  }, []);

  useEffect(() => {
    void fetchAdminSalonRequests()
      .then((result) => {
        if (result.success === false) return setRequests([]);
        setRequests(
          result.requests.filter(
            (request) =>
              (request.status === "new" || request.status === "reviewing") && !request.salon_id
          )
        );
      })
      .catch(() => setRequests([]));
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void loadPage({ showLoading: true, signal: controller.signal });
    }, hasActiveFilters ? 250 : 0);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [hasActiveFilters, loadPage]);

  useEffect(() => {
    if (activeTab !== "listed") return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void loadFeatured({ offset: 0, signal: controller.signal });
    }, featuredSearchQuery.trim() || featuredDistrictSlug || featuredCategoryName ? 250 : 0);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [activeTab, featuredCategoryName, featuredDistrictSlug, featuredSearchQuery, loadFeatured]);

  const runAction = async (salonId: string, action: () => Promise<{ success: boolean; error?: string }>) => {
    try {
      setBusyId(salonId);
      const result = await action();
      if (result.success === false) throw new Error(result.error);
      await Promise.all([loadPage(), refreshQueueMetadata(), loadFeatured({ offset: 0 })]);
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
      setPage(1);
      await Promise.all([loadPage({ page: 1 }), refreshQueueMetadata()]);
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
              setPage(1);
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
              setPage(1);
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
            <strong>Featured Beauty Business</strong> row shows the live Featured Batch on the homepage
            and on each category page.
          </p>
        )}
      </div>

      {activeTab === "listed" ? (
        <div className="overflow-hidden rounded-2xl border border-amber-200 bg-[#fffbeb] shadow-sm">
          <div className="flex flex-col gap-3 border-b border-amber-200 p-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-sm font-bold text-zinc-900">Featured Batch</h2>
              <p className="mt-0.5 text-xs text-zinc-600">
                Search any listed salon here to add or edit it. With no search, this shows the complete
                featured batch. Public Featured Beauty Business shows the live batch.
              </p>
              <p className="mt-1 text-[11px] font-medium text-zinc-500">
                {featuredTotal} in batch · {hasFeaturedFilters ? `${featuredResultTotal} search results` : `${featuredDisplayRows.length} shown`} · {featuredLiveCount} live shown
                {formatFeaturedDateRange(batchStart, batchEnd) ? ` · ${formatFeaturedDateRange(batchStart, batchEnd)}` : ""}
              </p>
            </div>
            <div className="flex flex-wrap items-end gap-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                Start
                <Input
                  type="date"
                  className="mt-1 h-11 min-h-11 w-40"
                  value={batchStart}
                  onChange={(event) =>
                    setBatchDraft({ start: event.target.value, end: batchEnd })
                  }
                />
              </label>
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                End
                <Input
                  type="date"
                  className="mt-1 h-11 min-h-11 w-40"
                  value={batchEnd}
                  min={batchStart}
                  onChange={(event) =>
                    setBatchDraft({ start: batchStart, end: event.target.value })
                  }
                />
              </label>
              <Button
                type="button"
                variant="default"
                className="h-11 min-h-11 font-bold"
                disabled={busyId !== null || featuredTotal === 0}
                onClick={() =>
                  void runAction("__batch__", async () => {
                    if (!isValidFeaturedPeriod(batchStart, batchEnd)) {
                      return { success: false, error: "Choose a start date and an end date on or after start." };
                    }
                    const result = await postListingAction("/api/admin/listing-generation/feature-batch", {
                      featuredStartsAt: batchStart,
                      featuredEndsAt: batchEnd,
                    });
                    if (result.success) {
                      toast.success(
                        `Featured batch dates saved for ${result.updatedCount ?? featuredTotal} salon${
                          (result.updatedCount ?? featuredTotal) === 1 ? "" : "s"
                        }.`
                      );
                    }
                    return result;
                  })
                }
              >
                {busyId === "__batch__" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save batch dates"}
              </Button>
            </div>
          </div>
          <div className="grid gap-2 border-b border-amber-200 bg-white/70 p-3 sm:grid-cols-[minmax(0,1fr)_11rem_12rem]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <Input
                value={featuredSearchQuery}
                onChange={(event) => setFeaturedSearchQuery(event.target.value)}
                placeholder="Search by salon name, category, district or town…"
                className="h-11 min-h-11 rounded-xl bg-white pl-10 text-sm"
              />
            </div>
            <select
              aria-label="Featured salon district"
              value={featuredDistrictSlug}
              onChange={(event) => setFeaturedDistrictSlug(event.target.value)}
              className={FILTER_SELECT_CLASS}
            >
              <option value="">Any district</option>
              {DISTRICT_OPTIONS.map((district) => (
                <option key={district.value} value={district.value}>
                  {district.label}
                </option>
              ))}
            </select>
            <select
              aria-label="Featured salon category"
              value={featuredCategoryName}
              onChange={(event) => setFeaturedCategoryName(event.target.value)}
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
          {featuredLoading && featuredDisplayRows.length === 0 ? (
            <div className="px-3 py-8 text-center text-xs text-zinc-500">
              <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin text-brand" />
              Loading featured salons…
            </div>
          ) : featuredDisplayRows.length === 0 ? (
            <p className="px-3 py-6 text-center text-xs text-zinc-500">
              {hasFeaturedFilters
                ? "No listed salons match this search."
                : "No featured salons yet. Search listed salons below and click Feature to add them to this batch."}
            </p>
          ) : (
            <>
            <table className="w-full table-fixed text-[11px] leading-tight">
              <thead className="border-b border-amber-200 bg-amber-50 text-left text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="w-[28%] px-2 py-1.5">Business</th>
                  <th className="w-[18%] px-2 py-1.5">Category</th>
                  <th className="w-[22%] px-2 py-1.5">Location</th>
                  <th className="w-[16%] px-2 py-1.5">Status</th>
                  <th className="w-[16%] px-2 py-1.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {featuredDisplayRows.map((row) => {
                  const location = [row.city, row.district].filter(Boolean).join(", ") || row.province || "—";
                  const status = featuredListingStatus(row);
                  return (
                    <tr key={row.id} className="border-b border-amber-100">
                      <td className="truncate px-2 py-1.5 font-semibold text-zinc-900">{row.name}</td>
                      <td className="truncate px-2 py-1.5 text-zinc-700">{row.category || "Uncategorized"}</td>
                      <td className="truncate px-2 py-1.5 text-zinc-700">{location}</td>
                      <td className="px-2 py-1.5">
                        <Badge
                          className={cn(
                            "px-1.5 py-0 text-[10px]",
                            status === "live"
                              ? "border-none bg-[#ffde5a] text-black"
                              : "border-none bg-zinc-200 text-zinc-800"
                          )}
                        >
                          {!row.is_featured
                            ? "Not featured"
                            : status === "live"
                              ? "Featured"
                              : status === "scheduled"
                                ? "Scheduled"
                                : "Expired"}
                          {row.is_featured && formatFeaturedDateRange(row.featured_starts_at, row.featured_ends_at)
                            ? ` · ${formatFeaturedDateRange(row.featured_starts_at, row.featured_ends_at)}`
                            : ""}
                        </Badge>
                      </td>
                      <td className="px-2 py-1.5">
                        <div className="flex flex-wrap justify-end gap-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 min-h-7 px-2 text-[10px] font-bold"
                            disabled={busyId !== null}
                            onClick={() => setListingEditor(row)}
                          >
                            <Pencil className="mr-0.5 h-3 w-3" />
                            Edit
                          </Button>
                          {row.is_featured ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-7 min-h-7 px-2 text-[10px]"
                              disabled={busyId !== null}
                              onClick={() =>
                                void runAction(row.id, async () => {
                                  const result = await postListingAction("/api/admin/listing-generation/feature", {
                                    salonId: row.id,
                                    featured: false,
                                  });
                                  if (result.success) toast.success(`Removed ${row.name} from the featured batch.`);
                                  return result;
                                })
                              }
                            >
                              Remove
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-7 min-h-7 px-2 text-[10px] font-bold"
                              disabled={busyId !== null}
                              onClick={() => {
                                const today = todayInFeaturedTimezone();
                                setFeatureEditor({
                                  salonId: row.id,
                                  name: row.name,
                                  start: batchStart || today,
                                  end: batchEnd || addIsoDays(today, 13),
                                  isFeatured: false,
                                });
                              }}
                            >
                              <Star className="mr-0.5 h-3 w-3" />
                              Feature
                            </Button>
                          )}
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
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="flex flex-col gap-2 border-t border-amber-200 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[11px] font-medium text-zinc-500">
                Showing {featuredDisplayRows.length} of {featuredResultTotal}{" "}
                {hasFeaturedFilters ? "matching listed salons" : "featured salons"}
              </p>
              {featuredDisplayRows.length < featuredResultTotal ? (
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 min-h-10 font-bold"
                  disabled={featuredLoading || busyId !== null}
                  onClick={() => void loadFeatured({ offset: featuredRows.length, append: true })}
                >
                  {featuredLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Load 40 more
                </Button>
              ) : null}
            </div>
            </>
          )}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm">
        <div className="border-b border-zinc-100 p-3">
          <div className="mb-2">
            <h2 className="text-sm font-bold text-zinc-900">
              {activeTab === "listed" ? "Find a listed business" : "Find a pending business"}
            </h2>
            <p className="text-[11px] text-zinc-500">Search the complete listing database. Results are returned 40 at a time.</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_11rem_12rem]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <Input
                value={searchQuery}
                onChange={(event) => {
                  setPage(1);
                  setSearchQuery(event.target.value);
                }}
                placeholder={
                  activeTab === "listed"
                    ? "Search listed salons by name, category, district or town…"
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
              onChange={(event) => {
                setPage(1);
                setDistrictSlug(event.target.value);
              }}
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
              onChange={(event) => {
                setPage(1);
                setCategoryName(event.target.value);
              }}
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
                  {hasActiveFilters ? (
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
                                  start: row.featured_starts_at || batchStart || today,
                                  end: row.featured_ends_at || batchEnd || addIsoDays(today, 13),
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
                              onClick={() => setListingEditor(row)}
                            >
                              <Pencil className="mr-0.5 h-3 w-3" />
                              Edit
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
        <div className="flex flex-col gap-2 border-t border-zinc-100 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11px] text-zinc-500">
            {pageTotal > 0
              ? `Showing ${visibleRows.length} of ${pageTotal}`
              : "Showing 0 results"}
            {hasActiveFilters ? ` matching ${activeTab}` : ` ${activeTab}`} · Pending {pendingCount} · Listed {listedCount}
            {activeTab === "listed" ? ` · Featured live ${featuredCount}` : ""}
          </p>
          {visibleRows.length < pageTotal ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={loading || page >= pageCount}
              onClick={() => void loadPage({ page: page + 1, append: true })}
              className="h-9 min-h-9 font-bold"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Load 40 more
            </Button>
          ) : null}
        </div>
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
                      toast.success("Featured for the selected period. Public Featured Beauty Business uses this batch.");
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

      {listingEditor ? (
        <ListingEditDialog
          key={listingEditor.id}
          row={listingEditor}
          categories={categories}
          saving={busyId === listingEditor.id}
          onCancel={() => setListingEditor(null)}
          onSave={(values: ListingEditValues) =>
            runAction(listingEditor.id, async () => {
              const result = await postListingAction("/api/admin/listing-generation/edit", {
                salonId: listingEditor.id,
                ...values,
              });
              if (result.success) {
                toast.success("Business listing updated.");
                setListingEditor(null);
              }
              return result;
            })
          }
        />
      ) : null}
    </div>
  );
}
