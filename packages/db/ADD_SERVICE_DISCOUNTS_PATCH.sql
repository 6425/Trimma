-- ADD_SERVICE_DISCOUNTS_PATCH.sql (legacy name)
-- Prefer: packages/db/SERVICES_DISCOUNTS_PATCH.sql

ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS discount_percentage NUMERIC DEFAULT 0;

ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS discount_end_date TIMESTAMPTZ;
