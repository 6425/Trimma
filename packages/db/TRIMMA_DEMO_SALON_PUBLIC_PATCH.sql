-- ==============================================================================
-- TRIMMA: Enable Trimma Demo Salon on public marketplace + booking
-- ==============================================================================
-- Safe to run multiple times. Matches slug trimma-demo-salon or exact name.
-- Run in Supabase SQL Editor (beta / production as needed).
-- ==============================================================================

-- Preview current row
SELECT id, name, slug, status, is_verified, booking_enabled, public_visibility,
       phone, owner_email, owner_gmail, onboarding_status, activation_status
FROM public.salons
WHERE slug = 'trimma-demo-salon'
   OR name ILIKE 'Trimma Demo Salon%';

BEGIN;

UPDATE public.salons
SET
  status = 'active',
  is_verified = true,
  booking_enabled = true,
  public_visibility = 'public',
  activation_status = COALESCE(NULLIF(TRIM(activation_status), ''), 'ACTIVE'),
  onboarding_status = COALESCE(NULLIF(TRIM(onboarding_status), ''), 'VERIFIED'),
  phone = CASE
    WHEN phone IS NULL OR length(regexp_replace(phone, '\D', '', 'g')) < 9
      THEN '+94712205515'
    ELSE phone
  END,
  owner_email = CASE
    WHEN owner_email IS NULL
      OR TRIM(owner_email) = ''
      OR owner_email ILIKE '%draft-%'
      THEN COALESCE(
        NULLIF(TRIM(owner_gmail), ''),
        NULLIF(TRIM(owner_email), ''),
        'demo@trimma.io'
      )
    ELSE owner_email
  END
WHERE slug = 'trimma-demo-salon'
   OR name ILIKE 'Trimma Demo Salon%';

UPDATE public.services
SET status = 'active'
WHERE salon_id IN (
  SELECT id FROM public.salons
  WHERE slug = 'trimma-demo-salon' OR name ILIKE 'Trimma Demo Salon%'
)
AND COALESCE(status, '') <> 'active';

UPDATE public.salon_staff
SET status = 'active'
WHERE salon_id IN (
  SELECT id FROM public.salons
  WHERE slug = 'trimma-demo-salon' OR name ILIKE 'Trimma Demo Salon%'
)
AND COALESCE(status, '') <> 'active';

COMMIT;

NOTIFY pgrst, 'reload schema';

SELECT id, name, slug, status, is_verified, booking_enabled, public_visibility, phone, owner_email
FROM public.salons
WHERE slug = 'trimma-demo-salon'
   OR name ILIKE 'Trimma Demo Salon%';

SELECT COUNT(*) AS active_services
FROM public.services
WHERE salon_id IN (
  SELECT id FROM public.salons
  WHERE slug = 'trimma-demo-salon' OR name ILIKE 'Trimma Demo Salon%'
)
AND status = 'active';
