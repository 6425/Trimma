-- Add 'rejection_reason' column to the salons table to store agent and admin rejection comments
ALTER TABLE public.salons
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
