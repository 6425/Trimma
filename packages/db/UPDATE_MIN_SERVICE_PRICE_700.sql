-- Update all services with price below LKR 700 to the minimum LKR 700
-- Run this in the Supabase SQL Editor

-- Preview: see which services will be affected
SELECT id, salon_id, name, category, price, status
FROM services
WHERE price < 700
ORDER BY price ASC;

-- Apply the update
UPDATE services
SET price = 700
WHERE price < 700;
