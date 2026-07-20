-- 04_advanced_commissions.sql
-- Add detailed financial tracking and agent association for the 30% reservation fee model

-- 1. Update users table for Agents to store their commission tier (5% to 20%)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS agent_commission_tier DECIMAL(5,2) DEFAULT 10.0;

-- 2. Update salons to directly link the agent who onboarded them (for automatic commission routing)
ALTER TABLE public.salons
  ADD COLUMN IF NOT EXISTS onboarding_agent_id UUID REFERENCES public.users(id) ON DELETE SET NULL;

-- 3. Update bookings to track the granular financial breakdown of the 30% fee
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS total_reservation_fee DECIMAL(10,2) DEFAULT 0.0,
  ADD COLUMN IF NOT EXISTS salon_upfront_amount DECIMAL(10,2) DEFAULT 0.0,
  ADD COLUMN IF NOT EXISTS payhere_fee_amount DECIMAL(10,2) DEFAULT 0.0,
  ADD COLUMN IF NOT EXISTS agent_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS agent_commission_amount DECIMAL(10,2) DEFAULT 0.0,
  ADD COLUMN IF NOT EXISTS agent_commission_percent DECIMAL(5,2) DEFAULT 0.0;
