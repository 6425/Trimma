-- Move leftover Beauty Parlours primary categories to Barber Salon.
-- Run in the Supabase SQL Editor if the app remap has not already applied.

UPDATE salons
SET category = 'Barber Salon'
WHERE category IN ('Beauty Parlours', 'Beauty Parlors');

-- Confirm none remain
SELECT count(*) AS beauty_parlours_primary_remaining
FROM salons
WHERE category IN ('Beauty Parlours', 'Beauty Parlors');
