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
  file_format: "pdf";
};

const PDF_BASE = "/help/booking-guide";

function pdfPath(language: string) {
  return `${PDF_BASE}/trimma-booking-guide-${language}.pdf`;
}

export const BOOKING_GUIDE_FALLBACKS: BookingGuideDocument[] = [
  {
    id: "fallback-en",
    slug: "booking-guide-en",
    document_type: "booking_guide",
    language: "en",
    title: "Trimma Customer Booking Guide",
    description:
      "Step-by-step PDF guide to find salons, book appointments, pay your deposit, and leave reviews on Trimma.",
    file_path: "booking-guide/trimma-booking-guide-en.pdf",
    file_url: pdfPath("en"),
    file_size_bytes: 31081,
    version: 3,
    is_published: true,
    download_url: pdfPath("en"),
    file_format: "pdf",
  },
  {
    id: "fallback-si",
    slug: "booking-guide-si",
    document_type: "booking_guide",
    language: "si",
    title: "ට්‍රිම්මා පාරිභෝගික වෙන්කරණ මාර්ගෝපදේශය",
    description:
      "සැලුන් සොයා ගැනීම, වේලාව වෙන්කර ගැනීම, තැන්පතුව ගෙවීම සහ සමාලෝචන ලිවීම පිළිබඳ PDF මාර්ගෝපදේශය.",
    file_path: "booking-guide/trimma-booking-guide-si.pdf",
    file_url: pdfPath("si"),
    file_size_bytes: 51531,
    version: 3,
    is_published: true,
    download_url: pdfPath("si"),
    file_format: "pdf",
  },
  {
    id: "fallback-ta",
    slug: "booking-guide-ta",
    document_type: "booking_guide",
    language: "ta",
    title: "ட்ரிம்மா வாடிக்கையாளர் முன்பதிவு வழிகாட்டி",
    description:
      "சலூன்களைக் கண்டறிதல், நேரம் முன்பதிவு, வைப்புத்தொகை செலுத்துதல் மற்றும் விமர்சனம் எழுதுதல் பற்றிய PDF வழிகாட்டி.",
    file_path: "booking-guide/trimma-booking-guide-ta.pdf",
    file_url: pdfPath("ta"),
    file_size_bytes: 47865,
    version: 3,
    is_published: true,
    download_url: pdfPath("ta"),
    file_format: "pdf",
  },
];

function normalizeBookingGuideUrl(language: string, fileUrl: string | null | undefined): string {
  const pdf = pdfPath(language);
  if (!fileUrl) return pdf;
  if (fileUrl.startsWith("http")) return fileUrl;
  if (fileUrl.endsWith(".docx")) return pdf;
  if (fileUrl.endsWith(".pdf")) return fileUrl.startsWith("/") ? fileUrl : `/${fileUrl}`;
  return pdf;
}

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
  const fallbackByLang = Object.fromEntries(BOOKING_GUIDE_FALLBACKS.map((d) => [d.language, d]));

  const source =
    rows && rows.length > 0
      ? rows.map((row) => {
          const fileUrl = normalizeBookingGuideUrl(row.language, row.file_url);
          const fallback = fallbackByLang[row.language];
          return {
            ...row,
            description: row.description || fallback?.description || "",
            file_path: row.file_path?.endsWith(".pdf")
              ? row.file_path
              : `booking-guide/trimma-booking-guide-${row.language}.pdf`,
            file_url: fileUrl,
            download_url: fileUrl,
            file_size_bytes: row.file_size_bytes ?? fallback?.file_size_bytes ?? null,
            file_format: "pdf" as const,
          };
        })
      : BOOKING_GUIDE_FALLBACKS;

  if (language) return source.filter((d) => d.language === language);
  return source;
}
