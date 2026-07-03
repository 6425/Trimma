-- ==============================================================================
-- TRIMMA: SALON OWNER HANDBOOK DOCUMENTS (PDF)
-- ==============================================================================
-- Static files: apps/web/public/help/salon-owner-guide/trimma-salon-owner-guide-{en,si,ta}.pdf
-- Run after HELP_DOCUMENTS_PATCH.sql. Safe to re-run.
-- ==============================================================================

BEGIN;

ALTER TABLE public.help_documents DROP CONSTRAINT IF EXISTS help_documents_document_type_check;
ALTER TABLE public.help_documents ADD CONSTRAINT help_documents_document_type_check
  CHECK (document_type IN (
    'booking_guide',
    'cancellation_guide',
    'safety_guide',
    'general',
    'agent_guide',
    'regional_head_guide',
    'salon_owner_guide'
  ));

INSERT INTO public.help_documents (slug, document_type, language, title, description, file_path, file_url, version)
VALUES
  (
    'salon-owner-guide-en',
    'salon_owner_guide',
    'en',
    'Trimma Salon Owner Handbook',
    'Comprehensive workspace guide — profile, bookings, staff, services, finance, and growing your salon on Trimma (32 steps).',
    'salon-owner-guide/trimma-salon-owner-guide-en.pdf',
    '/help/salon-owner-guide/trimma-salon-owner-guide-en.pdf',
    2
  ),
  (
    'salon-owner-guide-si',
    'salon_owner_guide',
    'si',
    'ට්‍රිම්මා Salon Owner Handbook',
    'සම්පූර්ණ workspace මාර්ගෝපදේශය — profile, bookings, staff, services, finance සහ salon වර්ධනය (පියවර 32).',
    'salon-owner-guide/trimma-salon-owner-guide-si.pdf',
    '/help/salon-owner-guide/trimma-salon-owner-guide-si.pdf',
    2
  ),
  (
    'salon-owner-guide-ta',
    'salon_owner_guide',
    'ta',
    'ட்ரிம்மா Salon Owner Handbook',
    'முழுமையான workspace வழிகாட்டி — profile, bookings, staff, services, finance மற்றும் salon வளர்ச்சி (32 படிகள்).',
    'salon-owner-guide/trimma-salon-owner-guide-ta.pdf',
    '/help/salon-owner-guide/trimma-salon-owner-guide-ta.pdf',
    2
  )
ON CONFLICT (slug) DO UPDATE SET
  document_type = EXCLUDED.document_type,
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  file_path = EXCLUDED.file_path,
  file_url = EXCLUDED.file_url,
  version = EXCLUDED.version,
  updated_at = NOW();

COMMIT;

SELECT slug, document_type, language, file_url, version
FROM public.help_documents
WHERE document_type = 'salon_owner_guide'
ORDER BY language;
