-- ==============================================================================
-- TRIMMA: Remove unverified marketplace "salon" rows — keep listing pipeline
-- ==============================================================================
-- Purpose
--   Delete legacy / browse-only rows that show as "Not Verified" on SalonCard
--   (is_verified = false, not in booking onboarding, not in listing pipeline).
--
-- KEEPS
--   • Listing pipeline: LISTING_CAPTURED, LISTING_PUBLISHED
--   • Approved / bookable: is_verified = true OR onboarding_status = VERIFIED
--   • Agent booking onboarding in progress (ASSIGNED_TO_AGENT … PENDING_ADMIN_VERIFICATION)
--   • Trimma Demo Salon + Sampath Barber Saloon (adjust filters below if needed)
--
-- REMOVES (typical)
--   • GOOGLE_PLACES + DISCOVERED with public_visibility (old SEO browse cards)
--   • Other unverified rows not in the statuses above
--
-- Run in Supabase SQL Editor:
--   1) Run PREVIEW sections only first and confirm counts/names.
--   2) Run the single DO $$ … END $$; block below (select the whole block).
-- ==============================================================================

-- ─── PREVIEW: rows that will be KEPT ─────────────────────────────────────────

SELECT 'KEEP' AS action,
       id,
       name,
       slug,
       city,
       is_verified,
       onboarding_status,
       source_type,
       public_visibility,
       booking_enabled
FROM public.salons
WHERE
  -- Listing pipeline (Lead Mgmt / listing generation)
  COALESCE(onboarding_status, '') IN ('LISTING_CAPTURED', 'LISTING_PUBLISHED')
  OR COALESCE(is_verified, false) = true
  OR COALESCE(onboarding_status, '') = 'VERIFIED'
  OR COALESCE(onboarding_status, '') IN (
    'ASSIGNED_TO_AGENT',
    'AGENT_VERIFIED',
    'OWNER_INVITED',
    'OWNER_ACTIVATED',
    'PENDING_ADMIN_VERIFICATION',
    'REJECTED',
    'ON_HOLD'
  )
  OR name ILIKE '%Sampath Barber Saloon%'
  OR slug = 'trimma-demo-salon'
  OR name ILIKE 'Trimma Demo Salon%'
ORDER BY onboarding_status, name;

-- ─── PREVIEW: rows that will be DELETED ──────────────────────────────────────

SELECT 'DELETE' AS action,
       id,
       name,
       slug,
       city,
       is_verified,
       onboarding_status,
       source_type,
       public_visibility,
       booking_enabled,
       created_at
FROM public.salons
WHERE
  COALESCE(is_verified, false) = false
  AND COALESCE(onboarding_status, 'DISCOVERED') NOT IN (
    'LISTING_CAPTURED',
    'LISTING_PUBLISHED',
    'VERIFIED',
    'PENDING_ADMIN_VERIFICATION',
    'OWNER_ACTIVATED',
    'OWNER_INVITED',
    'ASSIGNED_TO_AGENT',
    'AGENT_VERIFIED',
    'REJECTED',
    'ON_HOLD'
  )
  AND name NOT ILIKE '%Sampath Barber Saloon%'
  AND slug IS DISTINCT FROM 'trimma-demo-salon'
  AND name NOT ILIKE 'Trimma Demo Salon%'
ORDER BY created_at;

-- Count before delete
SELECT COUNT(*) AS delete_candidate_count
FROM public.salons
WHERE
  COALESCE(is_verified, false) = false
  AND COALESCE(onboarding_status, 'DISCOVERED') NOT IN (
    'LISTING_CAPTURED',
    'LISTING_PUBLISHED',
    'VERIFIED',
    'PENDING_ADMIN_VERIFICATION',
    'OWNER_ACTIVATED',
    'OWNER_INVITED',
    'ASSIGNED_TO_AGENT',
    'AGENT_VERIFIED',
    'REJECTED',
    'ON_HOLD'
  )
  AND name NOT ILIKE '%Sampath Barber Saloon%'
  AND slug IS DISTINCT FROM 'trimma-demo-salon'
  AND name NOT ILIKE 'Trimma Demo Salon%';

-- ─── DESTRUCTIVE CLEANUP ─────────────────────────────────────────────────────
-- Supabase: select and run THIS ENTIRE block only (one execution). Do not run
-- the DO block separately from preview queries above.

DO $$
DECLARE
  target_ids uuid[];
  delete_count integer;
