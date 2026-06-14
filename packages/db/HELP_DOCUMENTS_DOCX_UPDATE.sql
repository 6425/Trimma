-- ==============================================================================
-- TRIMMA: HELP DOCUMENTS — switch booking guides to Word (.docx)
-- Run in Supabase SQL Editor after HELP_DOCUMENTS_PATCH.sql
-- ==============================================================================

BEGIN;

UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]::text[]
WHERE id = 'help-documents';

UPDATE public.help_documents
SET
  file_path = 'booking-guide/trimma-booking-guide-en.docx',
  file_url = '/help/booking-guide/trimma-booking-guide-en.docx',
  version = 2,
  updated_at = NOW()
WHERE slug = 'booking-guide-en';

UPDATE public.help_documents
SET
  file_path = 'booking-guide/trimma-booking-guide-si.docx',
  file_url = '/help/booking-guide/trimma-booking-guide-si.docx',
  version = 2,
  updated_at = NOW()
WHERE slug = 'booking-guide-si';

UPDATE public.help_documents
SET
  file_path = 'booking-guide/trimma-booking-guide-ta.docx',
  file_url = '/help/booking-guide/trimma-booking-guide-ta.docx',
  version = 2,
  updated_at = NOW()
WHERE slug = 'booking-guide-ta';

COMMIT;

SELECT slug, file_url, version FROM public.help_documents WHERE document_type = 'booking_guide';
