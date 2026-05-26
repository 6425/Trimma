-- ==============================================================================
-- TRIMMA: SUPABASE STORAGE — public-assets bucket (styles, categories, provinces)
-- ==============================================================================
-- Run in Supabase SQL Editor (safe to re-run).
--
-- Style images upload to: public-assets/styles/{filename}.webp
-- (Same bucket as admin category & province images.)
--
-- Also verify in Dashboard → Storage → public-assets is Public.
-- ==============================================================================

BEGIN;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'public-assets',
  'public-assets',
  true,
  5242880,
  ARRAY['image/webp', 'image/jpeg', 'image/png', 'image/gif']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = COALESCE(storage.buckets.file_size_limit, EXCLUDED.file_size_limit),
  allowed_mime_types = COALESCE(storage.buckets.allowed_mime_types, EXCLUDED.allowed_mime_types);

-- ── storage.objects policies ─────────────────────────────────────────────────

DROP POLICY IF EXISTS "Public read public-assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload public-assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update public-assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete public-assets" ON storage.objects;

CREATE POLICY "Public read public-assets"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'public-assets');

CREATE POLICY "Authenticated upload public-assets"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'public-assets');

CREATE POLICY "Authenticated update public-assets"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'public-assets')
  WITH CHECK (bucket_id = 'public-assets');

CREATE POLICY "Authenticated delete public-assets"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'public-assets');

COMMIT;

SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE id = 'public-assets';
