-- ==============================================================================
-- TRIMMA: Fix booking commission_master agent_percentage (0 → 20)
-- ==============================================================================
-- Safe to re-run. Updates active booking rows where agent % was seeded as 0.
-- ==============================================================================

BEGIN;

UPDATE public.commission_master
SET agent_percentage = 20.0
WHERE commission_type = 'booking'
  AND active = true
  AND COALESCE(agent_percentage, 0) <= 0;

-- If no booking row exists yet, insert the canonical defaults.
INSERT INTO public.commission_master (
  commission_type,
  platform_percentage,
  salon_percentage,
  agent_percentage,
  payhere_percentage,
  active
)
SELECT 'booking', 10.0, 20.0, 20.0, 3.0, true
WHERE NOT EXISTS (
  SELECT 1 FROM public.commission_master WHERE commission_type = 'booking'
);

COMMIT;

SELECT commission_type, platform_percentage, salon_percentage, agent_percentage, active
FROM public.commission_master
WHERE commission_type = 'booking'
ORDER BY active DESC, created_at DESC
LIMIT 3;
