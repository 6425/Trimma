-- ==============================================================================
-- TRIMMA: Rename Free → Beginner (paid entry tier @ LKR 2250, 25% intro)
-- ==============================================================================
-- Target: Supabase SQL Editor (production / staging)
--
-- Pricing model (matches other packages):
--   list_monthly_price  = 3000  (standard monthly)
--   intro_monthly_price = 2250  (25% off list → monthly checkout amount)
--   monthly_price       = 2250  (legacy sync with intro)
--   annual_price        = 21600 (intro × 0.8 × 12; annual monthly equiv 1800)
--   discount_percentage = 25
--
-- Keeps the same plan UUID so existing salon.subscription_plan_id FKs stay valid.
-- Stripe/PayHere subscription checkout uses dynamic amounts from these columns
-- (no hardcoded Stripe Price IDs in app code).
-- ==============================================================================

BEGIN;

ALTER TABLE public.subscription_plans
  ADD COLUMN IF NOT EXISTS list_monthly_price NUMERIC DEFAULT 0;
ALTER TABLE public.subscription_plans
  ADD COLUMN IF NOT EXISTS intro_monthly_price NUMERIC DEFAULT 0;
ALTER TABLE public.subscription_plans
  ADD COLUMN IF NOT EXISTS monthly_price NUMERIC DEFAULT 0;
ALTER TABLE public.subscription_plans
  ADD COLUMN IF NOT EXISTS annual_price NUMERIC DEFAULT 0;
ALTER TABLE public.subscription_plans
  ADD COLUMN IF NOT EXISTS discount_percentage NUMERIC DEFAULT 0;

-- Rename + reprice entry tier (by id OR legacy name)
UPDATE public.subscription_plans
SET
  name = 'Beginner',
  list_monthly_price = 3000,
  intro_monthly_price = 2250,
  monthly_price = 2250,
  annual_price = 21600,
  discount_percentage = 25
WHERE id = 'f0000000-0000-0000-0000-000000000001'::uuid
   OR lower(trim(name)) = 'free'
   OR lower(trim(name)) = 'beginner';

-- Upsert canonical Beginner row if missing
INSERT INTO public.subscription_plans (
  id,
  name,
  list_monthly_price,
  intro_monthly_price,
  monthly_price,
  annual_price,
  discount_percentage,
  max_staff,
  max_services,
  max_images,
  max_branches,
  feature_flags
) VALUES (
  'f0000000-0000-0000-0000-000000000001',
  'Beginner',
  3000,
  2250,
  2250,
  21600,
  25,
  2,
  6,
  3,
  0,
  '{"allowed_categories_limit": 2, "allowed_promotion_types_limit": 2, "features": ["Staff Management", "FB/WA Integration", "Free Gmail Integration", "Free Google Business Page", "Performance Insights", "Salon Dashboard with QR"]}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  list_monthly_price = EXCLUDED.list_monthly_price,
  intro_monthly_price = EXCLUDED.intro_monthly_price,
  monthly_price = EXCLUDED.monthly_price,
  annual_price = EXCLUDED.annual_price,
  discount_percentage = EXCLUDED.discount_percentage;

COMMIT;

SELECT
  id,
  name,
  list_monthly_price,
  intro_monthly_price,
  monthly_price,
  annual_price,
  discount_percentage,
  round(annual_price / 12, 2) AS annual_monthly_rate
FROM public.subscription_plans
WHERE id = 'f0000000-0000-0000-0000-000000000001'::uuid
   OR lower(trim(name)) IN ('beginner', 'free', 'starter', 'pro', 'elite')
ORDER BY monthly_price;
