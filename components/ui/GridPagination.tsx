"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const GRID_PAGE_SIZE = 30;

export function paginateGridRows<T>(rows: T[], page: number, pageSize = GRID_PAGE_SIZE): T[] {
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(Math.max(1, page), pageCount);
  const start = (safePage - 1) * pageSize;
  return rows.slice(start, start + pageSize);
}

export function GridPagination({
  page,
  total,
  onPageChange,
  pageSize = GRID_PAGE_SIZE,
  loading = false,
}: {
  page: number;
  total: number;
  onPageChange: (page: number) => void;
  pageSize?: number;
  loading?: boolean;
}) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), pageCount);
  const start = total ? (safePage - 1) * pageSize + 1 : 0;
  const end = Math.min(safePage * pageSize, total);

  return (
    <div className="flex flex-col gap-2 border-t border-zinc-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-zinc-500">Showing {start}–{end} of {total}</p>
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" size="sm" disabled={loading || safePage <= 1} onClick={() => onPageChange(safePage - 1)} className="h-9 min-h-9">
          <ChevronLeft className="mr-1 h-4 w-4" /> Previous
        </Button>
        <span className="min-w-20 text-center text-xs font-semibold text-zinc-600">Page {safePage} of {pageCount}</span>
        <Button type="button" variant="outline" size="sm" disabled={loading || safePage >= pageCount} onClick={() => onPageChange(safePage + 1)} className="h-9 min-h-9">
          Next <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
