-- ==============================================================================
-- TRIMMA: SUBSCRIPTION DISCOUNT & PROMOTIONS LIMITS
-- ==============================================================================
-- Target: Supabase SQL Editor
-- Safe for your current schema:
--   subscription_plans.max_promotion_packages (int4) — already exists
--   subscription_plans.feature_flags (jsonb) — already exists
--
-- Sets active promotion package limits per tier:
--   Beginner = 2
--   Starter  = 4
--   Pro      = 6
--   Elite    = 12
--
-- NOTE: You do NOT need to re-run PROMOTION_PACKAGES_PATCH.sql if these
-- tables already exist in your project:
--   promotion_types, global_promotion_packages, salon_promotion_packages
-- ==============================================================================

BEGIN;

-- No-op if column already exists (matches your live schema)
ALTER TABLE public.subscription_plans
  ADD COLUMN IF NOT EXISTS max_promotion_packages INT4;

-- Beginner (formerly Free)
UPDATE public.subscription_plans
SET
  max_promotion_packages = 2,
  feature_flags = COALESCE(feature_flags, '{}'::jsonb)
    || jsonb_build_object('allowed_promotion_types_limit', 2)
WHERE id = 'f0000000-0000-0000-0000-000000000001'::uuid
   OR lower(trim(name)) IN ('beginner', 'free');

-- Starter
UPDATE public.subscription_plans
SET
  max_promotion_packages = 4,
  feature_flags = COALESCE(feature_flags, '{}'::jsonb)
    || jsonb_build_object('allowed_promotion_types_limit', 4)
WHERE id = 'f0000000-0000-0000-0000-000000000002'::uuid
   OR lower(trim(name)) = 'starter';

-- Pro
UPDATE public.subscription_plans
SET
  max_promotion_packages = 6,
  feature_flags = COALESCE(feature_flags, '{}'::jsonb)
    || jsonb_build_object('allowed_promotion_types_limit', 6)
WHERE id = 'f0000000-0000-0000-0000-000000000003'::uuid
   OR lower(trim(name)) = 'pro';

-- Elite
UPDATE public.subscription_plans
SET
  max_promotion_packages = 12,
  feature_flags = COALESCE(feature_flags, '{}'::jsonb)
    || jsonb_build_object('allowed_promotion_types_limit', 12)
WHERE id = 'f0000000-0000-0000-0000-000000000004'::uuid
   OR lower(trim(name)) = 'elite';

COMMIT;

-- Verify results
SELECT
  id,
  name,
  max_staff,
  max_services,
  max_images,
  max_branches,
  max_promotion_packages,
  feature_flags->>'allowed_promotion_types_limit' AS allowed_promotion_types_limit
FROM public.subscription_plans
ORDER BY COALESCE(intro_monthly_price, monthly_price, 0);
