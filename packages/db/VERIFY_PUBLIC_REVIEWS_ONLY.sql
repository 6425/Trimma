-- ==============================================================================
-- TRIMMA: PUBLIC REVIEWS = VERIFIED BOOKING REVIEWS ONLY
-- ==============================================================================
-- Run in Supabase SQL Editor (safe to re-run).
-- Hides legacy non-booking reviews from public stats and RLS.
-- ==============================================================================

BEGIN;

UPDATE public.reviews
SET status = 'hidden', updated_at = NOW()
WHERE booking_id IS NULL
  AND COALESCE(status, 'published') = 'published';

CREATE OR REPLACE FUNCTION public.refresh_salon_review_stats(p_salon_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.salons s
  SET
    rating = COALESCE((
      SELECT ROUND(AVG(r.rating)::numeric, 1)
      FROM public.reviews r
      WHERE r.salon_id = p_salon_id
        AND r.booking_id IS NOT NULL
        AND COALESCE(r.status, 'published') = 'published'
    ), 0),
    review_count = (
      SELECT COUNT(*)
      FROM public.reviews r
      WHERE r.salon_id = p_salon_id
        AND r.booking_id IS NOT NULL
        AND COALESCE(r.status, 'published') = 'published'
    )
  WHERE s.id = p_salon_id;
END;
$$;

DROP POLICY IF EXISTS "Public can view published reviews" ON public.reviews;

CREATE POLICY "Public can view published reviews"
  ON public.reviews FOR SELECT
  USING (
    booking_id IS NOT NULL
    AND COALESCE(status, 'published') = 'published'
  );

UPDATE public.salons s
SET
  rating = COALESCE((
    SELECT ROUND(AVG(r.rating)::numeric, 1)
    FROM public.reviews r
    WHERE r.salon_id = s.id
      AND r.booking_id IS NOT NULL
      AND COALESCE(r.status, 'published') = 'published'
  ), 0),
  review_count = (
    SELECT COUNT(*)
    FROM public.reviews r
    WHERE r.salon_id = s.id
      AND r.booking_id IS NOT NULL
      AND COALESCE(r.status, 'published') = 'published'
  );

COMMIT;

NOTIFY pgrst, 'reload schema';

SELECT
  (SELECT count(*) FROM public.reviews WHERE booking_id IS NOT NULL AND COALESCE(status, 'published') = 'published') AS verified_public_reviews,
  (SELECT count(*) FROM public.reviews WHERE booking_id IS NULL) AS legacy_unlinked_reviews,
  'Verified-only public reviews enforced' AS status;
