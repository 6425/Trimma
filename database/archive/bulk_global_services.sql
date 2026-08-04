-- TRIMMA AI: BULK GLOBAL SERVICES IMPORT
-- This script imports 60+ standardized service templates for the marketplace.

-- 1. First, ensure the global_services table is clean or ready for conflict resolution
-- We use slugs as the unique identifier for templates.

INSERT INTO global_services (category_id, name, slug, description, suggested_price, icon)
VALUES 
  -- Barber Salon
  ('e573447d-35c9-40d7-8a71-661fd05ba3a1', 'Gents Haircut & Wash', 'gents-haircut-wash', 'Professional hair trimming, shampooing, and basic styling.', 1500.00, 'Scissors'),
  ('e573447d-35c9-40d7-8a71-661fd05ba3a1', 'Beard Trimming & Shape', 'beard-trimming-shape', 'Classic line-up and beard shaping using clippers or razors.', 600.00, 'Scissors'),
  ('e573447d-35c9-40d7-8a71-661fd05ba3a1', 'Hot Oil Head Massage', 'hot-oil-head-massage', 'Traditional scalp massage using warm oil to boost circulation.', 1600.00, 'Flower2'),
  ('e573447d-35c9-40d7-8a71-661fd05ba3a1', 'Gents Shaving', 'gents-shaving', 'Traditional smooth clean-shave using standard shaving foam/gel.', 700.00, 'User'),
  ('e573447d-35c9-40d7-8a71-661fd05ba3a1', 'Grey Hair Coverage', 'grey-hair-coverage', 'Quick application of black or dark brown hair dye to cover greys.', 3000.00, 'Sparkles'),
  ('e573447d-35c9-40d7-8a71-661fd05ba3a1', 'Men''s Hair Perming', 'mens-hair-perming', 'Chemically adding curls or waves to the top hair section.', 20000.00, 'Sparkles'),

  -- Bridal & Beauty
  ('6bd05eaf-ee0c-4f69-91eb-b14ac453c143', 'Saree Draping', 'saree-draping', 'Professional draping of traditional Kandyan or Normal sarees.', 2500.00, 'Heart'),
  ('6bd05eaf-ee0c-4f69-91eb-b14ac453c143', 'Party Makeup & Hair', 'party-makeup-hair', 'Full-face makeup and styling for wedding guests or functions.', 8000.00, 'Heart'),
  ('6bd05eaf-ee0c-4f69-91eb-b14ac453c143', 'Bridal Hydra Facial', 'bridal-hydra-facial', 'Deep-cleaning, exfoliating glow facial specifically for brides.', 20000.00, 'Droplet'),
  ('6bd05eaf-ee0c-4f69-91eb-b14ac453c143', 'Bridal Hand Spa + Gel', 'bridal-hand-spa-gel', 'Exfoliating hand treatment finished with long-lasting gel polish.', 15000.00, 'Paintbrush'),
  ('6bd05eaf-ee0c-4f69-91eb-b14ac453c143', 'Pre-Bridal Full Body Wax', 'pre-bridal-full-body-wax', 'Complete body wax (arms, legs, face) before the big day.', 25000.00, 'Sparkles'),
  ('6bd05eaf-ee0c-4f69-91eb-b14ac453c143', 'Complete Bridal Dressing', 'complete-bridal-dressing', 'Full wedding day package including makeup, hair, and dressing.', 60000.00, 'Heart'),

  -- Beauty Parlours
  ('ea03b018-c45f-483a-9857-77058ac7c3ce', 'Eyebrow Threading', 'eyebrow-threading', 'Precise shaping of eyebrows using the threading technique.', 300.00, 'Scissors'),
  ('ea03b018-c45f-483a-9857-77058ac7c3ce', 'Clean Up Facial', 'clean-up-facial', 'Standard face exfoliation, steam, and pack for daily upkeep.', 3500.00, 'Sparkles'),
  ('ea03b018-c45f-483a-9857-77058ac7c3ce', 'Hair Wash & Blast Dry', 'hair-wash-blast-dry', 'Basic hair wash followed by standard high-speed blow drying.', 1800.00, 'Droplet'),
  ('ea03b018-c45f-483a-9857-77058ac7c3ce', 'Full Arms & Legs Wax', 'full-arms-legs-wax', 'Normal warm wax hair removal for both hands and legs.', 4500.00, 'Sparkles'),
  ('ea03b018-c45f-483a-9857-77058ac7c3ce', 'Permanent Rebonding', 'permanent-rebonding', 'Chemical straightening system for sleek, permanently flat hair.', 15000.00, 'Sparkles'),
  ('ea03b018-c45f-483a-9857-77058ac7c3ce', 'Keratin Treatment', 'keratin-treatment', 'Smoothing and frizz-reduction protein coat for mid-length hair.', 35000.00, 'Sparkles'),

  -- Nail Studio
  ('7faebaac-aa28-41cc-867c-5451b39b68d6', 'Express Manicure', 'express-manicure', 'Quick nail file, shape, cuticle cleaning, and regular nail polish.', 2500.00, 'Paintbrush'),
  ('7faebaac-aa28-41cc-867c-5451b39b68d6', 'Gel Polish Application', 'gel-polish-application', 'Standard long-lasting gel color cured under a UV/LED lamp.', 4000.00, 'Paintbrush'),
  ('7faebaac-aa28-41cc-867c-5451b39b68d6', 'Acrylic Nail Extensions', 'acrylic-nail-extensions', 'Lengthening nails using artificial acrylic tips with base overlays.', 12000.00, 'Paintbrush'),
  ('7faebaac-aa28-41cc-867c-5451b39b68d6', 'Custom Nail Art (Per Nail)', 'custom-nail-art', 'Hand-painted designs, chrome powder, or stones added to nails.', 500.00, 'Paintbrush'),
  ('7faebaac-aa28-41cc-867c-5451b39b68d6', 'Luxury Spa Pedicure', 'luxury-spa-pedicure', 'Relaxing foot scrub, mask, massage, and complete toenail care.', 6000.00, 'Paintbrush'),
  ('7faebaac-aa28-41cc-867c-5451b39b68d6', 'Acrylic Gel Extension Removal', 'acrylic-gel-extension-removal', 'Safe buffing and soaking off to remove old acrylic or gel extensions.', 2000.00, 'Paintbrush'),

  -- Skincare Clinics
  ('7ffa2d9b-f871-4e50-89ac-45e5a85cc686', 'Laser Hair Removal (Session)', 'laser-hair-removal', 'Targeting specific body areas (like underarms) for permanent reduction.', 8000.00, 'Sparkles'),
  ('7ffa2d9b-f871-4e50-89ac-45e5a85cc686', 'Microdermabrasion', 'microdermabrasion', 'Medical-grade mechanical exfoliation to reduce acne scars.', 10000.00, 'Droplet'),
  ('7ffa2d9b-f871-4e50-89ac-45e5a85cc686', 'Chemical Skin Peel', 'chemical-skin-peel', 'Dermatological acid application to treat hyperpigmentation.', 12000.00, 'Droplet'),
  ('7ffa2d9b-f871-4e50-89ac-45e5a85cc686', 'PRP Therapy (Vampire Facial)', 'prp-therapy', 'Advanced platelet-rich plasma treatment for skin rejuvenation.', 25000.00, 'Droplet'),
  ('7ffa2d9b-f871-4e50-89ac-45e5a85cc686', 'Medicated Acne Treatment', 'medicated-acne-treatment', 'Clinical extraction followed by high-frequency bacterial zap.', 8000.00, 'Droplet'),
  ('7ffa2d9b-f871-4e50-89ac-45e5a85cc686', 'Skin Tag/Wart Removal', 'skin-tag-wart-removal', 'Minor cauterization or laser treatment to remove skin tags.', 3000.00, 'Droplet'),

  -- Spa & Wellness
  ('f6b46e37-5898-4ed3-9324-979164f089fe', '10-Min Oil Head Massage', '10-min-oil-head-massage', 'Quick head rub using ayurvedic oil to relieve immediate stress.', 1500.00, 'Flower2'),
  ('f6b46e37-5898-4ed3-9324-979164f089fe', 'Full Body Herbal Massage', 'full-body-herbal-massage', '60 minutes of full-body oil massage using local herbs.', 8000.00, 'Flower2'),
  ('f6b46e37-5898-4ed3-9324-979164f089fe', 'Foot Reflexology', 'foot-reflexology', 'Pressure-point massage on the feet to boost internal body wellness.', 3500.00, 'Flower2'),
  ('f6b46e37-5898-4ed3-9324-979164f089fe', 'Back Pain Relief Ritual', 'back-pain-relief-ritual', 'Specialized targeted massage combined with warm herbal compress.', 6000.00, 'Flower2'),
  ('f6b46e37-5898-4ed3-9324-979164f089fe', 'Exfoliating Body Scrub', 'exfoliating-body-scrub', 'Full-body sand, salt, or coffee scrub to peel dead skin.', 6000.00, 'Flower2'),
  ('f6b46e37-5898-4ed3-9324-979164f089fe', 'Herbal Steam Bath Induction', 'herbal-steam-bath', 'Sitting in a traditional wooden steam chamber filled with herb vapors.', 3000.00, 'Flower2'),

  -- Yoga Studio
  ('8853ac93-ef53-4eb4-9704-ddc17d527c06', 'Single Drop-in Class', 'yoga-drop-in', 'Admission to one group session of Hatha or Vinyasa flow.', 1500.00, 'Activity'),
  ('8853ac93-ef53-4eb4-9704-ddc17d527c06', '10-Class Attendance Pass', 'yoga-10-class-pass', 'A bulk punch-card for 10 sessions, usually valid for 2-3 months.', 12000.00, 'Activity'),
  ('8853ac93-ef53-4eb4-9704-ddc17d527c06', 'Monthly Unlimited Membership', 'yoga-monthly-unlimited', 'Uncapped access to all daily group yoga and stretching classes.', 15000.00, 'Activity'),
  ('8853ac93-ef53-4eb4-9704-ddc17d527c06', 'Private One-on-One Session', 'yoga-private-session', '1-hour personalized physical or therapy yoga with an instructor.', 6000.00, 'Activity'),
  ('8853ac93-ef53-4eb4-9704-ddc17d527c06', 'Pranayama & Meditation', 'pranayama-meditation', 'A dedicated breathwork and mental calmness class.', 1500.00, 'Activity'),
  ('8853ac93-ef53-4eb4-9704-ddc17d527c06', 'Prenatal/Pregnancy Yoga', 'prenatal-yoga', 'Soft, modified yoga tailored strictly for expecting mothers.', 2500.00, 'Activity'),

  -- Men''s Grooming
  ('2450ceb4-9ccc-43bd-b47c-1bf287328bae', 'Tailored Gents Haircut', 'tailored-gents-haircut', 'Executive hair re-styling inclusive of a relaxing hair wash.', 3000.00, 'User'),
  ('2450ceb4-9ccc-43bd-b47c-1bf287328bae', 'Charcoal Deep Clean Facial', 'charcoal-deep-clean-facial', 'Blackhead and oil extraction designed specifically for male skin.', 5000.00, 'Sparkles'),
  ('2450ceb4-9ccc-43bd-b47c-1bf287328bae', 'Luxury Head Spa Treatment', 'luxury-head-spa', 'Scalp exfoliation, deep conditioning mask, and extended massage.', 12000.00, 'Flower2'),
  ('2450ceb4-9ccc-43bd-b47c-1bf287328bae', 'Premium Beard Sculpting', 'premium-beard-sculpting', 'Intricate beard fading, hot oil conditioning, and luxury line-up.', 2000.00, 'User'),
  ('2450ceb4-9ccc-43bd-b47c-1bf287328bae', 'Hair Detox Treatment', 'hair-detox-treatment', 'Scalp scaling to treat heavy dandruff or hair thinning problems.', 5500.00, 'Sparkles'),
  ('2450ceb4-9ccc-43bd-b47c-1bf287328bae', 'Gents Mani-Pedi Duo', 'gents-mani-pedi', 'Executive nail cleaning and hand/foot moisturizing for men.', 7000.00, 'Paintbrush'),

  -- Kids & Family
  ('62419cc9-15a8-4ef2-b42c-c65442a4ec10', 'Boys Haircut (Under 10yrs)', 'boys-haircut-kids', 'Fast, friendly trim usually on a specialty chair or car seat.', 1200.00, 'Users'),
  ('62419cc9-15a8-4ef2-b42c-c65442a4ec10', 'Girls Haircut & Blow-dry', 'girls-haircut-kids', 'Basic hair shaping and light blast styling for young girls.', 1800.00, 'Users'),
  ('62419cc9-15a8-4ef2-b42c-c65442a4ec10', 'Kids Mini Manicure', 'kids-mini-manicure', 'Gentle nail clipping, filing, and optional non-toxic nail paint.', 1500.00, 'Paintbrush'),
  ('62419cc9-15a8-4ef2-b42c-c65442a4ec10', 'Family Haircut Bundle', 'family-haircut-bundle', 'Package haircut for Mom, Dad, and one child at a discount.', 6000.00, 'Users'),
  ('62419cc9-15a8-4ef2-b42c-c65442a4ec10', 'Lice Treatment Session', 'lice-treatment', 'Natural, safe comb-through and wash to eliminate head lice.', 3500.00, 'Droplet'),
  ('62419cc9-15a8-4ef2-b42c-c65442a4ec10', 'Baby''s First Haircut Ceremony', 'babys-first-haircut', 'Gentle clipping of first baby hairs with a souvenir certificate.', 1500.00, 'Users'),

  -- Tattoo Studio
  ('ea80f5e9-4cf5-4d76-8f89-bad4927ecfeb', 'Minimalist/Fine Line Tattoo', 'minimalist-tattoo', 'Small symbolic tattoos (less than 7cm) like script or symbols.', 15000.00, 'PenTool'),
  ('ea80f5e9-4cf5-4d76-8f89-bad4927ecfeb', 'Custom Designed Tattoo (Hourly)', 'custom-tattoo-hourly', 'Large or complex custom artwork calculated per hour of work.', 20000.00, 'PenTool'),
  ('ea80f5e9-4cf5-4d76-8f89-bad4927ecfeb', 'Sri Lankan Souvenir Flash', 'srilankan-souvenir-flash', 'Pre-drawn cultural tattoos (e.g., Sigiriya, Lion, Lotus, Sun/Moon).', 25000.00, 'PenTool'),
  ('ea80f5e9-4cf5-4d76-8f89-bad4927ecfeb', 'Standard Ear/Nose Piercing', 'standard-piercing', 'Professional piercing using safe sterile single-use needles.', 4000.00, 'PenTool'),
  ('ea80f5e9-4cf5-4d76-8f89-bad4927ecfeb', 'Belly/Navel Piercing', 'navel-piercing', 'Body piercing using titanium or surgical steel starter jewelry.', 6000.00, 'PenTool'),
  ('ea80f5e9-4cf5-4d76-8f89-bad4927ecfeb', 'Old Tattoo Cover-up Design', 'tattoo-cover-up', 'Reworking or completely blanketing an old tattoo with fresh ink.', 30000.00, 'PenTool')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  description = EXCLUDED.description,
  suggested_price = EXCLUDED.suggested_price,
  icon = EXCLUDED.icon;
