import * as XLSX from "xlsx";

export type DiscoveryExportRow = {
  name: string;
  category: string;
  address: string;
  city: string;
  district: string;
  province: string;
  phone: string;
  website: string;
  email: string;
  map_url: string;
  place_id: string;
  rating: string;
  review_count: string;
  price_level: string;
  latitude: string;
  longitude: string;
  working_hours: string;
  summary: string;
  description: string;
  google_business_status: string;
  google_types: string;
  onboarding_status: string;
  assign_to: string;
  source_type: string;
  status: string;
  created_at: string;
  google_last_synced_at: string;
};

function readExt(row: Record<string, unknown>, key: string): string {
  const ext = row.business_info_extended;
  if (!ext || typeof ext !== "object" || Array.isArray(ext)) return "";
  const value = (ext as Record<string, unknown>)[key];
  if (value == null) return "";
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}

function formatWorkingHours(value: unknown): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    if (value.every((item) => typeof item === "string")) return value.join("; ");
    return JSON.stringify(value);
  }
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function mapSalonToDiscoveryExport(row: Record<string, unknown>): DiscoveryExportRow {
  return {
    name: String(row.name || ""),
    category: String(row.category || ""),
    address: String(row.address || ""),
    city: String(row.city || ""),
    district: String(row.district || ""),
    province: String(row.province || ""),
    phone: String(row.phone || ""),
    website: String(row.website || ""),
    email: String(row.owner_gmail || row.owner_email || ""),
    map_url: String(row.map_url || ""),
    place_id: String(row.place_id || ""),
    rating: row.rating != null ? String(row.rating) : "",
    review_count: row.review_count != null ? String(row.review_count) : "",
    price_level: String(row.price_level || ""),
    latitude: row.latitude != null ? String(row.latitude) : "",
    longitude: row.longitude != null ? String(row.longitude) : "",
    working_hours: formatWorkingHours(row.working_hours),
    summary: String(row.summary || ""),
    description: String(row.description || ""),
    google_business_status: readExt(row, "google_business_status"),
    google_types: readExt(row, "google_types"),
    onboarding_status: String(row.onboarding_status || ""),
    assign_to: String(row.assign_to || ""),
    source_type: String(row.source_type || ""),
    status: String(row.status || ""),
    created_at: row.created_at ? String(row.created_at) : "",
    google_last_synced_at: readExt(row, "google_last_synced_at"),
  };
}

export function mapTerritoryBusinessToDiscoveryExport(row: Record<string, unknown>): DiscoveryExportRow {
  return {
    name: String(row.name || ""),
    category: String(row.category || ""),
    address: String(row.address || ""),
    city: String(row.city || ""),
    district: String(row.district || ""),
    province: String(row.province || ""),
    phone: String(row.phone || ""),
    website: String(row.website || ""),
    email: "",
    map_url: row.place_id ? `https://www.google.com/maps/place/?q=place_id:${row.place_id}` : "",
    place_id: String(row.id || row.place_id || row.slug || ""),
    rating: row.rating != null ? String(row.rating) : "",
    review_count: row.review_count != null ? String(row.review_count) : "",
    price_level: "",
    latitude: row.latitude != null ? String(row.latitude) : "",
    longitude: row.longitude != null ? String(row.longitude) : "",
    working_hours: "",
    summary: "",
    description: "",
    google_business_status: row.status === "google_lead" ? "GOOGLE_SEARCH_RESULT" : String(row.status || ""),
    google_types: "",
    onboarding_status: "",
    assign_to: String(row.assign_to || ""),
    source_type: row.status === "google_lead" ? "GOOGLE_PLACES" : "TRIMMA_SALON",
    status: String(row.status || ""),
    created_at: "",
    google_last_synced_at: "",
  };
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export function exportDiscoveryLeadsToExcel(input: {
  rows: DiscoveryExportRow[];
  fileName?: string;
  sheetTitle?: string;
  exportedBy?: string;
}): void {
  if (input.rows.length === 0) return;

  const exportedAt = new Date().toLocaleString("en-LK", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const header = [
    "Salon Name",
    "Category",
    "Address",
    "City",
    "District",
    "Province",
    "Phone",
    "Website",
    "Email",
    "Google Maps URL",
    "Google Place ID",
    "Rating",
    "Review Count",
    "Price Level",
    "Latitude",
    "Longitude",
    "Working Hours",
    "Google Summary",
    "Description",
    "Google Business Status",
    "Google Types",
    "Onboarding Status",
    "Assigned To",
    "Source",
    "Status",
    "Created At",
    "Google Last Synced",
  ];

  const dataRows = input.rows.map((row) => [
    row.name,
    row.category,
    row.address,
    row.city,
    row.district,
    row.province,
    row.phone,
    row.website,
    row.email,
    row.map_url,
    row.place_id,
    row.rating,
    row.review_count,
    row.price_level,
    row.latitude,
    row.longitude,
    row.working_hours,
    row.summary,
    row.description,
    row.google_business_status,
    row.google_types,
    row.onboarding_status,
    row.assign_to,
    row.source_type,
    row.status,
    row.created_at,
    row.google_last_synced_at,
  ]);

  const sheet = XLSX.utils.aoa_to_sheet([
    [input.sheetTitle || "Trimma Discovery Export"],
    ["Exported at", exportedAt],
    input.exportedBy ? ["Exported by", input.exportedBy] : [],
    [],
    header,
    ...dataRows,
  ]);

  sheet["!cols"] = header.map((_, index) => ({
    wch: index === 2 || index === 16 ? 42 : index === 9 ? 36 : 18,
  }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Discovery");

  const stamp = new Date().toISOString().slice(0, 10);
  const fileName = input.fileName || `trimma-discovery-${slugify(input.sheetTitle || "export")}-${stamp}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}
