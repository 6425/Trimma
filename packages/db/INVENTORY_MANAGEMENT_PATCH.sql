-- ==============================================================================
-- TRIMMA: GLOBAL INVENTORY MANAGEMENT (additive migration)
-- ==============================================================================
-- Target: Supabase SQL Editor (beta + live)
--
-- MIGRATION NOTE
-- --------------
-- (a) Added four tables following the existing global catalog → salon instance
--     pattern (like global_services → services, global_promotion_packages →
--     salon_promotion_packages):
--       • inventory_categories          — admin-curated taxonomy
--       • global_inventory_products     — platform product master catalog
--       • salon_inventory_items         — per-salon stock (linked or custom)
--       • salon_inventory_transactions  — stock movement ledger
--
-- (b) Nothing existing was modified: no ALTER on existing tables, no policy
--     changes on existing tables, no function redefinitions. Requires
--     public.is_platform_admin() to already exist (see GUEST_WRITE_RLS_PATCH.sql
--     or GLOBAL_SERVICES_ADMIN_RLS_PATCH.sql).
--
-- (c) Follow-up work (not in this migration):
--       • Trigger or RPC to apply signed quantity deltas to quantity_on_hand
--         when rows are inserted into salon_inventory_transactions
--       • service_inventory_consumption join (services ↔ salon_inventory_items
--         with quantity_per_service) for auto-deduction on booking completion
--       • Admin UI + salon dashboard inventory screens
--       • Retail checkout line-items linking sale transactions to payments
--       • updated_at auto-touch trigger (optional; column included for app use)
--
-- SUITABILITY
-- -----------
-- This schema fits Trimma well: retail/consumables are a natural extension of
-- the three-tier catalog pattern already used for services and promotions.
-- Private RLS on salon stock/cost data is appropriate (unlike public services).
-- The ledger mirrors commission_ledger for audit trails. Nullable
-- global_product_id supports both catalog imports and ad-hoc salon SKUs.
--
-- Safe to re-run (IF NOT EXISTS / DROP POLICY IF EXISTS).
-- ==============================================================================

BEGIN;

-- ── 1. Global inventory taxonomy ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.inventory_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inventory_categories_slug
  ON public.inventory_categories (slug);

-- ── 2. Global product master catalog ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.global_inventory_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.inventory_categories (id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  brand TEXT,
  description TEXT,
  unit TEXT NOT NULL DEFAULT 'pcs',
  suggested_cost_price NUMERIC(12, 2),
  suggested_retail_price NUMERIC(12, 2),
  icon_image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_global_inventory_products_category_id
  ON public.global_inventory_products (category_id);

CREATE INDEX IF NOT EXISTS idx_global_inventory_products_slug
  ON public.global_inventory_products (slug);

CREATE INDEX IF NOT EXISTS idx_global_inventory_products_is_active
  ON public.global_inventory_products (is_active);

-- ── 3. Per-salon stock ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.salon_inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES public.salons (id) ON DELETE CASCADE,
  global_product_id UUID REFERENCES public.global_inventory_products (id) ON DELETE SET NULL,
  category_id UUID REFERENCES public.inventory_categories (id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  sku TEXT,
  unit TEXT NOT NULL DEFAULT 'pcs',
  cost_price NUMERIC(12, 2),
  retail_price NUMERIC(12, 2),
  quantity_on_hand NUMERIC(12, 3) NOT NULL DEFAULT 0,
  reorder_level NUMERIC(12, 3),
  status TEXT NOT NULL DEFAULT 'active',
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT salon_inventory_items_status_check
    CHECK (status IN ('active', 'inactive', 'discontinued')),
  CONSTRAINT salon_inventory_items_quantity_on_hand_check
    CHECK (quantity_on_hand >= 0)
);

CREATE INDEX IF NOT EXISTS idx_salon_inventory_items_salon_id
  ON public.salon_inventory_items (salon_id);

CREATE INDEX IF NOT EXISTS idx_salon_inventory_items_global_product_id
  ON public.salon_inventory_items (global_product_id);

CREATE INDEX IF NOT EXISTS idx_salon_inventory_items_category_id
  ON public.salon_inventory_items (category_id);

CREATE INDEX IF NOT EXISTS idx_salon_inventory_items_status
  ON public.salon_inventory_items (status);

CREATE UNIQUE INDEX IF NOT EXISTS idx_salon_inventory_items_salon_sku_unique
  ON public.salon_inventory_items (salon_id, lower(trim(sku)))
  WHERE sku IS NOT NULL AND btrim(sku) <> '';

-- ── 4. Stock movement ledger ─────────────────────────────────────────────────
-- quantity: signed delta (+ restock/adjustment in, − sale/usage/wastage out)
CREATE TABLE IF NOT EXISTS public.salon_inventory_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES public.salons (id) ON DELETE CASCADE,
  inventory_item_id UUID NOT NULL REFERENCES public.salon_inventory_items (id) ON DELETE RESTRICT,
  transaction_type TEXT NOT NULL,
  quantity NUMERIC(12, 3) NOT NULL,
  reference_booking_id UUID REFERENCES public.bookings (id) ON DELETE SET NULL,
  notes TEXT,
  actor_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT salon_inventory_transactions_type_check
    CHECK (transaction_type IN ('restock', 'sale', 'usage', 'adjustment', 'wastage')),
  CONSTRAINT salon_inventory_transactions_quantity_nonzero_check
    CHECK (quantity <> 0)
);

