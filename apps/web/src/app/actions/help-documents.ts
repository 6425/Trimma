"use server";

import { createSupabaseAdminClient } from "@/config/supabase-admin";

export type AdminHelpDocument = {
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
  updated_at: string;
};

const FALLBACK_DOCS: AdminHelpDocument[] = [
  {
    id: "fallback-en",
    slug: "booking-guide-en",
    document_type: "booking_guide",
    language: "en",
    title: "Trimma Customer Booking Guide",
    description: "Step-by-step guide for new customers.",
    file_path: "booking-guide/trimma-booking-guide-en.docx",
    file_url: "/help/booking-guide/trimma-booking-guide-en.docx",
    file_size_bytes: null,
    version: 1,
    is_published: true,
    updated_at: new Date().toISOString(),
  },
  {
    id: "fallback-si",
    slug: "booking-guide-si",
    document_type: "booking_guide",
    language: "si",
    title: "ට්‍රිම්මා පාරිභෝගික වෙන්කරණ මාර්ගෝපදේශය",
    description: "නව පාරිභෝගිකයින් සඳහා මාර්ගෝපදේශය.",
    file_path: "booking-guide/trimma-booking-guide-si.docx",
    file_url: "/help/booking-guide/trimma-booking-guide-si.docx",
    file_size_bytes: null,
    version: 1,
    is_published: true,
    updated_at: new Date().toISOString(),
  },
  {
    id: "fallback-ta",
    slug: "booking-guide-ta",
    document_type: "booking_guide",
    language: "ta",
    title: "ட்ரிம்மா வாடிக்கையாளர் முன்பதிவு வழிகாட்டி",
    description: "புதிய வாடிக்கையாளர்களுக்கான வழிகாட்டி.",
    file_path: "booking-guide/trimma-booking-guide-ta.docx",
    file_url: "/help/booking-guide/trimma-booking-guide-ta.docx",
    file_size_bytes: null,
    version: 1,
    is_published: true,
    updated_at: new Date().toISOString(),
  },
];

export async function fetchAdminHelpDocuments(): Promise<
  { success: true; documents: AdminHelpDocument[] } | { success: false; error: string }
> {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("help_documents")
      .select(
        "id, slug, document_type, language, title, description, file_path, file_url, file_size_bytes, version, is_published, updated_at"
      )
      .eq("document_type", "booking_guide")
      .order("language", { ascending: true });

    if (error) {
      if (
        error.message.toLowerCase().includes("does not exist") ||
        error.message.toLowerCase().includes("schema cache")
      ) {
        return { success: true, documents: FALLBACK_DOCS };
      }
      return { success: false, error: error.message };
    }

    const documents = (data || []).map((row) => ({
      ...row,
      file_url: row.file_url || `/help/booking-guide/trimma-booking-guide-${row.language}.docx`,
    })) as AdminHelpDocument[];

    return { success: true, documents: documents.length ? documents : FALLBACK_DOCS };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to load help documents.",
    };
  }
}
