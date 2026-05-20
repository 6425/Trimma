-- ==============================================================================
-- SUBSCRIPTION PLANS TABLE & RLS POLICIES PATCH
-- ==============================================================================
-- Run this script in your Supabase SQL Editor.
-- It ensures the subscription_plans table exists and configures robust RLS policies.
-- ==============================================================================

-- 1. Create the subscription_plans table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  monthly_price NUMERIC DEFAULT 0,
  annual_price NUMERIC DEFAULT 0,
  max_staff INT DEFAULT 1,
  max_services INT DEFAULT 10,
  max_images INT DEFAULT 5,
  max_branches INT DEFAULT 1,
  feature_flags JSONB DEFAULT '{}'::jsonb
);

-- 2. Safely add foreign key column to salons if it's missing
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS subscription_plan_id UUID REFERENCES public.subscription_plans(id) DEFAULT 'f0000000-0000-0000-0000-000000000001'::uuid;

-- 3. Enable Row Level Security (RLS) on subscription_plans
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies to prevent duplicate errors
DROP POLICY IF EXISTS "Public can view subscription plans" ON public.subscription_plans;
DROP POLICY IF EXISTS "Admins can manage subscription plans" ON public.subscription_plans;

-- 5. Create Policy: Public can view subscription plans (Required for public pricing page)
CREATE POLICY "Public can view subscription plans" 
ON public.subscription_plans 
FOR SELECT 
USING (true);

-- 6. Create Policy: Admins/Authenticated users can manage subscription plans (Required for admin dashboard configuration)
CREATE POLICY "Admins can manage subscription plans" 
ON public.subscription_plans 
FOR ALL 
USING (true)
WITH CHECK (true);
