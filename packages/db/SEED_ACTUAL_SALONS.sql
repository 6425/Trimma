-- ==============================================================================
-- SEED ACTUAL REALISTIC SALONS (SRI LANKA CONTEXT)
-- ==============================================================================
-- Run this script in your Supabase SQL Editor.
-- This script completely cleans out all dummy salons/bookings/staff and seeds 
-- 3 premium actual establishments with proper service catalogs and staff.
-- ==============================================================================

-- 1. SAFE DELETION AND SLATE CLEARING (IN REVERSE DEPENDENCY ORDER)
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'payments') THEN
    DELETE FROM public.payments;
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'reschedule_requests') THEN
    DELETE FROM public.reschedule_requests;
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'bookings') THEN
    DELETE FROM public.bookings;
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'staff_reviews') THEN
    DELETE FROM public.staff_reviews;
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'customer_ai_memory') THEN
    DELETE FROM public.customer_ai_memory;
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'salon_staff') THEN
    DELETE FROM public.salon_staff;
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'services') THEN
    DELETE FROM public.services;
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'salons') THEN
    DELETE FROM public.salons;
  END IF;
END $$;

-- 2. ENSURE BASE MONETIZATION PLANS EXIST
INSERT INTO public.subscription_plans (id, name, monthly_price, annual_price, max_staff, max_services, max_images, max_branches)
VALUES 
  ('f0000000-0000-0000-0000-000000000001'::uuid, 'Premium Partner Plan', 9500, 95000, 15, 50, 10, 3)
ON CONFLICT (id) DO NOTHING;

-- 3. ENSURE REPRESENTATIVE BUSINESS OWNER ACCOUNTS EXIST IN USERS TABLE
INSERT INTO public.users (email, full_name, phone, global_role)
VALUES 
  ('owner@crown.com', 'Nishan Crown', '+94771234567', 'salon_owner'),
  ('owner@sutra.com', 'Dilini Sutra', '+94772345678', 'salon_owner'),
  ('owner@vogue.com', 'Kamal Vogue', '+94773456789', 'salon_owner')
ON CONFLICT (email) DO UPDATE SET 
  global_role = 'salon_owner',
  full_name = EXCLUDED.full_name,
  phone = EXCLUDED.phone;

-- ==============================================================================
-- 4. INSERTING ACTUAL PREMIUM SALONS
-- ==============================================================================

-- Salon 1: The Crown Hair & Beauty (Colombo 07)
INSERT INTO public.salons (
  id, owner_email, name, slug, province, district, city, address, location, 
  status, is_verified, is_featured, subscription_plan_id, logo_url, cover_url, 
  description, phone, working_hours
) VALUES (
  '10000000-0000-0000-0000-000000000001'::uuid,
  'owner@crown.com',
  'The Crown Hair & Beauty',
  'the-crown',
  'Western Province',
  'Colombo',
  'Colombo 07',
  '45 Ward Place, Colombo 00700',
  '6.9272, 79.8612',
  'verified',
  true,
  true,
  'f0000000-0000-0000-0000-000000000001'::uuid,
  'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=300&h=300&q=80',
  'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=1200&h=400&q=80',
  'Trimma''s flagship luxury salon partner. Renowned for award-winning styling, couture color treatments, and personalized bridal grooming.',
  '+94112345678',
  'Mon - Sun: 9:00 AM - 8:00 PM'
) ON CONFLICT (id) DO NOTHING;

