-- TRIMMA AI: PROVINCES UPDATE SCRIPT
-- This script populates the provinces table with standardized data for Sri Lanka.

DELETE FROM provinces; -- Clear existing if necessary to ensure clean slugs

INSERT INTO provinces (name, slug)
VALUES 
  ('Central Province', 'central-province'),
  ('Eastern Province', 'eastern-province'),
  ('North Central Province', 'north-central-province'),
  ('North Western Province', 'north-western-province'),
  ('Northern Province', 'northern-province'),
  ('Sabaragamuwa Province', 'sabaragamuwa-province'),
  ('Southern Province', 'southern-province'),
  ('Uva Province', 'uva-province'),
  ('Western Province', 'western-province')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name;
