export type SalonOwnerGuideDocument = {
  id: string;
  slug: string;
  document_type: string;
  language: string;
  title: string;
  description: string;
  file_path: string;
  file_url: string;
  file_size_bytes: number | null;
  version: number;
  is_published: boolean;
  download_url: string;
  file_format: "pdf";
};

const PDF_BASE = "/help/salon-owner-guide";

function pdfPath(language: string) {
  return `${PDF_BASE}/trimma-salon-owner-guide-${language}.pdf`;
}

export const SALON_OWNER_GUIDE_FALLBACKS: SalonOwnerGuideDocument[] = [
  {
    id: "so-en",
    slug: "salon-owner-guide-en",
    document_type: "salon_owner_guide",
    language: "en",
    title: "Trimma Salon Owner Handbook",
    description:
      "Comprehensive workspace guide — profile, bookings, staff, services, finance, and growing your salon on Trimma (32 steps).",
    file_path: "salon-owner-guide/trimma-salon-owner-guide-en.pdf",
    file_url: pdfPath("en"),
    file_size_bytes: 1608508,
    version: 2,
    is_published: true,
    download_url: pdfPath("en"),
    file_format: "pdf",
  },
  {
    id: "so-si",
    slug: "salon-owner-guide-si",
    document_type: "salon_owner_guide",
    language: "si",
    title: "ට්‍රිම්මා Salon Owner Handbook",
    description:
      "සම්පූර්ණ workspace මාර්ගෝපදේශය — profile, bookings, staff, services, finance සහ salon වර්ධනය (පියවර 32).",
    file_path: "salon-owner-guide/trimma-salon-owner-guide-si.pdf",
    file_url: pdfPath("si"),
    file_size_bytes: 1924347,
    version: 2,
    is_published: true,
    download_url: pdfPath("si"),
    file_format: "pdf",
  },
  {
    id: "so-ta",
    slug: "salon-owner-guide-ta",
    document_type: "salon_owner_guide",
    language: "ta",
    title: "ட்ரிம்மா Salon Owner Handbook",
    description:
      "முழுமையான workspace வழிகாட்டி — profile, bookings, staff, services, finance மற்றும் salon வளர்ச்சி (32 படிகள்).",
    file_path: "salon-owner-guide/trimma-salon-owner-guide-ta.pdf",
    file_url: pdfPath("ta"),
    file_size_bytes: 1682514,
    version: 2,
    is_published: true,
    download_url: pdfPath("ta"),
    file_format: "pdf",
  },
];

function normalizeSalonOwnerGuideUrl(language: string, fileUrl: string | null | undefined): string {
  const pdf = pdfPath(language);
  if (!fileUrl) return pdf;
  if (fileUrl.startsWith("http")) return fileUrl;
  if (fileUrl.endsWith(".docx")) return pdf;
  if (fileUrl.endsWith(".pdf")) return fileUrl.startsWith("/") ? fileUrl : `/${fileUrl}`;
  return pdf;
}

export function resolveSalonOwnerGuideDocuments(
  rows: Array<{
    id: string;
    slug: string;
    document_type: string;
    language: string;
    title: string;
    description: string | null;
    file_path: string;
    file_url: string | null;
    file_size_bytes: number | null;
    version: number;
    is_published: boolean;
  }> | null | undefined,
  language?: string | null
): SalonOwnerGuideDocument[] {
  const fallbackByLang = Object.fromEntries(SALON_OWNER_GUIDE_FALLBACKS.map((d) => [d.language, d]));

  const source =
    rows && rows.length > 0
      ? rows.map((row) => {
          const fileUrl = normalizeSalonOwnerGuideUrl(row.language, row.file_url);
          const fallback = fallbackByLang[row.language];
          return {
            ...row,
            description: row.description || fallback?.description || "",
            file_path: `salon-owner-guide/trimma-salon-owner-guide-${row.language}.pdf`,
            file_url: fileUrl,
            download_url: fileUrl,
            file_size_bytes: row.file_size_bytes ?? fallback?.file_size_bytes ?? null,
            file_format: "pdf" as const,
          };
        })
      : SALON_OWNER_GUIDE_FALLBACKS;

  if (language) return source.filter((d) => d.language === language);
  return source;
}
