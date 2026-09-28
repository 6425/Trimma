import * as XLSX from "xlsx";
import type { ListingQueueRow } from "@/lib/listing-generation-queue";

function value(input: string | number | null | undefined): string | number {
  return input ?? "";
}

/** Creates a review-friendly workbook for the admin listing capture queue. */
export function exportPendingListingsToExcel(rows: ListingQueueRow[]): void {
  if (!rows.length) return;

  const exportedAt = new Date().toLocaleString("en-LK", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const header = [
    "Listing ID",
    "Business Name",
    "Category",
    "Address",
    "City",
    "District",
    "Province",
    "Phone",
    "Website",
    "Google Maps URL",
    "Google Place ID",
    "Rating",
    "Review Count",
    "Latitude",
    "Longitude",
    "Summary",
    "Description",
    "Listing Status",
    "Source",
    "Captured At",
    "Created At",
    "Verification Notes",
    "Verification Result",
  ];
  const data = rows.map((row) => [
    row.id,
    row.name,
    value(row.category),
    value(row.address),
    value(row.city),
    value(row.district),
    value(row.province),
    value(row.phone),
    value(row.website),
    value(row.map_url),
    value(row.place_id),
    value(row.rating),
    value(row.review_count),
    value(row.latitude),
    value(row.longitude),
    value(row.summary),
    value(row.description),
    value(row.onboarding_status),
    value(row.source_type),
    value(row.captured_at),
    row.created_at,
    "",
    "",
  ]);

  const sheet = XLSX.utils.aoa_to_sheet([
    ["Trimma Pending Listing Businesses"],
    ["Exported at", exportedAt],
    ["Records", rows.length],
    [],
    header,
    ...data,
  ]);
  sheet["!cols"] = header.map((_, index) => ({
    wch: [1, 3, 9, 10, 15, 16, 21].includes(index) ? 38 : index >= 0 && index <= 2 ? 24 : 18,
  }));
  sheet["!autofilter"] = { ref: `A5:W${data.length + 5}` };
  sheet["!freeze"] = { xSplit: 0, ySplit: 5 };

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Pending listings");
  XLSX.writeFile(workbook, `trimma-pending-listing-businesses-${new Date().toISOString().slice(0, 10)}.xlsx`);
}
