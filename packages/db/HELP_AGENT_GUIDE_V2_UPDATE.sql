-- ==============================================================================
-- TRIMMA: AGENT GUIDE V2 — comprehensive 30-step handbook (EN, SI, TA)
-- Run after HELP_PORTAL_GUIDES_PATCH.sql. Safe to re-run.
-- ==============================================================================

BEGIN;

UPDATE public.help_documents
SET
  description = 'Comprehensive field agent handbook — role, salon onboarding, Field Editor, commissions, and daily workflow (30 steps).',
  version = 2,
  updated_at = NOW()
WHERE slug = 'agent-guide-en';

UPDATE public.help_documents
SET
  description = 'සම්පූර්ණ field agent මාර්ගෝපදේශය — role, salon onboarding, Field Editor, commissions (පියවර 30).',
  version = 2,
  updated_at = NOW()
WHERE slug = 'agent-guide-si';

UPDATE public.help_documents
SET
  description = 'முழுமையான field agent வழிகாட்டி — பாத்திரம், salon onboarding, Field Editor, commissions (30 படிகள்).',
  version = 2,
  updated_at = NOW()
WHERE slug = 'agent-guide-ta';

COMMIT;

SELECT slug, language, version, description FROM public.help_documents WHERE document_type = 'agent_guide';