BEGIN
  SELECT COALESCE(array_agg(id), ARRAY[]::uuid[])
  INTO target_ids
  FROM public.salons
  WHERE
    COALESCE(is_verified, false) = false
    AND COALESCE(onboarding_status, 'DISCOVERED') NOT IN (
      'LISTING_CAPTURED',
      'LISTING_PUBLISHED',
      'VERIFIED',
      'PENDING_ADMIN_VERIFICATION',
      'OWNER_ACTIVATED',
      'OWNER_INVITED',
      'ASSIGNED_TO_AGENT',
      'AGENT_VERIFIED',
      'REJECTED',
      'ON_HOLD'
    )
    AND name NOT ILIKE '%Sampath Barber Saloon%'
    AND slug IS DISTINCT FROM 'trimma-demo-salon'
    AND name NOT ILIKE 'Trimma Demo Salon%';

  delete_count := COALESCE(array_length(target_ids, 1), 0);
  IF delete_count = 0 THEN
    RAISE NOTICE 'No unverified non-listing salons matched — nothing to delete.';
    RETURN;
  END IF;

  RAISE NOTICE 'Deleting % unverified salon row(s); listing pipeline rows are preserved.', delete_count;

  IF to_regclass('public.payments') IS NOT NULL THEN
    DELETE FROM public.payments WHERE salon_id = ANY (target_ids);
  END IF;

  IF to_regclass('public.reschedule_requests') IS NOT NULL
     AND to_regclass('public.bookings') IS NOT NULL THEN
    DELETE FROM public.reschedule_requests
    WHERE booking_id IN (
      SELECT b.id FROM public.bookings b WHERE b.salon_id = ANY (target_ids)
    );
  END IF;

  IF to_regclass('public.bookings') IS NOT NULL THEN
    DELETE FROM public.bookings WHERE salon_id = ANY (target_ids);
  END IF;

  IF to_regclass('public.reviews') IS NOT NULL THEN
    DELETE FROM public.reviews WHERE salon_id = ANY (target_ids);
  END IF;

  IF to_regclass('public.staff_reviews') IS NOT NULL THEN
    DELETE FROM public.staff_reviews WHERE salon_id = ANY (target_ids);
  END IF;

  IF to_regclass('public.onboarding_logs') IS NOT NULL THEN
    DELETE FROM public.onboarding_logs WHERE salon_id = ANY (target_ids);
  END IF;

  IF to_regclass('public.customer_ai_memory') IS NOT NULL THEN
    DELETE FROM public.customer_ai_memory WHERE salon_id = ANY (target_ids);
  END IF;

  IF to_regclass('public.salon_analytics') IS NOT NULL THEN
    DELETE FROM public.salon_analytics WHERE salon_id = ANY (target_ids);
  END IF;

  IF to_regclass('public.customer_favorite_salons') IS NOT NULL THEN
    DELETE FROM public.customer_favorite_salons WHERE salon_id = ANY (target_ids);
  END IF;

  IF to_regclass('public.salon_amenities') IS NOT NULL THEN
    DELETE FROM public.salon_amenities WHERE salon_id = ANY (target_ids);
  END IF;

  IF to_regclass('public.salon_promotion_packages') IS NOT NULL THEN
    DELETE FROM public.salon_promotion_packages WHERE salon_id = ANY (target_ids);
  END IF;

  IF to_regclass('public.promotion_packages') IS NOT NULL THEN
    DELETE FROM public.promotion_packages WHERE salon_id = ANY (target_ids);
  END IF;

  IF to_regclass('public.salon_operating_hours') IS NOT NULL THEN
    DELETE FROM public.salon_operating_hours WHERE salon_id = ANY (target_ids);
  END IF;

  IF to_regclass('public.salon_customer_profiles') IS NOT NULL THEN
    DELETE FROM public.salon_customer_profiles WHERE salon_id = ANY (target_ids);
  END IF;

  IF to_regclass('public.resources') IS NOT NULL THEN
    DELETE FROM public.resources WHERE salon_id = ANY (target_ids);
  END IF;

  IF to_regclass('public.facebook_sync_posts') IS NOT NULL THEN
    DELETE FROM public.facebook_sync_posts WHERE salon_id = ANY (target_ids);
  END IF;

  IF to_regclass('public.salon_marketing_campaigns') IS NOT NULL THEN
    DELETE FROM public.salon_marketing_campaigns WHERE salon_id = ANY (target_ids);
  END IF;

  IF to_regclass('public.salon_owner_notifications') IS NOT NULL THEN
    DELETE FROM public.salon_owner_notifications WHERE salon_id = ANY (target_ids);
  END IF;

  IF to_regclass('public.salon_loyalty_rules') IS NOT NULL THEN
    DELETE FROM public.salon_loyalty_rules WHERE salon_id = ANY (target_ids);
  END IF;

  IF to_regclass('public.salon_customer_vip') IS NOT NULL THEN
    DELETE FROM public.salon_customer_vip WHERE salon_id = ANY (target_ids);
  END IF;

  IF to_regclass('public.salon_photos') IS NOT NULL THEN
    DELETE FROM public.salon_photos WHERE salon_id = ANY (target_ids);
  END IF;

  IF to_regclass('public.salon_subscriptions') IS NOT NULL THEN
    DELETE FROM public.salon_subscriptions WHERE salon_id = ANY (target_ids);
  END IF;

  IF to_regclass('public.commissions') IS NOT NULL THEN
    DELETE FROM public.commissions WHERE salon_id = ANY (target_ids);
  END IF;

  IF to_regclass('public.services') IS NOT NULL THEN
    DELETE FROM public.services WHERE salon_id = ANY (target_ids);
  END IF;

  IF to_regclass('public.salon_staff') IS NOT NULL THEN
    DELETE FROM public.salon_staff WHERE salon_id = ANY (target_ids);
  END IF;

  IF to_regclass('public.salon_facebook_integrations') IS NOT NULL THEN
    DELETE FROM public.salon_facebook_integrations WHERE salon_id = ANY (target_ids);
  END IF;

  DELETE FROM public.salons WHERE id = ANY (target_ids);

  RAISE NOTICE 'Done. Deleted % salon row(s).', delete_count;
END $$;

NOTIFY pgrst, 'reload schema';
-- ─── POST-CHECK ───────────────────────────────────────────────────────────────

SELECT COUNT(*) AS remaining_salon_count FROM public.salons;

SELECT onboarding_status, source_type, COUNT(*) AS n
FROM public.salons
GROUP BY onboarding_status, source_type
ORDER BY n DESC, onboarding_status;

SELECT id, name, slug, city, is_verified, onboarding_status, source_type, public_visibility
FROM public.salons
WHERE COALESCE(onboarding_status, '') IN ('LISTING_CAPTURED', 'LISTING_PUBLISHED')
ORDER BY onboarding_status, name
LIMIT 100;
