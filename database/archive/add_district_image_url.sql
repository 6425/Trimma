-- Migration script to add image_url column to districts table
ALTER TABLE public.districts
ADD COLUMN IF NOT EXISTS image_url text;

-- Optional: Update existing records to have a default image if needed
-- UPDATE public.districts SET image_url = 'https://images.unsplash.com/photo-1574227492706-f65b24c3688a?q=80&w=2940&auto=format&fit=crop' WHERE image_url IS NULL;
