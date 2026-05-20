-- --------------------------------------------------------
-- TRIMMA - SUPABASE STORAGE BUCKETS & RLS
-- --------------------------------------------------------
-- This script creates the necessary storage buckets for the 
-- Trimma application and sets up Row Level Security (RLS) 
-- policies for secure access.
-- --------------------------------------------------------

-- 1. Create Buckets
-- Note: You can also create these directly in the Supabase Dashboard UI.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('salon-images', 'salon-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']), -- 5MB limit
  ('service-images', 'service-images', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp']), -- 2MB limit
  ('user-avatars', 'user-avatars', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp']), -- 2MB limit
  ('documents', 'documents', false, 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/png']) -- 10MB limit, Private (KYC docs)
ON CONFLICT (id) DO NOTHING;

-- 2. (Skipped) RLS on storage.objects is managed by Supabase automatically.

-- --------------------------------------------------------
-- POLICIES FOR 'salon-images' BUCKET (Public Read)
-- --------------------------------------------------------
CREATE POLICY "Public Access to salon images" 
ON storage.objects FOR SELECT USING ( bucket_id = 'salon-images' );

CREATE POLICY "Authenticated users can upload salon images" 
ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'salon-images' AND auth.role() = 'authenticated' );

CREATE POLICY "Users can update their own uploaded salon images" 
ON storage.objects FOR UPDATE USING ( bucket_id = 'salon-images' AND auth.uid() = owner );

CREATE POLICY "Users can delete their own uploaded salon images" 
ON storage.objects FOR DELETE USING ( bucket_id = 'salon-images' AND auth.uid() = owner );


-- --------------------------------------------------------
-- POLICIES FOR 'service-images' BUCKET (Public Read)
-- --------------------------------------------------------
CREATE POLICY "Public Access to service images" 
ON storage.objects FOR SELECT USING ( bucket_id = 'service-images' );

CREATE POLICY "Authenticated users can upload service images" 
ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'service-images' AND auth.role() = 'authenticated' );

CREATE POLICY "Users can update their own uploaded service images" 
ON storage.objects FOR UPDATE USING ( bucket_id = 'service-images' AND auth.uid() = owner );

CREATE POLICY "Users can delete their own uploaded service images" 
ON storage.objects FOR DELETE USING ( bucket_id = 'service-images' AND auth.uid() = owner );


-- --------------------------------------------------------
-- POLICIES FOR 'user-avatars' BUCKET (Public Read)
-- --------------------------------------------------------
CREATE POLICY "Public Access to user avatars" 
ON storage.objects FOR SELECT USING ( bucket_id = 'user-avatars' );

-- Ensure users upload to their own folder: e.g., 'user-avatars/UUID/avatar.png'
CREATE POLICY "Users can upload their own avatar" 
ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'user-avatars' AND auth.uid()::text = (storage.foldername(name))[1] );

CREATE POLICY "Users can update their own avatar" 
ON storage.objects FOR UPDATE USING ( bucket_id = 'user-avatars' AND auth.uid() = owner );

CREATE POLICY "Users can delete their own avatar" 
ON storage.objects FOR DELETE USING ( bucket_id = 'user-avatars' AND auth.uid() = owner );

-- --------------------------------------------------------
-- POLICIES FOR 'documents' BUCKET (Private)
-- --------------------------------------------------------
-- Only the owner (the salon mapping to this folder/file) or an admin can view documents
CREATE POLICY "Users can view their own documents" 
ON storage.objects FOR SELECT USING ( bucket_id = 'documents' AND auth.uid() = owner );

CREATE POLICY "Authenticated users can upload documents" 
ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'documents' AND auth.role() = 'authenticated' );

CREATE POLICY "Users can update their own documents" 
ON storage.objects FOR UPDATE USING ( bucket_id = 'documents' AND auth.uid() = owner );

CREATE POLICY "Users can delete their own documents" 
ON storage.objects FOR DELETE USING ( bucket_id = 'documents' AND auth.uid() = owner );

-- Note: Admin view-all policy is typically managed via custom DB functions that bypass RLS
-- or explicitly adding an `OR (SELECT role FROM users WHERE users.id = auth.uid()) = 'admin'` to the SELECT policy.
