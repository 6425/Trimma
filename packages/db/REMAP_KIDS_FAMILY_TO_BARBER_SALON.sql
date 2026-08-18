-- Move leftover Kids & Family primary categories to Barber Salon.
-- Run in the Supabase SQL Editor if the app remap has not already applied.

UPDATE salons
SET category = 'Barber Salon'
WHERE category IN ('Kids & Family', 'Kids and Family');

-- Confirm none remain
SELECT count(*) AS kids_family_primary_remaining
FROM salons
WHERE category IN ('Kids & Family', 'Kids and Family');
