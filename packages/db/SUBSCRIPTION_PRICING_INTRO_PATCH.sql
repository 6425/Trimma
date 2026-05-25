-- ==============================================================================
-- TRIMMA PLATFORM: SUBSCRIPTION INTRODUCTION PRICING PATCH
-- ==============================================================================
-- Target: Supabase SQL Editor
--
-- Pricing model:
--   list_monthly_price  = standard monthly rate
--   intro_monthly_price = 25% introduction discount (monthly billing)
--   monthly_price       = kept in sync with intro_monthly_price (legacy apps)
--   annual_price        = annual monthly rate × 12
--
--   Free:    0 / 0 / 0
--   Starter: 5000 list → 3750 intro → 3000×12 = 36,000 annual
--   Pro:     10000 list → 7500 intro → 5000×12 = 60,000 annual
--   Elite:   10000 list → 7500 intro → 5000×12 = 60,000 annual
-- ==============================================================================

BEGIN;

ALTER TABLE public.subscription_plans ADD COLUMN IF NOT EXISTS list_monthly_price NUMERIC DEFAULT 0;
ALTER TABLE public.subscription_plans ADD COLUMN IF NOT EXISTS intro_monthly_price NUMERIC DEFAULT 0;

-- Free
UPDATE public.subscription_plans
SET
  list_monthly_price = 0,
  intro_monthly_price = 0,
  monthly_price = 0,
  annual_price = 0
WHERE id = 'f0000000-0000-0000-0000-000000000001'::uuid
   OR lower(name) = 'free';

-- Starter
UPDATE public.subscription_plans
SET
  list_monthly_price = 5000,
  intro_monthly_price = 3750,
  monthly_price = 3750,
  annual_price = 36000
WHERE id = 'f0000000-0000-0000-0000-000000000002'::uuid
   OR lower(name) = 'starter';

-- Pro
UPDATE public.subscription_plans
SET
  list_monthly_price = 10000,
  intro_monthly_price = 7500,
  monthly_price = 7500,
  annual_price = 60000
WHERE id = 'f0000000-0000-0000-0000-000000000003'::uuid
   OR lower(name) = 'pro';

-- Elite
UPDATE public.subscription_plans
SET
  list_monthly_price = 10000,
  intro_monthly_price = 7500,
  monthly_price = 7500,
  annual_price = 60000
WHERE id = 'f0000000-0000-0000-0000-000000000004'::uuid
   OR lower(name) = 'elite';

-- Upsert canonical rows if missing (safe for fresh databases)
INSERT INTO public.subscription_plans (
  id,
  name,
  list_monthly_price,
  intro_monthly_price,
  monthly_price,
  annual_price,
  max_staff,
  max_services,
  max_images,
  max_branches,
  feature_flags
) VALUES
(
  'f0000000-0000-0000-0000-000000000001',
  'Free',
  0, 0, 0, 0,
  2, 6, 3, 0,
  '{"allowed_categories_limit": 2, "features": ["Staff Management", "FB/WA Integration", "Free Gmail Integration", "Free Google Business Page", "Performance Insights", "Salon Dashboard with QR"]}'::jsonb
),
(
  'f0000000-0000-0000-0000-000000000002',
  'Starter',
  5000, 3750, 3750, 36000,
  5, 12, 6, 2,
  '{"allowed_categories_limit": 5, "features": ["Staff Management", "FB/WA Integration", "Free Gmail Integration", "Free Google Business Page", "Performance Insights", "Salon Dashboard with QR", "Advanced SEO Optimization"]}'::jsonb
),
(
  'f0000000-0000-0000-0000-000000000003',
  'Pro',
  10000, 7500, 7500, 60000,
  10, 20, 12, 3,
  '{"allowed_categories_limit": 999, "features": ["Staff Management", "FB/WA Integration", "Free Gmail Integration", "Free Google Business Page", "Performance Insights", "Salon Dashboard with QR", "Advanced SEO Optimization", "Dedicated Priority Support", "Multi-location Syncing"]}'::jsonb
),
(
  'f0000000-0000-0000-0000-000000000004',
  'Elite',
  10000, 7500, 7500, 60000,
  30, 9999, 30, 15,
  '{"allowed_categories_limit": 999, "features": ["Staff Management", "FB/WA Integration", "Free Gmail Integration", "Free Google Business Page", "Performance Insights", "Salon Dashboard with QR", "Advanced SEO Optimization", "Dedicated Priority Support", "Multi-location Syncing", "White-label Client Apps", "24/7 Phone Concierge"]}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  list_monthly_price = EXCLUDED.list_monthly_price,
  intro_monthly_price = EXCLUDED.intro_monthly_price,
  monthly_price = EXCLUDED.monthly_price,
  annual_price = EXCLUDED.annual_price,
  max_staff = EXCLUDED.max_staff,
  max_services = EXCLUDED.max_services,
  max_images = EXCLUDED.max_images,
  max_branches = EXCLUDED.max_branches,
  feature_flags = EXCLUDED.feature_flags;

COMMIT;

SELECT
  name,
  list_monthly_price,
  intro_monthly_price,
  monthly_price,
  annual_price,
  round(annual_price / 12, 2) AS annual_monthly_rate
FROM public.subscription_plans
ORDER BY monthly_price;
