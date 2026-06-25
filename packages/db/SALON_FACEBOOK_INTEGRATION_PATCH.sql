-- ==============================================================================
-- TRIMMA: SALON FACEBOOK PAGE INTEGRATION
-- ==============================================================================
-- Run in Supabase SQL Editor (safe to re-run).
-- Stores per-salon Facebook Page OAuth tokens and booking CTA preferences
-- for /dashboard/social → Facebook Booking Page.
-- ==============================================================================

BEGIN;

ALTER TABLE public.salons
  ADD COLUMN IF NOT EXISTS social_settings JSONB DEFAULT '{
    "facebook_connected": false,
    "instagram_connected": false,
    "whatsapp_connected": false,
    "google_maps_connected": false
  }'::jsonb;

CREATE TABLE IF NOT EXISTS public.salon_facebook_integrations (
  salon_id UUID PRIMARY KEY REFERENCES public.salons(id) ON DELETE CASCADE,
  facebook_page_url TEXT,
  facebook_page_id TEXT,
  facebook_page_name TEXT,
  facebook_page_access_token TEXT,
  facebook_user_access_token TEXT,
  facebook_connected BOOLEAN NOT NULL DEFAULT false,
  facebook_connected_at TIMESTAMPTZ,
  booking_cta_enabled BOOLEAN NOT NULL DEFAULT true,
  booking_cta_label TEXT NOT NULL DEFAULT 'Book Now',
  auto_publish_promos BOOLEAN NOT NULL DEFAULT false,
  pending_pages JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_salon_facebook_integrations_connected
  ON public.salon_facebook_integrations (facebook_connected)
  WHERE facebook_connected = true;

ALTER TABLE public.salon_facebook_integrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS salon_facebook_integrations_owner_select ON public.salon_facebook_integrations;
CREATE POLICY salon_facebook_integrations_owner_select
  ON public.salon_facebook_integrations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.salons s
      WHERE s.id = salon_facebook_integrations.salon_id
        AND (
          lower(coalesce(s.owner_email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
          OR lower(coalesce(s.email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
        )
    )
  );

DROP POLICY IF EXISTS salon_facebook_integrations_owner_update ON public.salon_facebook_integrations;
CREATE POLICY salon_facebook_integrations_owner_update
  ON public.salon_facebook_integrations
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.salons s
      WHERE s.id = salon_facebook_integrations.salon_id
        AND (
          lower(coalesce(s.owner_email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
          OR lower(coalesce(s.email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
        )
    )
  );

DROP POLICY IF EXISTS salon_facebook_integrations_owner_insert ON public.salon_facebook_integrations;
CREATE POLICY salon_facebook_integrations_owner_insert
  ON public.salon_facebook_integrations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.salons s
      WHERE s.id = salon_facebook_integrations.salon_id
        AND (
          lower(coalesce(s.owner_email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
          OR lower(coalesce(s.email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
        )
    )
  );

-- Migrate legacy JSONB tokens from salons.social_settings when present.
INSERT INTO public.salon_facebook_integrations (
  salon_id,
  facebook_page_url,
  facebook_page_id,
  facebook_page_name,
  facebook_page_access_token,
  facebook_user_access_token,
  facebook_connected,
  facebook_connected_at,
  pending_pages,
  updated_at
)
SELECT
  s.id,
  NULLIF(trim(coalesce(s.social_settings ->> 'facebook_page_url', '')), ''),
  NULLIF(trim(coalesce(s.social_settings ->> 'facebook_page_id', '')), ''),
  NULLIF(trim(coalesce(s.social_settings ->> 'facebook_page_name', '')), ''),
  NULLIF(trim(coalesce(s.social_settings ->> 'facebook_page_access_token', '')), ''),
  NULLIF(trim(coalesce(s.social_settings ->> 'facebook_user_access_token', '')), ''),
  coalesce((s.social_settings ->> 'facebook_connected')::boolean, false),
  NULLIF(s.social_settings ->> 'facebook_connected_at', '')::timestamptz,
  coalesce(s.social_settings -> 'facebook_pending_pages', '[]'::jsonb),
  NOW()
FROM public.salons s
WHERE s.social_settings IS NOT NULL
  AND (
    coalesce(s.social_settings ->> 'facebook_connected', 'false') = 'true'
    OR coalesce(s.social_settings ->> 'facebook_page_id', '') <> ''
    OR jsonb_array_length(coalesce(s.social_settings -> 'facebook_pending_pages', '[]'::jsonb)) > 0
  )
ON CONFLICT (salon_id) DO NOTHING;

COMMIT;

NOTIFY pgrst, 'reload schema';

SELECT 'salon_facebook_integrations ready' AS status;