-- Salon 2: Sutra Wellness Spa & Salon (Negombo)
INSERT INTO public.salons (
  id, owner_email, name, slug, province, district, city, address, location, 
  status, is_verified, is_featured, subscription_plan_id, logo_url, cover_url, 
  description, phone, working_hours
) VALUES (
  '10000000-0000-0000-0000-000000000002'::uuid,
  'owner@sutra.com',
  'Sutra Wellness Spa & Salon',
  'sutra-wellness',
  'Western Province',
  'Gampaha',
  'Negombo',
  '12 Porutota Road, Negombo',
  '7.2274, 79.8407',
  'verified',
  true,
  true,
  'f0000000-0000-0000-0000-000000000001'::uuid,
  'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=300&h=300&q=80',
  'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=1200&h=400&q=80',
  'Indulge in organic hair therapies, traditional Ayurvedic facial massages, and modern nail artistry in a beautiful beachfront wellness pavilion.',
  '+94312345678',
  'Mon - Sun: 8:00 AM - 9:00 PM'
) ON CONFLICT (id) DO NOTHING;

-- Salon 3: Vogue Salon & Academy (Kandy)
INSERT INTO public.salons (
  id, owner_email, name, slug, province, district, city, address, location, 
  status, is_verified, is_featured, subscription_plan_id, logo_url, cover_url, 
  description, phone, working_hours
) VALUES (
  '10000000-0000-0000-0000-000000000003'::uuid,
  'owner@vogue.com',
  'Vogue Salon & Academy',
  'vogue-salon',
  'Central Province',
  'Kandy',
  'Kandy',
  '18 William Gopallawa Mawatha, Kandy',
  '7.2906, 80.6337',
  'verified',
  true,
  false,
  'f0000000-0000-0000-0000-000000000001'::uuid,
  'https://images.unsplash.com/photo-1582095133179-bfd08e2fc6b3?auto=format&fit=crop&w=300&h=300&q=80',
  'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=1200&h=400&q=80',
  'Leading salon in the hill country offering modern haircuts, premium makeup, and advanced styling under the supervision of internationally certified experts.',
  '+94812345678',
  'Tue - Sun: 9:00 AM - 7:30 PM'
) ON CONFLICT (id) DO NOTHING;


-- ==============================================================================
-- 5. SEEDING MENUS (SERVICES CATALOGS)
-- ==============================================================================

-- Salon 1 Menu
INSERT INTO public.services (id, salon_id, name, category, price, duration_min, description, status)
VALUES 
  ('20000000-0000-0000-0000-000000000011'::uuid, '10000000-0000-0000-0000-000000000001'::uuid, 'Signature Balayage & Cut', 'Hair Colour', 18500, 120, 'Premium hand-painted highlights customized to your hair structure, finished with a texturizing hair shaping cut.', 'active'),
  ('20000000-0000-0000-0000-000000000012'::uuid, '10000000-0000-0000-0000-000000000001'::uuid, 'Gentleman Premium Haircut', 'Haircut', 4500, 45, 'Precision crop styling including scalp massage, active hot towel service, and pomade texturizing.', 'active'),
  ('20000000-0000-0000-0000-000000000013'::uuid, '10000000-0000-0000-0000-000000000001'::uuid, 'HydraFacial Glow', 'Facial', 12000, 60, 'Multi-stage deep extraction facial therapy using premium active botanical boosters for ultimate skin rejuvenation.', 'active'),
  ('20000000-0000-0000-0000-000000000014'::uuid, '10000000-0000-0000-0000-000000000001'::uuid, 'Keratin Silk Treatment', 'Hair Treatment', 24000, 150, 'Infuses rich liquid keratin into frizzy locks for perfectly sleek, straight, high-shine hair lasting up to 4 months.', 'active')
ON CONFLICT (id) DO NOTHING;

-- Salon 2 Menu
INSERT INTO public.services (id, salon_id, name, category, price, duration_min, description, status)
VALUES 
  ('20000000-0000-0000-0000-000000000021'::uuid, '10000000-0000-0000-0000-000000000002'::uuid, 'Aromatherapy Hair Spa', 'Hair Spa', 8500, 75, 'Rich essential oil massage combined with high-frequency warm steam misting to restore damaged follicles.', 'active'),
  ('20000000-0000-0000-0000-000000000022'::uuid, '10000000-0000-0000-0000-000000000002'::uuid, 'Sutra Signature Massage', 'Massage', 9500, 60, 'Tranquil full-body massage using warm organic herbal oil compress bags to release muscle fatigue.', 'active'),
  ('20000000-0000-0000-0000-000000000023'::uuid, '10000000-0000-0000-0000-000000000002'::uuid, 'Luxury Gel Manicure', 'Nails', 6000, 45, 'Complete nail shaping, cuticle nourishment, and application of premium chip-resistant UV gel color.', 'active')
