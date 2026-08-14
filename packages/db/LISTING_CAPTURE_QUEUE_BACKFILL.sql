-- One-time backfill: move Google discovery rows into the listing-generation queue.
-- Safe to re-run. salons has created_at but NOT updated_at — do not set updated_at here.

UPDATE public.salons
SET
  source_type = 'LISTING_GENERATION',
  onboarding_status = 'LISTING_CAPTURED',
  public_visibility = 'hidden',
  booking_enabled = false,
  activation_status = 'INACTIVE'
WHERE source_type = 'GOOGLE_PLACES'
  AND COALESCE(onboarding_status, 'DISCOVERED') IN ('DISCOVERED', 'LISTING_CAPTURED')
  AND COALESCE(onboarding_status, '') NOT IN (
    'OWNER_INVITED',
    'ASSIGNED_TO_AGENT',
    'OWNER_ACTIVATED',
    'PENDING_ADMIN_VERIFICATION',
    'VERIFIED',
    'REJECTED',
    'LISTING_PUBLISHED'
  );

-- Optional (only if business_info_extended column exists — see DISCOVERY_SALON_COLUMNS_PATCH.sql):
-- UPDATE public.salons
-- SET business_info_extended = COALESCE(business_info_extended, '{}'::jsonb)
--   || jsonb_build_object('listing_captured_at', to_char(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))
-- WHERE onboarding_status = 'LISTING_CAPTURED'
--   AND source_type = 'LISTING_GENERATION';

-- Preview rows that should appear in Admin → Listing queue after backfill:
-- SELECT id, name, city, onboarding_status, source_type, created_at
-- FROM public.salons
-- WHERE onboarding_status IN ('LISTING_CAPTURED', 'LISTING_PUBLISHED')
-- ORDER BY created_at DESC
-- LIMIT 50;
