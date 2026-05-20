-- ADD_SALON_BRANDING_COLUMNS.sql
-- Run this SQL in your Supabase SQL Editor to add new visual branding, image gallery, and visual asset columns to salons table.

ALTER TABLE salons ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS cover_url TEXT;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS hero_url TEXT; -- New Hero Banner Image
ALTER TABLE salons ADD COLUMN IF NOT EXISTS featured_images TEXT[] DEFAULT '{}'; -- New Image Gallery
ALTER TABLE salons ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS working_hours TEXT DEFAULT 'Mon - Sun: 9:00 AM - 8:00 PM';
