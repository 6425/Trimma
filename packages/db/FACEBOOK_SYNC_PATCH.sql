-- TRIMMA: Facebook catalog sync log + auto-publish services toggle
-- Run after SALON_FACEBOOK_INTEGRATION_PATCH.sql

ALTER TABLE public.salon_facebook_integrations
  ADD COLUMN IF NOT EXISTS auto_publish_services BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS public.facebook_sync_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('service', 'promotion_package')),
  entity_id UUID,
  action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'deleted', 'published')),
  facebook_post_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'skipped')),
  caption TEXT,
  error_message TEXT,
  retry_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  synced_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_facebook_sync_posts_salon_created
  ON public.facebook_sync_posts (salon_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_facebook_sync_posts_entity
  ON public.facebook_sync_posts (salon_id, entity_type, entity_id);

ALTER TABLE public.facebook_sync_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS facebook_sync_posts_service ON public.facebook_sync_posts;
CREATE POLICY facebook_sync_posts_service
  ON public.facebook_sync_posts
  FOR ALL
  USING (true)
  WITH CHECK (true);

SELECT 'facebook_sync_posts ready' AS status;
