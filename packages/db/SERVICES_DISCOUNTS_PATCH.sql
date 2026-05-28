-- TRIMMA: Salon service discounts (discount_percentage, discount_end_date)
-- Run in Supabase SQL Editor to enable discount fields on salon services.

ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS discount_percentage NUMERIC DEFAULT 0;

ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS discount_end_date TIMESTAMPTZ;

COMMENT ON COLUMN public.services.discount_percentage IS
  'Optional percentage discount (0-100) for this salon service listing.';

COMMENT ON COLUMN public.services.discount_end_date IS
  'Optional end date for the service discount. Null means no expiry.';
