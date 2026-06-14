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
};

const DOCX_BASE = "/help/salon-owner-guide";

function docxPath(language: string) {
  return `${DOCX_BASE}/trimma-salon-owner-guide-${language}.docx`;
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
    file_path: "salon-owner-guide/trimma-salon-owner-guide-en.docx",
    file_url: docxPath("en"),
    file_size_bytes: null,
    version: 1,
    is_published: true,
    download_url: docxPath("en"),
  },
  {
    id: "so-si",
    slug: "salon-owner-guide-si",
    document_type: "salon_owner_guide",
    language: "si",
    title: "ට්‍රිම්මා Salon Owner Handbook",
    description:
      "සම්පූර්ණ workspace මාර්ගෝපදේශය — profile, bookings, staff, services, finance සහ salon වර්ධනය (පියවර 32).",
    file_path: "salon-owner-guide/trimma-salon-owner-guide-si.docx",
    file_url: docxPath("si"),
    file_size_bytes: null,
    version: 1,
    is_published: true,
    download_url: docxPath("si"),
  },
  {
    id: "so-ta",
    slug: "salon-owner-guide-ta",
    document_type: "salon_owner_guide",
    language: "ta",
    title: "ட்ரிம்மா Salon Owner Handbook",
    description:
      "முழுமையான workspace வழிகாட்டி — profile, bookings, staff, services, finance மற்றும் salon வளர்ச்சி (32 படிகள்).",
    file_path: "salon-owner-guide/trimma-salon-owner-guide-ta.docx",
    file_url: docxPath("ta"),
    file_size_bytes: null,
    version: 1,
    is_published: true,
    download_url: docxPath("ta"),
  },
];

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
          const fallbackPath = docxPath(row.language);
          const rawUrl = row.file_url?.startsWith("http") ? row.file_url : row.file_url || fallbackPath;
          const fileUrl = rawUrl.endsWith(".pdf") ? fallbackPath : rawUrl;
          const fallback = fallbackByLang[row.language];
          return {
            ...row,
            description: row.description || fallback?.description || "",
            file_path: row.file_path?.endsWith(".docx")
              ? row.file_path
              : `salon-owner-guide/trimma-salon-owner-guide-${row.language}.docx`,
            file_url: fileUrl,
            download_url: fileUrl,
            file_size_bytes: row.file_size_bytes ?? fallback?.file_size_bytes ?? null,
          };
        })
      : SALON_OWNER_GUIDE_FALLBACKS;

  if (language) return source.filter((d) => d.language === language);
  return source;
}