ON CONFLICT (id) DO NOTHING;

-- Salon 3 Menu
INSERT INTO public.services (id, salon_id, name, category, price, duration_min, description, status)
VALUES 
  ('20000000-0000-0000-0000-000000000031'::uuid, '10000000-0000-0000-0000-000000000003'::uuid, 'Women Couture Haircut', 'Haircut', 6500, 60, 'Personalized structural cut matching your facial bone structure, including conditioning wash and blow-out styling.', 'active'),
  ('20000000-0000-0000-0000-000000000032'::uuid, '10000000-0000-0000-0000-000000000003'::uuid, 'Bridal Makeup & Styling', 'Makeup', 45000, 180, 'Exclusive HD airbrush makeup contouring, jewelry setting assistance, and premium hair buns arrangement.', 'active'),
  ('20000000-0000-0000-0000-000000000033'::uuid, '10000000-0000-0000-0000-000000000003'::uuid, 'Deep Conditioning Treatment', 'Hair Treatment', 7500, 45, 'Rich protein moisture infusion mask designed to recover hair elasticity and shine from sun or pool styling damage.', 'active')
ON CONFLICT (id) DO NOTHING;


-- ==============================================================================
-- 6. SEEDING QUALIFIED SPECIALIST STAFF
-- ==============================================================================

-- Salon 1 Staff
INSERT INTO public.salon_staff (id, salon_id, name, email, role, skill_level, commission_rate, status)
VALUES 
  ('30000000-0000-0000-0000-000000000011'::uuid, '10000000-0000-0000-0000-000000000001'::uuid, 'Nishan Perera', 'nishan@crown.com', 'barber', 'Senior Stylist', 15.00, 'active'),
  ('30000000-0000-0000-0000-000000000012'::uuid, '10000000-0000-0000-0000-000000000001'::uuid, 'Shalini Silva', 'shalini@crown.com', 'stylist', 'Skin Expert', 12.50, 'active')
ON CONFLICT (id) DO NOTHING;

-- Salon 2 Staff
INSERT INTO public.salon_staff (id, salon_id, name, email, role, skill_level, commission_rate, status)
VALUES 
  ('30000000-0000-0000-0000-000000000021'::uuid, '10000000-0000-0000-0000-000000000002'::uuid, 'Dilini Fernando', 'dilini@sutra.com', 'stylist', 'Senior Therapist', 20.00, 'active'),
  ('30000000-0000-0000-0000-000000000022'::uuid, '10000000-0000-0000-0000-000000000002'::uuid, 'Roshan Alwis', 'roshan@sutra.com', 'stylist', 'Nail Artist', 10.00, 'active')
ON CONFLICT (id) DO NOTHING;

-- Salon 3 Staff
INSERT INTO public.salon_staff (id, salon_id, name, email, role, skill_level, commission_rate, status)
VALUES 
  ('30000000-0000-0000-0000-000000000031'::uuid, '10000000-0000-0000-0000-000000000003'::uuid, 'Kamal Jayasinghe', 'kamal@vogue.com', 'manager', 'Art Director', 18.00, 'active'),
  ('30000000-0000-0000-0000-000000000032'::uuid, '10000000-0000-0000-0000-000000000003'::uuid, 'Priya Gunawardena', 'priya@vogue.com', 'stylist', 'Makeup Artist', 15.00, 'active')
ON CONFLICT (id) DO NOTHING;