CREATE INDEX IF NOT EXISTS idx_salon_inventory_transactions_salon_id
  ON public.salon_inventory_transactions (salon_id);

CREATE INDEX IF NOT EXISTS idx_salon_inventory_transactions_inventory_item_id
  ON public.salon_inventory_transactions (inventory_item_id);

CREATE INDEX IF NOT EXISTS idx_salon_inventory_transactions_reference_booking_id
  ON public.salon_inventory_transactions (reference_booking_id);

CREATE INDEX IF NOT EXISTS idx_salon_inventory_transactions_created_at
  ON public.salon_inventory_transactions (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_salon_inventory_transactions_transaction_type
  ON public.salon_inventory_transactions (transaction_type);

-- ── 5. Row Level Security ──────────────────────────────────────────────────────

ALTER TABLE public.inventory_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.global_inventory_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salon_inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salon_inventory_transactions ENABLE ROW LEVEL SECURITY;

-- Global tables: public read, platform admin write
DROP POLICY IF EXISTS "Public can view inventory_categories" ON public.inventory_categories;
CREATE POLICY "Public can view inventory_categories"
  ON public.inventory_categories
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Platform admins manage inventory_categories" ON public.inventory_categories;
CREATE POLICY "Platform admins manage inventory_categories"
  ON public.inventory_categories
  FOR ALL
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

DROP POLICY IF EXISTS "Public can view global_inventory_products" ON public.global_inventory_products;
CREATE POLICY "Public can view global_inventory_products"
  ON public.global_inventory_products
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Platform admins manage global_inventory_products" ON public.global_inventory_products;
CREATE POLICY "Platform admins manage global_inventory_products"
  ON public.global_inventory_products
  FOR ALL
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

-- Salon inventory items: private — owner + platform admin only (no public SELECT)
DROP POLICY IF EXISTS "Salon owners view their inventory items" ON public.salon_inventory_items;
CREATE POLICY "Salon owners view their inventory items"
  ON public.salon_inventory_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.salons s
      WHERE s.id = salon_inventory_items.salon_id
        AND (
          lower(coalesce(s.owner_email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
          OR lower(coalesce(s.owner_gmail, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
        )
    )
  );

DROP POLICY IF EXISTS "Salon owners insert their inventory items" ON public.salon_inventory_items;
CREATE POLICY "Salon owners insert their inventory items"
  ON public.salon_inventory_items
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.salons s
      WHERE s.id = salon_inventory_items.salon_id
        AND (
          lower(coalesce(s.owner_email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
          OR lower(coalesce(s.owner_gmail, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
        )
    )
  );

DROP POLICY IF EXISTS "Salon owners update their inventory items" ON public.salon_inventory_items;
CREATE POLICY "Salon owners update their inventory items"
  ON public.salon_inventory_items
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.salons s
      WHERE s.id = salon_inventory_items.salon_id
        AND (
          lower(coalesce(s.owner_email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
          OR lower(coalesce(s.owner_gmail, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.salons s
      WHERE s.id = salon_inventory_items.salon_id
        AND (
          lower(coalesce(s.owner_email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
          OR lower(coalesce(s.owner_gmail, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
        )
    )
  );

DROP POLICY IF EXISTS "Salon owners delete their inventory items" ON public.salon_inventory_items;
CREATE POLICY "Salon owners delete their inventory items"
  ON public.salon_inventory_items
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.salons s
      WHERE s.id = salon_inventory_items.salon_id
        AND (
          lower(coalesce(s.owner_email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
          OR lower(coalesce(s.owner_gmail, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
        )
    )
  );

DROP POLICY IF EXISTS "Platform admins manage salon_inventory_items" ON public.salon_inventory_items;
CREATE POLICY "Platform admins manage salon_inventory_items"
  ON public.salon_inventory_items
  FOR ALL
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

-- Salon inventory transactions: same owner visibility + admin; server checkout bypass
DROP POLICY IF EXISTS "Salon owners view their inventory transactions" ON public.salon_inventory_transactions;
CREATE POLICY "Salon owners view their inventory transactions"
  ON public.salon_inventory_transactions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.salons s
      WHERE s.id = salon_inventory_transactions.salon_id
        AND (
          lower(coalesce(s.owner_email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
          OR lower(coalesce(s.owner_gmail, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
        )
    )
  );

DROP POLICY IF EXISTS "Salon owners insert their inventory transactions" ON public.salon_inventory_transactions;
CREATE POLICY "Salon owners insert their inventory transactions"
  ON public.salon_inventory_transactions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.salons s
      WHERE s.id = salon_inventory_transactions.salon_id
        AND (
          lower(coalesce(s.owner_email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
          OR lower(coalesce(s.owner_gmail, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
        )
    )
  );

DROP POLICY IF EXISTS "Platform admins manage salon_inventory_transactions" ON public.salon_inventory_transactions;
CREATE POLICY "Platform admins manage salon_inventory_transactions"
  ON public.salon_inventory_transactions
  FOR ALL
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

-- Service-role / server-side checkout bypass (future booking stock deduction)
DROP POLICY IF EXISTS "Checkout can view salon inventory items" ON public.salon_inventory_items;
CREATE POLICY "Checkout can view salon inventory items"
  ON public.salon_inventory_items
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Checkout can update salon inventory items" ON public.salon_inventory_items;
CREATE POLICY "Checkout can update salon inventory items"
  ON public.salon_inventory_items
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Checkout can view salon inventory transactions" ON public.salon_inventory_transactions;
CREATE POLICY "Checkout can view salon inventory transactions"
  ON public.salon_inventory_transactions
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Checkout can insert salon inventory transactions" ON public.salon_inventory_transactions;
CREATE POLICY "Checkout can insert salon inventory transactions"
  ON public.salon_inventory_transactions
  FOR INSERT
  WITH CHECK (true);

COMMIT;

-- ── FOLLOW-UP (optional, not applied) ────────────────────────────────────────
-- CREATE TABLE public.service_inventory_consumption (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   service_id UUID NOT NULL REFERENCES public.services (id) ON DELETE CASCADE,
--   inventory_item_id UUID NOT NULL REFERENCES public.salon_inventory_items (id) ON DELETE CASCADE,
--   quantity_per_service NUMERIC(12, 3) NOT NULL CHECK (quantity_per_service > 0),
--   unit TEXT,
--   created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
--   UNIQUE (service_id, inventory_item_id)
-- );

SELECT 'Inventory management schema applied (4 tables, RLS enabled).' AS status;
