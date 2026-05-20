-- ==============================================================================
-- GLOBAL BRANDING IDENTITY CONFIGURATION SCHEMAS (HOT-RELOADABLE)
-- ==============================================================================
-- Run this script in your Supabase SQL Editor to establish branding tables.
-- ==============================================================================

-- 1. Create table for global site logo and typography preferences
CREATE TABLE IF NOT EXISTS public.global_branding_settings (
  id UUID PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000002'::uuid,
  
  -- Site Icon Logo Name Styles
  logo_name TEXT NOT NULL DEFAULT 'Trimma',
  logo_name_font_family TEXT NOT NULL DEFAULT 'Outfit',
  logo_name_font_size INT NOT NULL DEFAULT 22, -- in pixels
  logo_name_color TEXT NOT NULL DEFAULT '#D81E5B',
  
  -- Logo Tagline Styles
  logo_tagline TEXT NOT NULL DEFAULT 'Sri Lanka''s Premium Grooming Marketplace',
  logo_tagline_font_family TEXT NOT NULL DEFAULT 'Inter',
  logo_tagline_font_size INT NOT NULL DEFAULT 9, -- in pixels
  logo_tagline_color TEXT NOT NULL DEFAULT '#64748b',
  
  -- Visual Assets
  logo_svg_raw TEXT, -- Optional raw SVG code to render beautiful custom vectors
  logo_image_url TEXT, -- Optional custom logo image upload URL
  
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.global_branding_settings ENABLE ROW LEVEL SECURITY;

-- 3. Set up Policies
DROP POLICY IF EXISTS "Public can read global branding settings" ON public.global_branding_settings;
CREATE POLICY "Public can read global branding settings" ON public.global_branding_settings 
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage global branding settings" ON public.global_branding_settings;
CREATE POLICY "Admins can manage global branding settings" ON public.global_branding_settings 
  FOR ALL USING (true);

-- 4. Insert initial default branding identity
INSERT INTO public.global_branding_settings (
  id,
  logo_name,
  logo_name_font_family,
  logo_name_font_size,
  logo_name_color,
  logo_tagline,
  logo_tagline_font_family,
  logo_tagline_font_size,
  logo_tagline_color
) VALUES (
  '00000000-0000-0000-0000-000000000002'::uuid,
  'Trimma',
  'Outfit',
  22,
  '#D81E5B',
  'Sri Lanka''s Premium Grooming Marketplace',
  'Inter',
  9,
  '#64748b'
) ON CONFLICT (id) DO NOTHING;
