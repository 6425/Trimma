-- ==============================================================================
-- TRIMMA: DELETE SALON KECH + SOUTHERN PROVINCE SALONS (schema-safe)
-- ==============================================================================
-- Your DB may not have every optional column/table. This script checks before
-- each DELETE so one missing column does not roll back the whole transaction.
--
-- Run PREVIEW first, then BEGIN … COMMIT as one batch.
-- ==============================================================================

-- ─── QUICK: find Salon Kech ──────────────────────────────────────────────────

SELECT id, name, slug, province, district, city, status, onboarding_status
FROM public.salons
WHERE name ILIKE '%kech%'
ORDER BY name;

-- ─── PREVIEW all targets ─────────────────────────────────────────────────────

SELECT 'SALON DELETE' AS action, id, name, slug, province, district, city, status, onboarding_status
FROM public.salons
WHERE name ILIKE '%kech%'
   OR province ILIKE '%southern%'
   OR district IN
    ('Galle', 'Matara', 'Hambantota')
ORDER BY name;

SELECT 'SALON LEAD DELETE' AS action, id, name, address, status, assign_to
FROM public.salon_leads
WHERE name ILIKE '%kech%'
   OR address ILIKE '%galle%'
   OR address ILIKE '%matara%'
   OR address ILIKE '%hambantota%'
   OR address ILIKE '%southern province%'
ORDER BY name;

-- ─── DELETE (run BEGIN through COMMIT together) ────────────────────────────

BEGIN;

CREATE TEMP TABLE _trimma_southern_salon_ids ON COMMIT DROP AS
SELECT id
FROM public.salons
WHERE name ILIKE '%kech%'
   OR province ILIKE '%southern%'
   OR district IN ('Galle', 'Matara', 'Hambantota');

CREATE TEMP TABLE _trimma_southern_lead_ids ON COMMIT DROP AS
SELECT id
FROM public.salon_leads
WHERE name ILIKE '%kech%'
   OR address ILIKE '%galle%'
   OR address ILIKE '%matara%'
   OR address ILIKE '%hambantota%'
   OR address ILIKE '%southern province%';

DO $$
DECLARE
  t text;
  tables_salon_id text[] := ARRAY[
    'payments',
    'bookings',
    'reviews',
    'staff_reviews',
    'onboarding_logs',
    'customer_ai_memory',
    'salon_analytics',
    'customer_favorite_salons',
    'salon_amenities',
    'salon_promotion_packages',
    'salon_operating_hours',
    'salon_customer_profiles',
    'resources'
  ];
BEGIN
  -- commission_ledger (lead_id)
  IF to_regclass('public.commission_ledger') IS NOT NULL
     AND EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'commission_ledger' AND column_name = 'lead_id'
     ) THEN
    DELETE FROM public.commission_ledger
    WHERE lead_id IN (SELECT id FROM _trimma_southern_lead_ids);
  END IF;

  -- reschedule_requests via bookings
  IF to_regclass('public.reschedule_requests') IS NOT NULL
     AND to_regclass('public.bookings') IS NOT NULL
     AND EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'reschedule_requests' AND column_name = 'booking_id'
     ) THEN
    DELETE FROM public.reschedule_requests
    WHERE booking_id IN (
      SELECT b.id FROM public.bookings b
      WHERE b.salon_id IN (SELECT id FROM _trimma_southern_salon_ids)
    );
  END IF;

  FOREACH t IN ARRAY tables_salon_id LOOP
    IF to_regclass('public.' || t) IS NOT NULL
       AND EXISTS (
         SELECT 1 FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = t AND column_name = 'salon_id'
       ) THEN
      EXECUTE format(
        'DELETE FROM public.%I WHERE salon_id IN (SELECT id FROM _trimma_southern_salon_ids)',
        t
      );
    END IF;
  END LOOP;

  -- agent_activity_logs has NO salon_id — skip (actor_email / agent_email only)
END $$;

DELETE FROM public.salons
WHERE id IN (SELECT id FROM _trimma_southern_salon_ids);

DELETE FROM public.salon_leads
WHERE id IN (SELECT id FROM _trimma_southern_lead_ids);

COMMIT;

NOTIFY pgrst, 'reload schema';

-- ─── VERIFY ──────────────────────────────────────────────────────────────────

SELECT id, name, slug, province, district
FROM public.salons
WHERE name ILIKE '%kech%';

SELECT COUNT(*) AS remaining_southern_salons
FROM public.salons
WHERE name ILIKE '%kech%'
   OR province ILIKE '%southern%'
   OR district IN ('Galle', 'Matara', 'Hambantota');

SELECT id, name, province, district, city, status
FROM public.salons
ORDER BY name;
