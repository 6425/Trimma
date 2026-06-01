-- This script adds a custom booking disabled message column to the salons table
-- Run this in the Supabase SQL Editor

ALTER TABLE public.salons 
ADD COLUMN IF NOT EXISTS booking_disabled_message TEXT;

COMMENT ON COLUMN public.salons.booking_disabled_message IS 'Optional custom message to display when a salon is unverified and cannot accept bookings. If null, a default verification message is shown.';

-- Example query to update a specific salon's message (Uncomment and replace ID to use)
-- UPDATE public.salons 
-- SET booking_disabled_message = 'We are currently upgrading our facilities. Online bookings will resume next week.' 
-- WHERE id = 'YOUR_SALON_UUID_HERE';
