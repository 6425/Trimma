-- ==============================================================================
-- TRIMMA: DELETE SALON KECH ONLY (minimal, schema-safe)
-- ==============================================================================
-- Use this if you only need to remove Salon Kech from admin/salons right now.
-- Run the SELECT first, then BEGIN … COMMIT together.
-- ==============================================================================

SELECT id, name, slug, province, district, city, status
FROM public.salons
WHERE name ILIKE '%kech%';

BEGIN;

CREATE TEMP TABLE _kech_salon_ids ON COMMIT DROP AS
SELECT id FROM public.salons WHERE name ILIKE '%kech%';

DO $$
DECLARE
  t text;
  tables_salon_id text[] := ARRAY[
    'payments', 'bookings', 'reviews', 'staff_reviews', 'onboarding_logs',
    'customer_ai_memory', 'salon_analytics', 'customer_favorite_salons',
    'salon_amenities', 'salon_promotion_packages', 'salon_operating_hours',
    'salon_customer_profiles', 'resources'
  ];
BEGIN
  FOREACH t IN ARRAY tables_salon_id LOOP
    IF to_regclass('public.' || t) IS NOT NULL
       AND EXISTS (
         SELECT 1 FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = t AND column_name = 'salon_id'
       ) THEN
      EXECUTE format(
        'DELETE FROM public.%I WHERE salon_id IN (SELECT id FROM _kech_salon_ids)',
        t
      );
    END IF;
  END LOOP;
END $$;

DELETE FROM public.salons WHERE id IN (SELECT id FROM _kech_salon_ids);

DELETE FROM public.salon_leads WHERE name ILIKE '%kech%';

COMMIT;

SELECT id, name FROM public.salons WHERE name ILIKE '%kech%';
