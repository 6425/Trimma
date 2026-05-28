-- ==============================================================================
-- TRIMMA: DELETE ALL SALONS EXCEPT SAMPATH BARBER SALOON
-- ==============================================================================
-- Run in Supabase SQL Editor.
-- Keeps any row in public.salons whose name contains "Sampath Barber Saloon"
-- (matches "Sampath Barber Saloon (A/C)" and similar).
--
-- STEP 1: Run only the PREVIEW section first and confirm the keep/delete lists.
-- STEP 2: Run the full script (including deletion) once previews look correct.
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

-- ─── DESTRUCTIVE CLEANUP ─────────────────────────────────────────────────────

BEGIN;

CREATE TEMP TABLE _trimma_keep_salons ON COMMIT DROP AS
SELECT id
FROM public.salons
WHERE name ILIKE '%Sampath Barber Saloon%';

CREATE TEMP TABLE _trimma_drop_salons ON COMMIT DROP AS
SELECT id
FROM public.salons
WHERE id NOT IN (SELECT id FROM _trimma_keep_salons);

DO $$
BEGIN
  IF (SELECT COUNT(*) FROM _trimma_keep_salons) = 0 THEN
    RAISE EXCEPTION 'No salon matched "%Sampath Barber Saloon%". Aborting — fix the name filter first.';
  END IF;
END $$;

-- Remove dependent rows that can block deletes (bookings -> services FK, etc.)
DO $$
BEGIN
  IF to_regclass('public.payments') IS NOT NULL THEN
    DELETE FROM public.payments WHERE salon_id IN (SELECT id FROM _trimma_drop_salons);
  END IF;

  IF to_regclass('public.bookings') IS NOT NULL THEN
    DELETE FROM public.bookings WHERE salon_id IN (SELECT id FROM _trimma_drop_salons);
  END IF;

  IF to_regclass('public.reviews') IS NOT NULL THEN
    DELETE FROM public.reviews WHERE salon_id IN (SELECT id FROM _trimma_drop_salons);
  END IF;

  IF to_regclass('public.staff_reviews') IS NOT NULL THEN
    DELETE FROM public.staff_reviews WHERE salon_id IN (SELECT id FROM _trimma_drop_salons);
  END IF;

  IF to_regclass('public.onboarding_logs') IS NOT NULL THEN
    DELETE FROM public.onboarding_logs WHERE salon_id IN (SELECT id FROM _trimma_drop_salons);
  END IF;

  IF to_regclass('public.customer_ai_memory') IS NOT NULL THEN
    DELETE FROM public.customer_ai_memory WHERE salon_id IN (SELECT id FROM _trimma_drop_salons);
  END IF;

  IF to_regclass('public.salon_analytics') IS NOT NULL THEN
    DELETE FROM public.salon_analytics WHERE salon_id IN (SELECT id FROM _trimma_drop_salons);
  END IF;

  IF to_regclass('public.customer_favorite_salons') IS NOT NULL THEN
    DELETE FROM public.customer_favorite_salons WHERE salon_id IN (SELECT id FROM _trimma_drop_salons);
  END IF;

  IF to_regclass('public.salon_amenities') IS NOT NULL THEN
    DELETE FROM public.salon_amenities WHERE salon_id IN (SELECT id FROM _trimma_drop_salons);
  END IF;

  IF to_regclass('public.salon_promotion_packages') IS NOT NULL THEN
    DELETE FROM public.salon_promotion_packages WHERE salon_id IN (SELECT id FROM _trimma_drop_salons);
  END IF;

  IF to_regclass('public.salon_operating_hours') IS NOT NULL THEN
    DELETE FROM public.salon_operating_hours WHERE salon_id IN (SELECT id FROM _trimma_drop_salons);
  END IF;

  IF to_regclass('public.resources') IS NOT NULL THEN
    DELETE FROM public.resources WHERE salon_id IN (SELECT id FROM _trimma_drop_salons);
  END IF;
END $$;

-- CASCADE removes services, salon_staff, and other ON DELETE CASCADE children
DELETE FROM public.salons
WHERE id IN (SELECT id FROM _trimma_drop_salons);

-- Optional: remove scraped pipeline leads that are not Sampath
DO $$
BEGIN
  IF to_regclass('public.salon_leads') IS NOT NULL THEN
    DELETE FROM public.salon_leads
    WHERE name NOT ILIKE '%Sampath Barber Saloon%';
  END IF;
END $$;

-- Optional: remove dummy seed owner accounts from SEED_ACTUAL_SALONS.sql
DELETE FROM public.users
WHERE email IN ('owner@crown.com', 'owner@sutra.com', 'owner@vogue.com');

COMMIT;

NOTIFY pgrst, 'reload schema';

SELECT COUNT(*) AS remaining_salon_count FROM public.salons;

SELECT id, name, slug, owner_email, owner_gmail, status, is_verified, onboarding_status
FROM public.salons
ORDER BY name;
