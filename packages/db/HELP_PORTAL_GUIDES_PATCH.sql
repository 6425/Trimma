-- ==============================================================================
-- TRIMMA: AGENT & REGIONAL HEAD PORTAL GUIDE DOCUMENTS
-- ==============================================================================
-- Extends help_documents for agent_guide and regional_head_guide Word downloads.
-- Static files live at apps/web/public/help/agent-guide/ and regional-head-guide/.
-- Run in Supabase SQL Editor after HELP_DOCUMENTS_PATCH.sql. Safe to re-run.
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
    'regional_head_guide'
  ));

INSERT INTO public.help_documents (slug, document_type, language, title, description, file_path, file_url, version)
VALUES
  (
    'agent-guide-en',
    'agent_guide',
    'en',
    'Trimma Agent Portal Guide',
    'Full walkthrough for field agents — onboard salons, invite owners, and earn commissions.',
    'agent-guide/trimma-agent-guide-en.docx',
    '/help/agent-guide/trimma-agent-guide-en.docx',
    1
  ),
  (
    'agent-guide-si',
    'agent_guide',
    'si',
    'ට්‍රිම්මා Agent Portal මාර්ගෝපදේශය',
    'Field agents සඳහා සම්පූර්ණ මාර්ගෝපදේශය — සැලුන් onboard කිරීම, owners ආරාධනා කිරීම, commissions.',
    'agent-guide/trimma-agent-guide-si.docx',
    '/help/agent-guide/trimma-agent-guide-si.docx',
    1
  ),
  (
    'agent-guide-ta',
    'agent_guide',
    'ta',
    'ட்ரிம்மா Agent Portal வழிகாட்டி',
    'Field agents க்கான முழுமையான வழிகாட்டி — சலூன்களை onboard செய்தல், commissions.',
    'agent-guide/trimma-agent-guide-ta.docx',
    '/help/agent-guide/trimma-agent-guide-ta.docx',
    1
  ),
  (
    'regional-head-guide-en',
    'regional_head_guide',
    'en',
    'Trimma Regional Head Portal Guide',
    'Lead your agent team, onboard salons, set commission splits, and grow your territory.',
    'regional-head-guide/trimma-regional-head-guide-en.docx',
    '/help/regional-head-guide/trimma-regional-head-guide-en.docx',
    1
  ),
  (
    'regional-head-guide-si',
    'regional_head_guide',
    'si',
    'ට්‍රිම්මා Regional Head Portal මාර්ගෝපදේශය',
    'Agent කණ්ඩායම නිලවත් කිරීම, සැලුන් onboard කිරීම, commission splits සහ territory වර්ධනය.',
    'regional-head-guide/trimma-regional-head-guide-si.docx',
    '/help/regional-head-guide/trimma-regional-head-guide-si.docx',
    1
  ),
  (
    'regional-head-guide-ta',
    'regional_head_guide',
    'ta',
    'ட்ரிம்மா Regional Head Portal வழிகாட்டி',
    'Agent குழுவை வழிநடத்துதல், சலூன்களை onboard செய்தல், commission splits மற்றும் territory வளர்ச்சி.',
    'regional-head-guide/trimma-regional-head-guide-ta.docx',
    '/help/regional-head-guide/trimma-regional-head-guide-ta.docx',
    1
  )
ON CONFLICT (slug) DO UPDATE SET
  document_type = EXCLUDED.document_type,
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  file_path = EXCLUDED.file_path,
  file_url = EXCLUDED.file_url,
  updated_at = NOW();

COMMIT;

SELECT slug, document_type, language, file_url
FROM public.help_documents
WHERE document_type IN ('agent_guide', 'regional_head_guide')
ORDER BY document_type, language;
