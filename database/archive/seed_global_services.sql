-- TRIMMA AI: GLOBAL SERVICES SEED DATA
-- This script populates the master catalog with common services for each category.

INSERT INTO global_services (name, slug, category_id, suggested_price, suggested_duration_minutes, icon, description)
VALUES 
  -- Barber Salon
  ('Classic Haircut', 'classic-haircut', 'e573447d-35c9-40d7-8a71-661fd05ba3a1', 1500.00, 30, 'Scissors', 'Professional haircut including consultation and styling.'),
  ('Beard Sculpting', 'beard-sculpting', 'e573447d-35c9-40d7-8a71-661fd05ba3a1', 800.00, 20, 'User', 'Precision beard shaping and hot towel finish.'),
  
  -- Beauty Parlours
  ('Classic Facial', 'classic-facial', 'ea03b018-c45f-483a-9857-77058ac7c3ce', 3500.00, 60, 'Sparkles', 'Deep cleansing and hydration treatment for all skin types.'),
  ('Hair Coloring', 'hair-coloring', 'ea03b018-c45f-483a-9857-77058ac7c3ce', 8500.00, 120, 'Sparkles', 'Professional hair coloring with premium products.'),

  -- Bridal & Beauty
  ('Bridal Makeup', 'bridal-makeup', '6bd05eaf-ee0c-4f69-91eb-b14ac453c143', 45000.00, 180, 'Heart', 'Full bridal makeup, hair styling, and saree draping.'),
  ('Engagement Makeup', 'engagement-makeup', '6bd05eaf-ee0c-4f69-91eb-b14ac453c143', 25000.00, 120, 'Heart', 'Premium makeup look for engagement ceremonies.'),

  -- Nail Studio
  ('Gel Manicure', 'gel-manicure', '7faebaac-aa28-41cc-867c-5451b39b68d6', 3500.00, 60, 'Paintbrush', 'Long-lasting gel polish with nail shaping.'),
  ('Pedicure Deluxe', 'pedicure-deluxe', '7faebaac-aa28-41cc-867c-5451b39b68d6', 4500.00, 75, 'Paintbrush', 'Exfoliating foot treatment and nail care.'),

  -- Skincare Clinics
  ('Chemical Peel', 'chemical-peel', '7ffa2d9b-f871-4e50-89ac-45e5a85cc686', 12000.00, 45, 'Droplet', 'Advanced skin resurfacing for rejuvenation.'),
  ('Acne Treatment', 'acne-treatment', '7ffa2d9b-f871-4e50-89ac-45e5a85cc686', 7500.00, 60, 'Droplet', 'Targeted therapy for acne-prone skin.'),

  -- Spa & Wellness
  ('Ayurvedic Full Body Massage', 'ayurvedic-massage', 'f6b46e37-5898-4ed3-9324-979164f089fe', 7500.00, 90, 'Flower2', 'Traditional whole body massage with herbal oils.'),
  ('Head & Shoulder Massage', 'head-massage', 'f6b46e37-5898-4ed3-9324-979164f089fe', 2500.00, 30, 'Flower2', 'Stress-relieving massage for upper body.'),

  -- Yoga Studio
  ('Hatha Yoga Session', 'hatha-yoga', '8853ac93-ef53-4eb4-9704-ddc17d527c06', 2000.00, 60, 'Activity', 'Classical yoga focusing on physical postures and breath.'),

  -- Men''s Grooming
  ('Deep Tissue Massage (Men)', 'men-deep-tissue', '2450ceb4-9ccc-43bd-b47c-1bf287328bae', 6000.00, 60, 'User', 'Intense muscle relaxation for active men.'),

  -- Kids & Family
  ('Kids Haircut', 'kids-haircut', '62419cc9-15a8-4ef2-b42c-c65442a4ec10', 1200.00, 30, 'Users', 'Friendly and easy haircut for children.'),

  -- Tattoo Studio
  ('Small Custom Tattoo', 'small-tattoo', 'ea80f5e9-4cf5-4d76-8f89-bad4927ecfeb', 5000.00, 90, 'PenTool', 'Custom design up to 2 inches.')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  suggested_price = EXCLUDED.suggested_price,
  suggested_duration_minutes = EXCLUDED.suggested_duration_minutes,
  icon = EXCLUDED.icon,
  description = EXCLUDED.description;
