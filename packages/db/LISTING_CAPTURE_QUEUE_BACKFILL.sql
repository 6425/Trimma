-- One-time backfill: move Google discovery rows into the listing-generation queue.
-- Safe to re-run. Run in Supabase SQL editor on beta/production if captures ran before LISTING_CAPTURED existed.

UPDATE public.salons
SET
  source_type = 'LISTING_GENERATION',
  onboarding_status = 'LISTING_CAPTURED',
  public_visibility = 'hidden',
  booking_enabled = false,
  activation_status = 'INACTIVE',
  updated_at = NOW()
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

-- Preview rows that should appear in Admin → Listing queue after backfill:
-- SELECT id, name, city, onboarding_status, source_type, updated_at
-- FROM public.salons
-- WHERE onboarding_status IN ('LISTING_CAPTURED', 'LISTING_PUBLISHED')
-- ORDER BY updated_at DESC
-- LIMIT 50;
