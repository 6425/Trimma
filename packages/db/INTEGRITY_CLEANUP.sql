-- ==============================================================================
-- TRIMMA OS: DATABASE INTEGRITY CLEANUP SCRIPT
-- ==============================================================================
-- This script removes redundant tables and columns created during multiple
-- early migration phases, establishing a single source of truth for the API.
-- ==============================================================================

-- 1. DROP REDUNDANT STAFF TABLE
-- Our architecture uses 'salon_staff' (which contains working_hours JSONB)
-- We use CASCADE to drop any old foreign keys pointing to the deprecated table.
DROP TABLE IF EXISTS staff CASCADE;

-- 2. RE-WIRE FOREIGN KEYS
-- Ensure the bookings table points to the correct salon_staff table
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_staff_id_fkey;

ALTER TABLE bookings
  ADD CONSTRAINT bookings_staff_id_fkey 
  FOREIGN KEY (staff_id) 
  REFERENCES salon_staff(id)
  ON DELETE SET NULL;

-- Ensure bookings salon_id points correctly
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_salon_id_fkey;

ALTER TABLE bookings
  ADD CONSTRAINT bookings_salon_id_fkey
  FOREIGN KEY (salon_id)
  REFERENCES salons(id)
  ON DELETE CASCADE;

-- Ensure bookings service_id points correctly
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_service_id_fkey;

ALTER TABLE bookings
  ADD CONSTRAINT bookings_service_id_fkey
  FOREIGN KEY (service_id)
  REFERENCES services(id)
  ON DELETE SET NULL;

-- 3. CLEANUP SERVICES TABLE
-- Drop the dependent RLS policy first
DROP POLICY IF EXISTS "Public can view services of active salons" ON services;

-- Drop the redundant column
ALTER TABLE services DROP COLUMN IF EXISTS is_active CASCADE;

-- Recreate the RLS policy using the new 'status' column
CREATE POLICY "Public can view services of active salons" 
ON services FOR SELECT 
USING (status = 'active');

-- 4. VERIFY SALON_STAFF FOREIGN KEYS
ALTER TABLE salon_staff DROP CONSTRAINT IF EXISTS salon_staff_salon_id_fkey;

ALTER TABLE salon_staff
  ADD CONSTRAINT salon_staff_salon_id_fkey
  FOREIGN KEY (salon_id)
  REFERENCES salons(id)
  ON DELETE CASCADE;

-- 5. VERIFY SERVICES FOREIGN KEYS
ALTER TABLE services DROP CONSTRAINT IF EXISTS services_salon_id_fkey;

ALTER TABLE services
  ADD CONSTRAINT services_salon_id_fkey
  FOREIGN KEY (salon_id)
  REFERENCES salons(id)
  ON DELETE CASCADE;

-- ==============================================================================
-- END OF SCRIPT
-- ==============================================================================
