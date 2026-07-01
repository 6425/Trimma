-- ==============================================================================
-- TRIMMA: Salon staff aggregate ratings from verified booking reviews
-- ==============================================================================
-- Prerequisite: STAFF_REVIEWS_PATCH.sql (staff_reviews.booking_id)
-- Safe to re-run.
-- ==============================================================================

BEGIN;

ALTER TABLE public.salon_staff
  ADD COLUMN IF NOT EXISTS average_rating NUMERIC(3, 2);

ALTER TABLE public.salon_staff
  ADD COLUMN IF NOT EXISTS review_count INTEGER NOT NULL DEFAULT 0;

UPDATE public.salon_staff ss
SET
  review_count = stats.review_count,
  average_rating = stats.average_rating
FROM (
  SELECT
    sr.staff_id,
    COUNT(*)::INTEGER AS review_count,
    ROUND(AVG(sr.rating)::NUMERIC, 1) AS average_rating
  FROM public.staff_reviews sr
  WHERE sr.staff_id IS NOT NULL
    AND sr.booking_id IS NOT NULL
  GROUP BY sr.staff_id
) AS stats
WHERE ss.id = stats.staff_id;

COMMIT;

NOTIFY pgrst, 'reload schema';
