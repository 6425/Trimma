-- Trimma AI Categories Update Script
-- This script updates the categories table with standardized slugs and Lucide icon names
-- matching the landing page design.

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Update or Insert categories
INSERT INTO categories (id, name, slug, icon)
VALUES 
  ('e573447d-35c9-40d7-8a71-661fd05ba3a1', 'Baber Salon', 'barber-salon', 'Scissors'),
  ('ea03b018-c45f-483a-9857-77058ac7c3ce', 'Beauty Parlours', 'beauty-parlours', 'Sparkles'),
  ('6bd05eaf-ee0c-4f69-91eb-b14ac453c143', 'Birdal & Beauty', 'bridal-and-beauty', 'Heart'),
  ('62419cc9-15a8-4ef2-b42c-c65442a4ec10', 'Kids & Family', 'kids-and-family', 'Users'),
  ('2450ceb4-9ccc-43bd-b47c-1bf287328bae', 'Men''s Grooming', 'mens-grooming', 'User'),
  ('7faebaac-aa28-41cc-867c-5451b39b68d6', 'Nail Studio', 'nail-studio', 'Paintbrush'),
  ('7ffa2d9b-f871-4e50-89ac-45e5a85cc686', 'Skincare Clinics', 'skincare-clinics', 'Droplet'),
  ('f6b46e37-5898-4ed3-9324-979164f089fe', 'Spa & Wellness', 'spa-and-wellness', 'Flower2'),
  ('ea80f5e9-4cf5-4d76-8f89-bad4927ecfeb', 'Tattoo Studio', 'tattoo-studio', 'PenTool'),
  ('8853ac93-ef53-4eb4-9704-ddc17d527c06', 'Yoga Studio', 'yoga-studio', 'Activity')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  icon = EXCLUDED.icon;
