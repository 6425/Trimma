import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/config/supabase-admin";

export type HelpDocumentRow = {
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
  created_at: string;
  updated_at: string;
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const documentType = searchParams.get("document_type") || "booking_guide";
    const language = searchParams.get("language");

    const supabase = createSupabaseAdminClient();
    let query = supabase
      .from("help_documents")
      .select(
        "id, slug, document_type, language, title, description, file_path, file_url, file_size_bytes, version, is_published, created_at, updated_at"
      )
      .eq("is_published", true)
      .eq("document_type", documentType)
      .order("language", { ascending: true });

    if (language) {
      query = query.eq("language", language);
    }

    const { data, error } = await query;

    if (error) {
      if (
        error.message.toLowerCase().includes("does not exist") ||
        error.message.toLowerCase().includes("schema cache")
      ) {
        return NextResponse.json({ documents: fallbackDocuments(language) });
      }
      throw error;
    }

    const documents = (data || []).map((row) => withDownloadUrl(row as HelpDocumentRow));
    return NextResponse.json({ documents });
  } catch (error) {
    console.error("[public/help-documents]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load help documents." },
      { status: 500 }
    );
  }
}

function withDownloadUrl(row: HelpDocumentRow) {
  const fallbackPath = `/help/booking-guide/${row.slug.replace("booking-guide-", "trimma-booking-guide-")}.pdf`;
  const fileUrl = row.file_url || fallbackPath;
  return {
    ...row,
    file_url: fileUrl,
    download_url: fileUrl.startsWith("http") ? fileUrl : fileUrl,
  };
}

function fallbackDocuments(language: string | null) {
  const all = [
    {
      id: "fallback-en",
      slug: "booking-guide-en",
      document_type: "booking_guide",
      language: "en",
      title: "Trimma Customer Booking Guide",
      description: "Step-by-step guide to find salons, book appointments, pay your deposit, and leave reviews on Trimma.",
      file_path: "booking-guide/trimma-booking-guide-en.pdf",
      file_url: "/help/booking-guide/trimma-booking-guide-en.pdf",
      file_size_bytes: null,
      version: 1,
      is_published: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      download_url: "/help/booking-guide/trimma-booking-guide-en.pdf",
    },
    {
      id: "fallback-si",
      slug: "booking-guide-si",
      document_type: "booking_guide",
      language: "si",
      title: "ට්‍රිම්මා පාරිභෝගික වෙන්කරණ මාර්ගෝපදේශය",
      description: "සැලුන් සොයා ගැනීම, වේලාව වෙන්කර ගැනීම, තැන්පතුව ගෙවීම සහ සමාලෝචන ලිවීම පිළිබඳ මාර්ගෝපදේශය.",
      file_path: "booking-guide/trimma-booking-guide-si.pdf",
      file_url: "/help/booking-guide/trimma-booking-guide-si.pdf",
      file_size_bytes: null,
      version: 1,
      is_published: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      download_url: "/help/booking-guide/trimma-booking-guide-si.pdf",
    },
    {
      id: "fallback-ta",
      slug: "booking-guide-ta",
      document_type: "booking_guide",
      language: "ta",
      title: "ட்ரிம்மா வாடிக்கையாளர் முன்பதிவு வழிகாட்டி",
      description: "சலூன்களைக் கண்டறிதல், நேரம் முன்பதிவு, வைப்புத்தொகை செலுத்துதல் மற்றும் விமர்சனம் எழுதுதல் பற்றிய வழிகாட்டி.",
      file_path: "booking-guide/trimma-booking-guide-ta.pdf",
      file_url: "/help/booking-guide/trimma-booking-guide-ta.pdf",
      file_size_bytes: null,
      version: 1,
      is_published: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      download_url: "/help/booking-guide/trimma-booking-guide-ta.pdf",
    },
  ];
  if (language) return all.filter((d) => d.language === language);
  return all;
}
