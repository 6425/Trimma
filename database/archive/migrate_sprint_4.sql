-- TRIMMA AI: Sprint 4 Migration Script
-- Purpose: Add global commission management fields to the database.
-- Run this in your Supabase SQL Editor.

-- 1. Add Commission fields to Salons table
ALTER TABLE public.salons 
ADD COLUMN IF NOT EXISTS reservation_commission_percent NUMERIC DEFAULT 10.0,
ADD COLUMN IF NOT EXISTS pending_payout NUMERIC DEFAULT 0.0;

-- 2. Add Commission fields to Bookings table
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS platform_commission_percent NUMERIC DEFAULT 10.0,
ADD COLUMN IF NOT EXISTS salon_payout_amount NUMERIC DEFAULT 0.0;

-- Optional: If you want to automatically calculate salon_payout_amount on booking creation or payment
-- you can set up a trigger, but for now we will assume the application logic handles the math and updating.
