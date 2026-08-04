-- TRIMMA AI: CONSOLIDATED MARKETPLACE SETUP
-- 1. Updates Categories with proper spelling, slugs, and Lucide icons
-- 2. Creates the Global Services catalog table
-- 3. Connects individual salon services to the global catalog

-- ==========================================
-- 1. CATEGORY SYNCHRONIZATION
-- ==========================================
-- Using the specific UUIDs and names requested by user
-- Note: 'Men''s Grooming' uses double single-quotes for SQL escaping
INSERT INTO categories (id, name, slug, icon)
VALUES 
  ('e573447d-35c9-40d7-8a71-661fd05ba3a1', 'Baber Salon', 'barber-salon', 'Scissors'),
  ('ea03b018-c45f-483a-9857-77058ac7c3ce', 'Beauty Parlours', 'beauty-parlours', 'Sparkles'),
  ('6bd05eaf-ee0c-4f69-91eb-b14ac453c143', 'Birdal & Beauty', 'bridal-and-beauty', 'Heart'),
  ('62419cc9-15a8-4ef2-b42c-c65442a4ec10', 'Kids & Family', 'kids-and-family', 'Users'),
  ('2450ceb4-9ccc-43bd-b47c-1bf287328bae', 'Men''s Grooming', 'mens-grooming', 'User'),
  ('7faebaac-aa28-41cc-867c-5451b39b68d6', 'Nail Studio', 'nail-studio', 'Paintbrush'),
  ('7ffa2d9b-f871-4e50-89ac-45e5a85cc686', 'Skincare Clinics', 'skincare-clinics', 'Droplet'),
  ('f6b46e37-5898-4ed3-9324-979164f089fe', 'Spa & Wellness', 'spa-and-wellness', 'Flower2'),
  ('ea80f5e9-4cf5-4d76-8f89-bad4927ecfeb', 'Tattoo Studio', 'tattoo-studio', 'PenTool'),
  ('8853ac93-ef53-4eb4-9704-ddc17d527c06', 'Yoga Studio', 'yoga-studio', 'Activity')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  icon = EXCLUDED.icon;

-- ==========================================
-- 2. GLOBAL SERVICES CATALOG TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS global_services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    suggested_price DECIMAL(10, 2),
    suggested_duration_minutes INT DEFAULT 30,
    icon VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 3. LINKING SALON SERVICES
-- ==========================================
-- Adding reference column if not present
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='services' AND column_name='global_service_id') THEN
        ALTER TABLE services ADD COLUMN global_service_id UUID REFERENCES global_services(id) ON DELETE SET NULL;
    END IF;
END $$;

-- ==========================================
-- 4. INITIAL SAMPLE SEED
-- ==========================================
INSERT INTO global_services (name, slug, category_id, suggested_price, suggested_duration_minutes, icon)
VALUES 
  ('Classic Haircut', 'classic-haircut', 'e573447d-35c9-40d7-8a71-661fd05ba3a1', 1500.00, 30, 'Scissors'),
  ('Bridal Package', 'bridal-package', '6bd05eaf-ee0c-4f69-91eb-b14ac453c143', 45000.00, 180, 'Heart')
ON CONFLICT (slug) DO NOTHING;
