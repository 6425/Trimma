-- TRIMMA: Booking reservation 30% (platform 10% / salon 20%)
-- Live schema only — no effective_to / updated_at
BEGIN;

UPDATE public.commission_master
SET active = false
WHERE commission_type = 'booking'
  AND active = true;

INSERT INTO public.commission_master (
  commission_type,
  platform_percentage,
  salon_percentage,
  agent_percentage,
  payhere_percentage,
  active
)
VALUES ('booking', 10.0, 20.0, 20.0, 3.0, true);

COMMIT;

SELECT
  id,
  commission_type,
  platform_percentage,
  salon_percentage,
  agent_percentage,
  payhere_percentage,
  active,
  created_at
FROM public.commission_master
WHERE commission_type = 'booking'
ORDER BY active DESC, created_at DESC
LIMIT 5;
