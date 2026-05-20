-- SALON_INSERT_RLS_PATCH.sql
-- Drop old policy if exists to avoid duplication errors
DROP POLICY IF EXISTS "Authenticated users can insert their own salon" ON salons;

-- Create INSERT policy to allow authenticated owners to onboard their own salons
CREATE POLICY "Authenticated users can insert their own salon" 
ON salons FOR INSERT 
WITH CHECK (
  auth.role() = 'authenticated' 
  AND owner_email = auth.jwt() ->> 'email'
);
