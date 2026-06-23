-- ==============================================================================
-- TRIMMA: SALON MARKETING CAMPAIGNS (VIP promo broadcast log)
-- ==============================================================================
-- Run in Supabase SQL Editor (safe to re-run).
-- Logs one-click VIP promotion sends from /dashboard/marketing.
-- Does not alter bookings, packages, or checkout flows.
-- ==============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.salon_marketing_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  promotion_package_id UUID REFERENCES public.salon_promotion_packages(id) ON DELETE SET NULL,
  campaign_name TEXT NOT NULL,
  audience TEXT NOT NULL DEFAULT 'vip',
  channels TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  message_preview TEXT,
  recipients_targeted INT NOT NULL DEFAULT 0,
  whatsapp_sent INT NOT NULL DEFAULT 0,
  email_sent INT NOT NULL DEFAULT 0,
  whatsapp_skipped INT NOT NULL DEFAULT 0,
  email_skipped INT NOT NULL DEFAULT 0,
  whatsapp_failed INT NOT NULL DEFAULT 0,
  email_failed INT NOT NULL DEFAULT 0,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_salon_marketing_campaigns_salon_id
  ON public.salon_marketing_campaigns (salon_id);

CREATE INDEX IF NOT EXISTS idx_salon_marketing_campaigns_salon_created
  ON public.salon_marketing_campaigns (salon_id, created_at DESC);

ALTER TABLE public.salon_marketing_campaigns ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.salon_marketing_campaigns
  ADD COLUMN IF NOT EXISTS telegram_sent INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS telegram_skipped INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS telegram_failed INT NOT NULL DEFAULT 0;

COMMIT;

NOTIFY pgrst, 'reload schema';

SELECT 'salon_marketing_campaigns ready' AS status;
