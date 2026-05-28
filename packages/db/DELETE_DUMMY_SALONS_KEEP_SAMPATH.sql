-- ==============================================================================
-- TRIMMA: DELETE ALL SALONS EXCEPT SAMPATH BARBER SALOON
-- ==============================================================================
-- Run the ENTIRE script below in Supabase SQL Editor (select all, then Run).
-- Keeps any row in public.salons whose name contains "Sampath Barber Saloon"
-- (matches "Sampath Barber Saloon (A/C)" and similar).
-- ==============================================================================

-- ─── PREVIEW (safe to run anytime) ───────────────────────────────────────────

SELECT 'KEEP' AS action, id, name, slug, owner_email, owner_gmail, status, onboarding_status
FROM public.salons
WHERE name ILIKE '%Sampath Barber Saloon%'
ORDER BY name;

SELECT 'DELETE' AS action, id, name, slug, owner_email, status, onboarding_status, created_at
FROM public.salons
WHERE name NOT ILIKE '%Sampath Barber Saloon%'
ORDER BY created_at;

-- ─── DESTRUCTIVE CLEANUP (run everything from BEGIN through COMMIT together) ─

BEGIN;

DO $$
DECLARE
  keep_count integer;
BEGIN
  SELECT COUNT(*) INTO keep_count
  FROM public.salons
  WHERE name ILIKE '%Sampath Barber Saloon%';

  IF keep_count = 0 THEN
    RAISE EXCEPTION 'No salon matched Sampath Barber Saloon. Aborting — check the KEEP preview above and adjust the name filter.';
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.payments') IS NOT NULL THEN
    DELETE FROM public.payments
    WHERE salon_id IN (
      SELECT id FROM public.salons WHERE name NOT ILIKE '%Sampath Barber Saloon%'
    );
  END IF;

  IF to_regclass('public.bookings') IS NOT NULL THEN
    DELETE FROM public.bookings
    WHERE salon_id IN (
      SELECT id FROM public.salons WHERE name NOT ILIKE '%Sampath Barber Saloon%'
    );
  END IF;

  IF to_regclass('public.reviews') IS NOT NULL THEN
    DELETE FROM public.reviews
    WHERE salon_id IN (
      SELECT id FROM public.salons WHERE name NOT ILIKE '%Sampath Barber Saloon%'
    );
  END IF;

  IF to_regclass('public.staff_reviews') IS NOT NULL THEN
    DELETE FROM public.staff_reviews
    WHERE salon_id IN (
      SELECT id FROM public.salons WHERE name NOT ILIKE '%Sampath Barber Saloon%'
    );
  END IF;

  IF to_regclass('public.onboarding_logs') IS NOT NULL THEN
    DELETE FROM public.onboarding_logs
    WHERE salon_id IN (
      SELECT id FROM public.salons WHERE name NOT ILIKE '%Sampath Barber Saloon%'
    );
  END IF;

  IF to_regclass('public.customer_ai_memory') IS NOT NULL THEN
    DELETE FROM public.customer_ai_memory
    WHERE salon_id IN (
      SELECT id FROM public.salons WHERE name NOT ILIKE '%Sampath Barber Saloon%'
    );
  END IF;

  IF to_regclass('public.salon_analytics') IS NOT NULL THEN
    DELETE FROM public.salon_analytics
    WHERE salon_id IN (
      SELECT id FROM public.salons WHERE name NOT ILIKE '%Sampath Barber Saloon%'
    );
  END IF;

  IF to_regclass('public.customer_favorite_salons') IS NOT NULL THEN
    DELETE FROM public.customer_favorite_salons
    WHERE salon_id IN (
      SELECT id FROM public.salons WHERE name NOT ILIKE '%Sampath Barber Saloon%'
    );
  END IF;

  IF to_regclass('public.salon_amenities') IS NOT NULL THEN
    DELETE FROM public.salon_amenities
    WHERE salon_id IN (
      SELECT id FROM public.salons WHERE name NOT ILIKE '%Sampath Barber Saloon%'
    );
  END IF;

  IF to_regclass('public.salon_promotion_packages') IS NOT NULL THEN
    DELETE FROM public.salon_promotion_packages
    WHERE salon_id IN (
      SELECT id FROM public.salons WHERE name NOT ILIKE '%Sampath Barber Saloon%'
    );
  END IF;

  IF to_regclass('public.salon_operating_hours') IS NOT NULL THEN
    DELETE FROM public.salon_operating_hours
    WHERE salon_id IN (
      SELECT id FROM public.salons WHERE name NOT ILIKE '%Sampath Barber Saloon%'
    );
  END IF;

  IF to_regclass('public.resources') IS NOT NULL THEN
    DELETE FROM public.resources
    WHERE salon_id IN (
      SELECT id FROM public.salons WHERE name NOT ILIKE '%Sampath Barber Saloon%'
    );
  END IF;
END $$;

DELETE FROM public.salons
WHERE name NOT ILIKE '%Sampath Barber Saloon%';

DO $$
BEGIN
  IF to_regclass('public.salon_leads') IS NOT NULL THEN
    DELETE FROM public.salon_leads
    WHERE name NOT ILIKE '%Sampath Barber Saloon%';
  END IF;
END $$;

DELETE FROM public.users
WHERE email IN ('owner@crown.com', 'owner@sutra.com', 'owner@vogue.com');

COMMIT;

NOTIFY pgrst, 'reload schema';

SELECT COUNT(*) AS remaining_salon_count FROM public.salons;

SELECT id, name, slug, owner_email, owner_gmail, status, is_verified, onboarding_status
FROM public.salons
ORDER BY name;
