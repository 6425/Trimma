-- ==============================================================================
-- TRIMMA: HELP DOCUMENTS PATCH
-- ==============================================================================
-- Stores shareable customer help PDFs (booking guides, etc.) in multiple languages.
-- PDF files live in the public `help-documents` storage bucket.
-- Run in Supabase SQL Editor. Safe to re-run.
-- ==============================================================================

BEGIN;

-- 1. Public storage bucket for help PDFs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'help-documents',
  'help-documents',
  true,
  20971520,
  ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public read help documents" ON storage.objects;
CREATE POLICY "Public read help documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'help-documents');

DROP POLICY IF EXISTS "Platform admins manage help documents storage" ON storage.objects;
CREATE POLICY "Platform admins manage help documents storage"
ON storage.objects FOR ALL
USING (bucket_id = 'help-documents' AND public.is_platform_admin())
WITH CHECK (bucket_id = 'help-documents' AND public.is_platform_admin());

-- 2. Metadata table
CREATE TABLE IF NOT EXISTS public.help_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  document_type TEXT NOT NULL DEFAULT 'booking_guide'
    CHECK (document_type IN ('booking_guide', 'cancellation_guide', 'safety_guide', 'general')),
  language TEXT NOT NULL CHECK (language IN ('en', 'si', 'ta')),
  title TEXT NOT NULL,
  description TEXT,
  file_path TEXT NOT NULL,
  file_url TEXT,
  file_size_bytes BIGINT,
  version INT NOT NULL DEFAULT 1,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_help_documents_type_lang
  ON public.help_documents (document_type, language);
CREATE INDEX IF NOT EXISTS idx_help_documents_published
  ON public.help_documents (is_published, document_type);

CREATE OR REPLACE FUNCTION public.touch_help_documents_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_help_documents_updated_at ON public.help_documents;
CREATE TRIGGER trg_help_documents_updated_at
  BEFORE UPDATE ON public.help_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_help_documents_updated_at();

ALTER TABLE public.help_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read published help documents" ON public.help_documents;
CREATE POLICY "Public read published help documents"
ON public.help_documents FOR SELECT
USING (is_published = true);

DROP POLICY IF EXISTS "Platform admins manage help_documents" ON public.help_documents;
CREATE POLICY "Platform admins manage help_documents"
ON public.help_documents FOR ALL
USING (public.is_platform_admin())
WITH CHECK (public.is_platform_admin());

-- 3. Seed booking guide placeholders (file_url updated after PDF upload)
INSERT INTO public.help_documents (slug, document_type, language, title, description, file_path, file_url, version)
VALUES
  (
    'booking-guide-en',
    'booking_guide',
    'en',
    'Trimma Customer Booking Guide',
    'Step-by-step guide to find salons, book appointments, pay your deposit, and leave reviews on Trimma.',
    'booking-guide/trimma-booking-guide-en.pdf',
    '/help/booking-guide/trimma-booking-guide-en.pdf',
    1
  ),
  (
    'booking-guide-si',
    'booking_guide',
    'si',
    'ට්‍රිම්මා පාරිභෝගික වෙන්කරණ මාර්ගෝපදේශය',
    'සැලුන් සොයා ගැනීම, වේලාව වෙන්කර ගැනීම, තැන්පතුව ගෙවීම සහ සමාලෝචන ලිවීම පිළිබඳ පියවරෙන් පියවර මාර්ගෝපදේශය.',
    'booking-guide/trimma-booking-guide-si.pdf',
    '/help/booking-guide/trimma-booking-guide-si.pdf',
    1
  ),
  (
    'booking-guide-ta',
    'booking_guide',
    'ta',
    'ட்ரிம்மா வாடிக்கையாளர் முன்பதிவு வழிகாட்டி',
    'சலூன்களைக் கண்டறிதல், நேரம் முன்பதிவு செய்தல், வைப்புத்தொகை செலுத்துதல் மற்றும் விமர்சனம் எழுதுதல் பற்றிய படிப்படியான வழிகாட்டி.',
    'booking-guide/trimma-booking-guide-ta.pdf',
    '/help/booking-guide/trimma-booking-guide-ta.pdf',
    1
  )
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  file_path = EXCLUDED.file_path,
  updated_at = NOW();

COMMIT;

SELECT 'help_documents table, storage bucket, and seed rows applied.' AS status;
