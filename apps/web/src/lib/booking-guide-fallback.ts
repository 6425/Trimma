export type BookingGuideDocument = {
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
  file_format: "docx";
};

const DOCX_BASE = "/help/booking-guide";

function docxPath(language: string) {
  return `${DOCX_BASE}/trimma-booking-guide-${language}.docx`;
}

export const BOOKING_GUIDE_FALLBACKS: BookingGuideDocument[] = [
  {
    id: "fallback-en",
    slug: "booking-guide-en",
    document_type: "booking_guide",
    language: "en",
    title: "Trimma Customer Booking Guide",
    description:
      "Step-by-step Word guide to find salons, book appointments, pay your deposit, and leave reviews on Trimma.",
    file_path: "booking-guide/trimma-booking-guide-en.docx",
    file_url: docxPath("en"),
    file_size_bytes: null,
    version: 2,
    is_published: true,
    download_url: docxPath("en"),
    file_format: "docx",
  },
  {
    id: "fallback-si",
    slug: "booking-guide-si",
    document_type: "booking_guide",
    language: "si",
    title: "ට්‍රිම්මා පාරිභෝගික වෙන්කරණ මාර්ගෝපදේශය",
    description:
      "සැලුන් සොයා ගැනීම, වේලාව වෙන්කර ගැනීම, තැන්පතුව ගෙවීම සහ සමාලෝචන ලිවීම පිළිබඳ Word මාර්ගෝපදේශය.",
    file_path: "booking-guide/trimma-booking-guide-si.docx",
    file_url: docxPath("si"),
    file_size_bytes: null,
    version: 2,
    is_published: true,
    download_url: docxPath("si"),
    file_format: "docx",
  },
  {
    id: "fallback-ta",
    slug: "booking-guide-ta",
    document_type: "booking_guide",
    language: "ta",
    title: "ட்ரிம்மா வாடிக்கையாளர் முன்பதிவு வழிகாட்டி",
    description:
      "சலூன்களைக் கண்டறிதல், நேரம் முன்பதிவு, வைப்புத்தொகை செலுத்துதல் மற்றும் விமர்சனம் எழுதுதல் பற்றிய Word வழிகாட்டி.",
    file_path: "booking-guide/trimma-booking-guide-ta.docx",
    file_url: docxPath("ta"),
    file_size_bytes: null,
    version: 2,
    is_published: true,
    download_url: docxPath("ta"),
    file_format: "docx",
  },
];

export function resolveBookingGuideDocuments(
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
): BookingGuideDocument[] {
  const source =
    rows && rows.length > 0
      ? rows.map((row) => {
          const fallbackPath = docxPath(row.language);
          const rawUrl = row.file_url?.startsWith("http") ? row.file_url : row.file_url || fallbackPath;
          const fileUrl = rawUrl.endsWith(".pdf") ? fallbackPath : rawUrl;
          return {
            ...row,
            description: row.description || "",
            file_url: fileUrl,
            download_url: fileUrl,
            file_format: "docx" as const,
          };
        })
      : BOOKING_GUIDE_FALLBACKS;

  if (language) return source.filter((d) => d.language === language);
  return source;
}
