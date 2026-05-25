-- SEED_SUBSCRIPTION_PLANS.sql
-- Idempotent script to seed default subscription plans with introduction pricing.

ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS list_monthly_price NUMERIC DEFAULT 0;
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS intro_monthly_price NUMERIC DEFAULT 0;
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS monthly_price NUMERIC DEFAULT 0;
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS annual_price NUMERIC DEFAULT 0;
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS max_staff INT DEFAULT 1;
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS max_services INT DEFAULT 10;
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS max_images INT DEFAULT 5;
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS max_branches INT DEFAULT 1;
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS feature_flags JSONB DEFAULT '{}'::jsonb;

DELETE FROM subscription_plans WHERE name IN ('Free', 'Starter', 'Pro', 'Elite');

INSERT INTO subscription_plans (
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
);
