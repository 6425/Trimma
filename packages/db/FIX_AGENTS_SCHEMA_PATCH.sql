-- ==============================================================================
-- FIX AGENTS SCHEMA & MISSING ID COLUMN PATCH
-- Safely adds the missing 'id' column and ensures database alignment
-- Run this in your Supabase SQL Editor.
-- ==============================================================================

-- 1. Safely add the 'id' column as a UUID if it was skipped during migration
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();

-- 2. Ensure all existing rows have a valid unique UUID populated
UPDATE public.agents SET id = gen_random_uuid() WHERE id IS NULL;

-- 3. Ensure all other required columns exist
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS user_email TEXT REFERENCES public.users(email) ON DELETE CASCADE;
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS territory_id UUID REFERENCES public.territories(id);
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS commission_rate NUMERIC DEFAULT 0;
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
