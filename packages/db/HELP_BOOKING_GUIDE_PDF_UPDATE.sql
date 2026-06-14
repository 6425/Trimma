-- ==============================================================================
-- TRIMMA: HELP DOCUMENTS — switch booking guides back to PDF
-- Run in Supabase SQL Editor after HELP_DOCUMENTS_PATCH.sql
-- Static PDFs: apps/web/public/help/booking-guide/trimma-booking-guide-{en,si,ta}.pdf
-- ==============================================================================

BEGIN;

UPDATE public.help_documents
SET
  file_path = 'booking-guide/trimma-booking-guide-en.pdf',
  file_url = '/help/booking-guide/trimma-booking-guide-en.pdf',
  file_size_bytes = 31081,
  version = 3,
  updated_at = NOW()
WHERE slug = 'booking-guide-en';

UPDATE public.help_documents
SET
  file_path = 'booking-guide/trimma-booking-guide-si.pdf',
  file_url = '/help/booking-guide/trimma-booking-guide-si.pdf',
  file_size_bytes = 51531,
  version = 3,
  updated_at = NOW()
WHERE slug = 'booking-guide-si';

UPDATE public.help_documents
SET
  file_path = 'booking-guide/trimma-booking-guide-ta.pdf',
  file_url = '/help/booking-guide/trimma-booking-guide-ta.pdf',
  file_size_bytes = 47865,
  version = 3,
  updated_at = NOW()
WHERE slug = 'booking-guide-ta';

COMMIT;

SELECT slug, language, file_url, file_size_bytes, version
FROM public.help_documents
WHERE document_type = 'booking_guide'
ORDER BY language;
