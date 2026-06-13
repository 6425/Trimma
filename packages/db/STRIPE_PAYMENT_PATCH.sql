-- ==============================================================================
-- STRIPE PAYMENT GATEWAY PATCH
-- Adds Stripe credentials to global_payment_settings and pending checkout store.
-- Run in Supabase SQL Editor.
-- ==============================================================================

ALTER TABLE public.global_payment_settings
  ADD COLUMN IF NOT EXISTS stripe_publishable_key_sandbox TEXT,
  ADD COLUMN IF NOT EXISTS stripe_publishable_key_live TEXT,
  ADD COLUMN IF NOT EXISTS stripe_secret_key_sandbox TEXT,
  ADD COLUMN IF NOT EXISTS stripe_secret_key_live TEXT,
  ADD COLUMN IF NOT EXISTS stripe_environment TEXT NOT NULL DEFAULT 'sandbox'
    CHECK (stripe_environment IN ('sandbox', 'live')),
  ADD COLUMN IF NOT EXISTS stripe_enabled BOOLEAN DEFAULT true;

CREATE TABLE IF NOT EXISTS public.stripe_checkout_pending (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checkout_type TEXT NOT NULL CHECK (checkout_type IN ('booking', 'subscription')),
  payload JSONB NOT NULL,
  stripe_session_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_stripe_checkout_pending_session
  ON public.stripe_checkout_pending (stripe_session_id);

ALTER TABLE public.stripe_checkout_pending ENABLE ROW LEVEL SECURITY;

-- Service role only (no public access)
DROP POLICY IF EXISTS "Service role manages stripe_checkout_pending" ON public.stripe_checkout_pending;
CREATE POLICY "Service role manages stripe_checkout_pending"
  ON public.stripe_checkout_pending
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
