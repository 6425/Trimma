-- Commission Management Updates

-- 1. Add reservation commission percent to the salons table.
-- This represents the platform's cut of the reservation deposit for this specific salon.
-- Defaulting to 10.0 (10%).
ALTER TABLE public.salons
  ADD COLUMN IF NOT EXISTS reservation_commission_percent DECIMAL DEFAULT 10.0,
  ADD COLUMN IF NOT EXISTS pending_payout DECIMAL DEFAULT 0.0;

-- 2. Add commission tracking columns to bookings table.
-- This freezes the commission calculation at the time of booking so history is not affected if the salon's rate changes later.
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS platform_commission_percent DECIMAL DEFAULT 10.0,
  ADD COLUMN IF NOT EXISTS platform_commission_amount DECIMAL DEFAULT 0.0,
  ADD COLUMN IF NOT EXISTS salon_payout_amount DECIMAL DEFAULT 0.0;
