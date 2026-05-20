-- SEED_SUBSCRIPTION_PLANS.sql
-- Idempotent script to seed default subscription plans into the database.

-- Ensure all required columns exist in the active database schema
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS monthly_price NUMERIC DEFAULT 0;
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS annual_price NUMERIC DEFAULT 0;
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS max_staff INT DEFAULT 1;
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS max_services INT DEFAULT 10;
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS max_images INT DEFAULT 5;
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS max_branches INT DEFAULT 1;
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS feature_flags JSONB DEFAULT '{}'::jsonb;

-- First, clean up existing default plans to avoid duplicates
DELETE FROM subscription_plans WHERE name IN ('Free', 'Starter', 'Pro', 'Elite');

-- Insert the 4 standard platform tiers with static predictable UUIDs
INSERT INTO subscription_plans (
  id,
  name,
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
  0,
  0,
  2,
  6,
  4,
  0,
  '{"allowed_categories_limit": 2, "features": ["Staff Management", "FB/WA Integration", "Free Gmail", "Free Google Business Page", "Performance Insights", "Salon Dashboard", "Salon Profile Page with QR"]}'::jsonb
),
(
  'f0000000-0000-0000-0000-000000000002',
  'Starter',
  3500,
  35000,
  5,
  12,
  6,
  2,
  '{"allowed_categories_limit": 5, "features": ["Staff Management", "FB/WA Integration", "Free Gmail", "Free Google Business Page", "Performance Insights", "Salon Dashboard", "Salon Profile Page with QR"]}'::jsonb
),
(
  'f0000000-0000-0000-0000-000000000003',
  'Pro',
  7500,
  75000,
  10,
  20,
  12,
  3,
  '{"allowed_categories_limit": 999, "features": ["Staff Management", "FB/WA Integration", "Free Gmail", "Free Google Business Page", "Performance Insights", "Salon Dashboard", "Salon Profile Page with QR"]}'::jsonb
),
(
  'f0000000-0000-0000-0000-000000000004',
  'Elite',
  15000,
  150000,
  30,
  9999,
  30,
  15,
  '{"allowed_categories_limit": 999, "features": ["Staff Management", "FB/WA Integration", "Free Gmail", "Free Google Business Page", "Performance Insights", "Salon Dashboard", "Salon Profile Page with QR"]}'::jsonb
);
