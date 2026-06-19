-- ==============================================================================
-- TRIMMA: SUPABASE STORAGE — salon-documents (PRIVATE)
-- ==============================================================================
-- Run this in your Supabase SQL Editor to create a private bucket for sensitive
-- salon verification documents (NIC, Business Registration, Bank Statements).
-- ==============================================================================

BEGIN;

-- 1. Ensure the bucket exists and is PRIVATE (public = false)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'salon-documents',
  'salon-documents',
  false,
  10485760, -- 10MB
  ARRAY['image/webp', 'image/jpeg', 'image/png', 'application/pdf']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/webp', 'image/jpeg', 'image/png', 'application/pdf']::text[];

-- 2. Drop existing policies (if any) to prevent conflicts
DROP POLICY IF EXISTS "Agents and Admins can read all documents" ON storage.objects;
DROP POLICY IF EXISTS "Owners can read their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete documents" ON storage.objects;

-- 3. Create RLS Policies for `salon-documents`

-- Allow platform admins, agents, and regional heads to read verification documents
CREATE POLICY "Agents and Admins can read all documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'salon-documents' AND (
      public.is_platform_admin()
      OR EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role IN ('admin', 'agent', 'regional_head', 'regional_admin')
      )
      OR EXISTS (
        SELECT 1 FROM public.users
        WHERE email = auth.jwt() ->> 'email'
          AND global_role IN ('admin', 'superadmin', 'agent', 'regional_head', 'regional_admin')
      )
    )
  );

-- Allow Salon Owners to read documents they uploaded (where the path starts with their salon_id)
-- Note: Assuming the file path format is `salonId/filename.ext`
CREATE POLICY "Owners can read their own documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'salon-documents' AND
    (auth.uid() IS NOT NULL) AND
    -- Ideally, a join to salons to verify ownership would go here, 
    -- but for simplicity, we allow authenticated users to view objects if they uploaded them (owner_id in storage objects).
    auth.uid() = owner
  );

CREATE POLICY "Authenticated upload documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'salon-documents');

CREATE POLICY "Authenticated update documents"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'salon-documents' AND auth.uid() = owner)
  WITH CHECK (bucket_id = 'salon-documents');

CREATE POLICY "Authenticated delete documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'salon-documents' AND auth.uid() = owner);

COMMIT;

SELECT 'Private salon-documents bucket and RLS policies successfully applied!' AS status;
