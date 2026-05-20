-- ==============================================================================
-- TRIMMA PLATFORM: SALON LEADS DATABASE SCHEMA PATCH (FINAL)
-- ==============================================================================
-- Target: Supabase SQL Editor
-- Description: Establishes a production-grade 'salon_leads' table to store 
--              scraped Google Maps API entries, prevents duplicate processing 
--              of identical place IDs, and manages pipeline assignment.
--              Includes a 'role' column defaulting to 'salon_owner' inside the table.
-- ==============================================================================

-- 1. Create the Leads Pipeline Table
CREATE TABLE IF NOT EXISTS public.salon_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id TEXT UNIQUE NOT NULL, -- Google Maps Unique Place ID for strict deduplication
  name TEXT NOT NULL, -- Salon/Business Name
  address TEXT, -- Physical address
  rating NUMERIC(3, 2), -- Google Maps rating (e.g. 4.85)
  phone TEXT, -- Phone Number
  website TEXT, -- Website URL
  map_url TEXT, -- Google Maps URL
  category TEXT, -- Salon/Business Category (e.g. Barber Shop, Hair Salon)
  opening_hours JSONB DEFAULT '[]'::jsonb, -- Structured business hours from Maps API
  latitude NUMERIC(10, 8), -- Precise GPS coordinates
  longitude NUMERIC(11, 8), -- Precise GPS coordinates
  price_level TEXT, -- Price tier indicator (e.g. '$', '$$', '$$$')
  summary TEXT, -- AI-generated lead description or business notes
  hero_image TEXT, -- Google Maps cover photo or main gallery image URL
  assign_to TEXT REFERENCES public.users(email) ON DELETE SET NULL, -- Assigned Agent or Manager (references users.email)
  role TEXT DEFAULT 'salon_owner', -- Role classification for the lead (defaults to salon_owner)
  status TEXT DEFAULT 'new' NOT NULL CHECK (status IN ('new', 'assigned', 'contacted', 'claimed', 'converted', 'rejected')),
  
  -- Metadata Timestamps
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Idempotent check: safely add/update the status constraint on existing tables
ALTER TABLE public.salon_leads DROP CONSTRAINT IF EXISTS salon_leads_status_check;
ALTER TABLE public.salon_leads ADD CONSTRAINT salon_leads_status_check CHECK (status IN ('new', 'assigned', 'contacted', 'claimed', 'converted', 'rejected'));

-- 2. Performance & Deduplication Indexing
CREATE UNIQUE INDEX IF NOT EXISTS idx_salon_leads_place_id ON public.salon_leads(place_id);
CREATE INDEX IF NOT EXISTS idx_salon_leads_status ON public.salon_leads(status);
CREATE INDEX IF NOT EXISTS idx_salon_leads_assign_to ON public.salon_leads(assign_to);

-- 3. Row Level Security (RLS) Configuration
ALTER TABLE public.salon_leads ENABLE ROW LEVEL SECURITY;

-- Policy A: Allow public/automated imports to insert and update leads (for Map Scrapers or APIs)
DROP POLICY IF EXISTS "Allow insertion of leads by scraper service" ON public.salon_leads;
CREATE POLICY "Allow insertion of leads by scraper service" 
ON public.salon_leads 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Policy B: Allow authenticated users to view lead records (for Agent dashboard lists)
DROP POLICY IF EXISTS "Allow authenticated users to view leads" ON public.salon_leads;
CREATE POLICY "Allow authenticated users to view leads" 
ON public.salon_leads 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Policy C: Allow admins to perform all CRUD actions (queries global_role column in users table)
DROP POLICY IF EXISTS "Admins can fully manage all salon leads" ON public.salon_leads;
CREATE POLICY "Admins can fully manage all salon leads" 
ON public.salon_leads 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE email = auth.jwt() ->> 'email' 
    AND global_role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE email = auth.jwt() ->> 'email' 
    AND global_role = 'admin'
  )
);

-- Policy D: Allow assigned agents to update their own leads
DROP POLICY IF EXISTS "Assigned agents can update their own leads" ON public.salon_leads;
CREATE POLICY "Assigned agents can update their own leads" 
ON public.salon_leads 
FOR UPDATE 
USING (auth.jwt() ->> 'email' = assign_to)
WITH CHECK (auth.jwt() ->> 'email' = assign_to);

-- 4. Idempotent Triggers for Auto-Updating the 'updated_at' Timestamp
CREATE OR REPLACE FUNCTION public.update_salon_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_salon_leads_updated_at ON public.salon_leads;
CREATE TRIGGER trigger_update_salon_leads_updated_at
  BEFORE UPDATE ON public.salon_leads
  FOR EACH ROW
  EXECUTE PROCEDURE public.update_salon_leads_updated_at();

-- 5. Return confirmation notice
SELECT 'Salon leads database patch initialized successfully!' AS schema_status;
