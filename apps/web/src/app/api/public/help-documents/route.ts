import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { resolveBookingGuideDocuments } from "@/lib/booking-guide-fallback";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const documentType = searchParams.get("document_type") || "booking_guide";
  const language = searchParams.get("language");

  try {
    const supabase = createSupabaseAdminClient();
    let query = supabase
      .from("help_documents")
      .select(
        "id, slug, document_type, language, title, description, file_path, file_url, file_size_bytes, version, is_published"
      )
      .eq("is_published", true)
      .eq("document_type", documentType)
      .order("language", { ascending: true });

    if (language) {
      query = query.eq("language", language);
    }

    const { data, error } = await query;

    if (error) {
      console.warn("[public/help-documents] DB fallback:", error.message);
    }

    const documents = resolveBookingGuideDocuments(data, language);
    return NextResponse.json({ documents });
  } catch (error) {
    console.error("[public/help-documents]", error);
    const documents = resolveBookingGuideDocuments(null, language);
    return NextResponse.json({ documents });
  }
}
