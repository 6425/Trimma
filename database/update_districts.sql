-- TRIMMA AI: DISTRICTS UPDATE SCRIPT
-- This script populates the districts table by looking up the province_id from the provinces table.

INSERT INTO districts (province_id, name, slug)
VALUES 
  -- Western Province
  ((SELECT id FROM provinces WHERE name = 'Western Province' LIMIT 1), 'Colombo', 'colombo'),
  ((SELECT id FROM provinces WHERE name = 'Western Province' LIMIT 1), 'Gampaha', 'gampaha'),
  ((SELECT id FROM provinces WHERE name = 'Western Province' LIMIT 1), 'Kalutara', 'kalutara'),
  
  -- Central Province
  ((SELECT id FROM provinces WHERE name = 'Central Province' LIMIT 1), 'Kandy', 'kandy'),
  ((SELECT id FROM provinces WHERE name = 'Central Province' LIMIT 1), 'Matale', 'matale'),
  ((SELECT id FROM provinces WHERE name = 'Central Province' LIMIT 1), 'Nuwara Eliya', 'nuwara-eliya'),
  
  -- Southern Province
  ((SELECT id FROM provinces WHERE name = 'Southern Province' LIMIT 1), 'Galle', 'galle'),
  ((SELECT id FROM provinces WHERE name = 'Southern Province' LIMIT 1), 'Matara', 'matara'),
  ((SELECT id FROM provinces WHERE name = 'Southern Province' LIMIT 1), 'Hambantota', 'hambantota'),
  
  -- Northern Province
  ((SELECT id FROM provinces WHERE name = 'Northern Province' LIMIT 1), 'Jaffna', 'jaffna'),
  ((SELECT id FROM provinces WHERE name = 'Northern Province' LIMIT 1), 'Kilinochchi', 'kilinochchi'),
  ((SELECT id FROM provinces WHERE name = 'Northern Province' LIMIT 1), 'Mannar', 'mannar'),
  ((SELECT id FROM provinces WHERE name = 'Northern Province' LIMIT 1), 'Vavuniya', 'vavuniya'),
  ((SELECT id FROM provinces WHERE name = 'Northern Province' LIMIT 1), 'Mullaitivu', 'mullaitivu'),
  
  -- Eastern Province
  ((SELECT id FROM provinces WHERE name = 'Eastern Province' LIMIT 1), 'Trincomalee', 'trincomalee'),
  ((SELECT id FROM provinces WHERE name = 'Eastern Province' LIMIT 1), 'Batticaloa', 'batticaloa'),
  ((SELECT id FROM provinces WHERE name = 'Eastern Province' LIMIT 1), 'Ampara', 'ampara'),
  
  -- North Western Province
  ((SELECT id FROM provinces WHERE name = 'North Western Province' LIMIT 1), 'Kurunegala', 'kurunegala'),
  ((SELECT id FROM provinces WHERE name = 'North Western Province' LIMIT 1), 'Puttalam', 'puttalam'),
  
  -- North Central Province
  ((SELECT id FROM provinces WHERE name = 'North Central Province' LIMIT 1), 'Anuradhapura', 'anuradhapura'),
  ((SELECT id FROM provinces WHERE name = 'North Central Province' LIMIT 1), 'Polonnaruwa', 'polonnaruwa'),
  
  -- Uva Province
  ((SELECT id FROM provinces WHERE name = 'Uva Province' LIMIT 1), 'Badulla', 'badulla'),
  ((SELECT id FROM provinces WHERE name = 'Uva Province' LIMIT 1), 'Monaragala', 'monaragala'),
  
  -- Sabaragamuwa Province
  ((SELECT id FROM provinces WHERE name = 'Sabaragamuwa Province' LIMIT 1), 'Ratnapura', 'ratnapura'),
  ((SELECT id FROM provinces WHERE name = 'Sabaragamuwa Province' LIMIT 1), 'Kegalle', 'kegalle')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  province_id = EXCLUDED.province_id;
