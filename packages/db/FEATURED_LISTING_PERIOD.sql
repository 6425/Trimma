-- Featured marketplace placement: admin-selected period on listed businesses.
-- Inclusive dates. Public Featured Beauty Business shows the live Featured Batch:
-- is_featured is true AND current date is between featured_starts_at and featured_ends_at.
-- Run in the Supabase SQL Editor for live (and beta if needed).

ALTER TABLE public.salons
  ADD COLUMN IF NOT EXISTS featured_starts_at date,
  ADD COLUMN IF NOT EXISTS featured_ends_at date;

COMMENT ON COLUMN public.salons.featured_starts_at IS
  'Inclusive start date for Featured Beauty Business placement.';
COMMENT ON COLUMN public.salons.featured_ends_at IS
  'Inclusive end date for Featured Beauty Business placement.';

CREATE INDEX IF NOT EXISTS idx_salons_featured_period
  ON public.salons (is_featured, featured_starts_at, featured_ends_at)
  WHERE is_featured IS TRUE;

-- Existing featured flags without a period will not appear publicly until dates are set.
-- Preview:
SELECT id, name, is_featured, featured_starts_at, featured_ends_at
FROM public.salons
WHERE is_featured IS TRUE
ORDER BY name;
