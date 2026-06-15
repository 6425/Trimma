-- ==============================================================================
-- TRIMMA: Agent guide Sinhala — switch to PDF download
-- Run after HELP_AGENT_GUIDE_V2_UPDATE.sql. Safe to re-run.
-- ==============================================================================

BEGIN;

UPDATE public.help_documents
SET
  file_path = 'agent-guide/trimma-agent-guide-si.pdf',
  file_url = '/help/agent-guide/trimma-agent-guide-si.pdf',
  version = 3,
  updated_at = NOW()
WHERE slug = 'agent-guide-si';

COMMIT;

SELECT slug, language, file_path, file_url, version
FROM public.help_documents
WHERE slug = 'agent-guide-si';
