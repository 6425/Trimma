-- SERVICES_RLS_PATCH.sql
-- Run this script in your Supabase SQL Editor to resolve service publishing RLS errors.

-- Enable Row Level Security (if not already enabled)
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- 1. SELECT: Allow everyone (customers & public) to read services of all salons
DROP POLICY IF EXISTS "Public can view active services" ON services;
DROP POLICY IF EXISTS "Public can view services of active salons" ON services;
CREATE POLICY "Public can view active services" 
ON services FOR SELECT 
USING (true);

-- 2. INSERT: Allow authenticated salon owners to publish services under their own salon
DROP POLICY IF EXISTS "Owners can insert their own services" ON services;
CREATE POLICY "Owners can insert their own services" 
ON services FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM salons 
    WHERE salons.id = services.salon_id 
    AND salons.owner_email = auth.jwt() ->> 'email'
  )
);

-- 3. UPDATE: Allow authenticated salon owners to edit services under their own salon
DROP POLICY IF EXISTS "Owners can update their own services" ON services;
CREATE POLICY "Owners can update their own services" 
ON services FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM salons 
    WHERE salons.id = services.salon_id 
    AND salons.owner_email = auth.jwt() ->> 'email'
  )
);

-- 4. DELETE: Allow authenticated salon owners to delete services under their own salon
DROP POLICY IF EXISTS "Owners can delete their own services" ON services;
CREATE POLICY "Owners can delete their own services" 
ON services FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM salons 
    WHERE salons.id = services.salon_id 
    AND salons.owner_email = auth.jwt() ->> 'email'
  )
);
