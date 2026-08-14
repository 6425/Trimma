-- Publish existing Google-discovered salons as public SEO listings (browse-only, no booking).
-- Safe to re-run.

UPDATE public.salons
SET
  status = 'active',
  public_visibility = 'public',
  booking_enabled = false,
  is_verified = COALESCE(is_verified, false),
  activation_status = COALESCE(NULLIF(TRIM(activation_status), ''), 'INACTIVE')
WHERE source_type = 'GOOGLE_PLACES'
  AND COALESCE(onboarding_status, 'DISCOVERED') = 'DISCOVERED'
  AND (
    public_visibility IS NULL
    OR public_visibility = 'hidden'
    OR public_visibility = 'false'
    OR public_visibility = '0'
  );

CREATE INDEX IF NOT EXISTS idx_salons_public_listing
  ON public.salons (public_visibility, status, source_type);

CREATE INDEX IF NOT EXISTS idx_salons_place_id_not_null
  ON public.salons (place_id)
  WHERE place_id IS NOT NULL AND btrim(place_id) <> '';
