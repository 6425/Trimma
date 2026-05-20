-- ==============================================================================
-- GLOBAL PAYMENT CONFIGURATION SCHEMAS UPDATE (SELF-HEALING)
-- ==============================================================================
-- Run this script in your Supabase SQL Editor.
-- It establishes a persistent configuration table for PayHere & PayPal Sandbox/Live credentials.
-- ==============================================================================

-- 1. Create table if not exists (base structure)
CREATE TABLE IF NOT EXISTS public.global_payment_settings (
  id UUID PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
  environment TEXT NOT NULL DEFAULT 'sandbox' CHECK (environment IN ('sandbox', 'live')),
  paypal_client_id_sandbox TEXT,
  paypal_client_id_live TEXT,
  payhere_merchant_id TEXT,
  payhere_merchant_secret TEXT,
  payhere_app_id_sandbox TEXT,
  payhere_app_id_live TEXT,
  payhere_app_id TEXT,
  payhere_app_secret TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Dynamically add enable/disable columns in case table was already created from a previous run
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS paypal_enabled BOOLEAN DEFAULT true;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS payhere_enabled BOOLEAN DEFAULT true;

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.global_payment_settings ENABLE ROW LEVEL SECURITY;

-- 4. Set up Policies
DROP POLICY IF EXISTS "Public can read global payment settings" ON public.global_payment_settings;
CREATE POLICY "Public can read global payment settings" ON public.global_payment_settings 
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can update global payment settings" ON public.global_payment_settings;
CREATE POLICY "Admins can update global payment settings" ON public.global_payment_settings 
  FOR ALL USING (true);

-- 5. Insert initial default sandbox record (safe insert/upsert)
INSERT INTO public.global_payment_settings (
  id, 
  environment, 
  paypal_client_id_sandbox, 
  paypal_client_id_live, 
  payhere_merchant_id, 
  payhere_merchant_secret, 
  payhere_app_id_sandbox, 
  payhere_app_id_live,
  payhere_app_id,
  payhere_app_secret,
  paypal_enabled,
  payhere_enabled
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid, 
  'sandbox', 
  'sb', 
  '', 
  '1211149', 
  '4a5s6d7f8g9h', 
  'app1234', 
  '',
  'app1234',
  '',
  true,
  true
) ON CONFLICT (id) DO UPDATE SET
  paypal_enabled = EXCLUDED.paypal_enabled,
  payhere_enabled = EXCLUDED.payhere_enabled;

-- ==============================================================================
-- SECTION F: PAYMENTS TABLE INITIALIZATION & RLS POLICIES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID,
  salon_id UUID,
  provider TEXT,
  provider_payment_id TEXT,
  amount NUMERIC,
  currency TEXT DEFAULT 'LKR',
  status TEXT DEFAULT 'pending',
  raw_response JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can select payments" ON public.payments;
CREATE POLICY "Public can select payments" ON public.payments 
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can insert payments" ON public.payments;
CREATE POLICY "Public can insert payments" ON public.payments 
  FOR INSERT WITH CHECK (true);
