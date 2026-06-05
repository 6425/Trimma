-- ==============================================================================
-- TRIMMA: SUPABASE STORAGE — salon-images & staff-avatars
-- ==============================================================================
-- Run this in your Supabase SQL Editor to grant upload permissions to your 
-- authenticated salon dashboard users.
-- ==============================================================================

BEGIN;

-- 1. Ensure the buckets exist (in case they haven't been created yet)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'salon-images',
  'salon-images',
  true,
  20971520, -- 20MB
  ARRAY['image/webp', 'image/jpeg', 'image/png', 'image/gif']::text[]
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'staff-avatars',
  'staff-avatars',
  true,
  10485760, -- 10MB
  ARRAY['image/webp', 'image/jpeg', 'image/png', 'image/gif']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- 2. Drop existing policies (if any) to prevent conflicts
DROP POLICY IF EXISTS "Public read salon-images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload salon-images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update salon-images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete salon-images" ON storage.objects;

DROP POLICY IF EXISTS "Public read staff-avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload staff-avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update staff-avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete staff-avatars" ON storage.objects;

-- 3. Create RLS Policies for `salon-images`
CREATE POLICY "Public read salon-images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'salon-images');

CREATE POLICY "Authenticated upload salon-images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'salon-images');

CREATE POLICY "Authenticated update salon-images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'salon-images')
  WITH CHECK (bucket_id = 'salon-images');

CREATE POLICY "Authenticated delete salon-images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'salon-images');

-- 4. Create RLS Policies for `staff-avatars`
CREATE POLICY "Public read staff-avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'staff-avatars');

CREATE POLICY "Authenticated upload staff-avatars"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'staff-avatars');

CREATE POLICY "Authenticated update staff-avatars"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'staff-avatars')
  WITH CHECK (bucket_id = 'staff-avatars');

CREATE POLICY "Authenticated delete staff-avatars"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'staff-avatars');

COMMIT;
