-- Listing generation pipeline: link salon_requests to salons; index listing queue.
-- Safe to re-run.

ALTER TABLE public.salon_requests
  ADD COLUMN IF NOT EXISTS salon_id UUID REFERENCES public.salons (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_salon_requests_salon_id
  ON public.salon_requests (salon_id)
  WHERE salon_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_salons_listing_generation
  ON public.salons (source_type, onboarding_status)
  WHERE source_type = 'LISTING_GENERATION';

COMMENT ON COLUMN public.salon_requests.salon_id IS
  'Linked marketplace listing when admin converts a salon request to booking onboarding.';
