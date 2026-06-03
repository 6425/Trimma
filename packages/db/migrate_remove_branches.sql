-- Remove max_branches from subscription_plans table
ALTER TABLE public.subscription_plans DROP COLUMN IF EXISTS max_branches;
