-- ==============================================================================
-- TRIMMA: INVENTORY MANAGEMENT — PHASE 2 (additive migration)
-- ==============================================================================
-- Target: Supabase SQL Editor (beta + live)
-- Prerequisite: INVENTORY_MANAGEMENT_PATCH.sql (Phase 1) must already be applied.
--
-- Adds:
--   • Item extensions — track, barcodes, ABC, ROP/par/safety, supplier hints
--   • salon_inventory_locations — storage, station, retail shelf bins
--   • salon_inventory_location_balances — qty per item per location
--   • service_inventory_consumption — standard usage per service (booking hook)
--   • Transaction extensions — transfer type, location refs, applied_at, payment ref
--   • apply_inventory_ledger() — single source of truth for stock balances
--   • Auto-apply trigger on ledger insert
--
-- Safe to re-run (IF NOT EXISTS / DROP POLICY IF EXISTS / CREATE OR REPLACE).
--
-- ⚠️  PREREQUISITE: Run INVENTORY_MANAGEMENT_PATCH.sql FIRST on this database.
--     If you see "relation salon_inventory_transactions does not exist", Phase 1
--     was never applied here (or you are on a different Supabase project).
-- ==============================================================================

DO $$
BEGIN
  IF to_regclass('public.salon_inventory_transactions') IS NULL THEN
    RAISE EXCEPTION
      'Phase 1 missing: run INVENTORY_MANAGEMENT_PATCH.sql in this Supabase project first, then re-run INVENTORY_PHASE2_PATCH.sql.';
  END IF;
END $$;

BEGIN;

-- ── 1. Extend salon_inventory_items (operational fields) ─────────────────────

ALTER TABLE public.salon_inventory_items
  ADD COLUMN IF NOT EXISTS inventory_track TEXT NOT NULL DEFAULT 'retail';

ALTER TABLE public.salon_inventory_items
  ADD COLUMN IF NOT EXISTS manufacturer_barcode TEXT;

ALTER TABLE public.salon_inventory_items
  ADD COLUMN IF NOT EXISTS internal_barcode TEXT;

ALTER TABLE public.salon_inventory_items
  ADD COLUMN IF NOT EXISTS abc_class TEXT;

ALTER TABLE public.salon_inventory_items
  ADD COLUMN IF NOT EXISTS par_level NUMERIC(12, 3);

ALTER TABLE public.salon_inventory_items
  ADD COLUMN IF NOT EXISTS safety_stock NUMERIC(12, 3);

ALTER TABLE public.salon_inventory_items
  ADD COLUMN IF NOT EXISTS reorder_point NUMERIC(12, 3);

ALTER TABLE public.salon_inventory_items
  ADD COLUMN IF NOT EXISTS preferred_supplier_name TEXT;

ALTER TABLE public.salon_inventory_items
  ADD COLUMN IF NOT EXISTS preferred_supplier_sku TEXT;

ALTER TABLE public.salon_inventory_items
  DROP CONSTRAINT IF EXISTS salon_inventory_items_inventory_track_check;

ALTER TABLE public.salon_inventory_items
  ADD CONSTRAINT salon_inventory_items_inventory_track_check
  CHECK (inventory_track IN ('retail', 'backbar', 'disposable'));

ALTER TABLE public.salon_inventory_items
  DROP CONSTRAINT IF EXISTS salon_inventory_items_abc_class_check;

ALTER TABLE public.salon_inventory_items
  ADD CONSTRAINT salon_inventory_items_abc_class_check
  CHECK (abc_class IS NULL OR abc_class IN ('A', 'B', 'C'));

CREATE UNIQUE INDEX IF NOT EXISTS idx_salon_inventory_items_internal_barcode_unique
  ON public.salon_inventory_items (internal_barcode)
  WHERE internal_barcode IS NOT NULL AND btrim(internal_barcode) <> '';

CREATE UNIQUE INDEX IF NOT EXISTS idx_salon_inventory_items_salon_manufacturer_barcode_unique
  ON public.salon_inventory_items (salon_id, manufacturer_barcode)
  WHERE manufacturer_barcode IS NOT NULL AND btrim(manufacturer_barcode) <> '';

CREATE INDEX IF NOT EXISTS idx_salon_inventory_items_inventory_track
  ON public.salon_inventory_items (inventory_track);

CREATE INDEX IF NOT EXISTS idx_salon_inventory_items_abc_class
  ON public.salon_inventory_items (abc_class);

CREATE INDEX IF NOT EXISTS idx_salon_inventory_items_reorder_point
  ON public.salon_inventory_items (reorder_point)
  WHERE reorder_point IS NOT NULL;

-- ── 2. Storage / station locations ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.salon_inventory_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES public.salons (id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  location_type TEXT NOT NULL DEFAULT 'storage',
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT salon_inventory_locations_type_check
    CHECK (location_type IN ('storage', 'station', 'retail_shelf', 'other'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_salon_inventory_locations_salon_code_unique
  ON public.salon_inventory_locations (salon_id, lower(trim(code)));

CREATE INDEX IF NOT EXISTS idx_salon_inventory_locations_salon_id
  ON public.salon_inventory_locations (salon_id);

CREATE INDEX IF NOT EXISTS idx_salon_inventory_locations_location_type
  ON public.salon_inventory_locations (location_type);

-- ── 3. Per-location balances ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.salon_inventory_location_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES public.salons (id) ON DELETE CASCADE,
  inventory_item_id UUID NOT NULL REFERENCES public.salon_inventory_items (id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES public.salon_inventory_locations (id) ON DELETE CASCADE,
  quantity_on_hand NUMERIC(12, 3) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT salon_inventory_location_balances_quantity_check
    CHECK (quantity_on_hand >= 0),
  CONSTRAINT salon_inventory_location_balances_item_location_unique
    UNIQUE (inventory_item_id, location_id)
);

CREATE INDEX IF NOT EXISTS idx_salon_inventory_location_balances_salon_id
  ON public.salon_inventory_location_balances (salon_id);

CREATE INDEX IF NOT EXISTS idx_salon_inventory_location_balances_inventory_item_id
  ON public.salon_inventory_location_balances (inventory_item_id);

CREATE INDEX IF NOT EXISTS idx_salon_inventory_location_balances_location_id
  ON public.salon_inventory_location_balances (location_id);

-- ── 4. Service → inventory recipes (booking completion hook) ─────────────────

CREATE TABLE IF NOT EXISTS public.service_inventory_consumption (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES public.services (id) ON DELETE CASCADE,
  inventory_item_id UUID NOT NULL REFERENCES public.salon_inventory_items (id) ON DELETE CASCADE,
  quantity_per_service NUMERIC(12, 3) NOT NULL,
  unit TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT service_inventory_consumption_quantity_check
    CHECK (quantity_per_service > 0),
  CONSTRAINT service_inventory_consumption_service_item_unique
    UNIQUE (service_id, inventory_item_id)
);

CREATE INDEX IF NOT EXISTS idx_service_inventory_consumption_service_id
  ON public.service_inventory_consumption (service_id);

CREATE INDEX IF NOT EXISTS idx_service_inventory_consumption_inventory_item_id
  ON public.service_inventory_consumption (inventory_item_id);

-- ── 5. Extend ledger (transfer + locations + idempotency) ────────────────────

ALTER TABLE public.salon_inventory_transactions
  ADD COLUMN IF NOT EXISTS from_location_id UUID REFERENCES public.salon_inventory_locations (id) ON DELETE SET NULL;

ALTER TABLE public.salon_inventory_transactions
  ADD COLUMN IF NOT EXISTS to_location_id UUID REFERENCES public.salon_inventory_locations (id) ON DELETE SET NULL;

ALTER TABLE public.salon_inventory_transactions
  ADD COLUMN IF NOT EXISTS applied_at TIMESTAMPTZ;

ALTER TABLE public.salon_inventory_transactions
  ADD COLUMN IF NOT EXISTS reference_payment_id UUID;

DO $$
BEGIN
  IF to_regclass('public.payments') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.table_constraints
      WHERE constraint_schema = 'public'
        AND table_name = 'salon_inventory_transactions'
        AND constraint_name = 'salon_inventory_transactions_reference_payment_id_fkey'
    ) THEN
      ALTER TABLE public.salon_inventory_transactions
        ADD CONSTRAINT salon_inventory_transactions_reference_payment_id_fkey
        FOREIGN KEY (reference_payment_id) REFERENCES public.payments (id) ON DELETE SET NULL;
    END IF;
  END IF;
END $$;

ALTER TABLE public.salon_inventory_transactions
  ADD COLUMN IF NOT EXISTS shrinkage_reason TEXT;

ALTER TABLE public.salon_inventory_transactions
  DROP CONSTRAINT IF EXISTS salon_inventory_transactions_type_check;

ALTER TABLE public.salon_inventory_transactions
  ADD CONSTRAINT salon_inventory_transactions_type_check
  CHECK (transaction_type IN ('restock', 'sale', 'usage', 'adjustment', 'wastage', 'transfer'));

ALTER TABLE public.salon_inventory_transactions
  DROP CONSTRAINT IF EXISTS salon_inventory_transactions_transfer_shape_check;

ALTER TABLE public.salon_inventory_transactions
  ADD CONSTRAINT salon_inventory_transactions_transfer_shape_check
  CHECK (
    transaction_type <> 'transfer'
    OR (
      quantity > 0
      AND from_location_id IS NOT NULL
      AND to_location_id IS NOT NULL
      AND from_location_id <> to_location_id
    )
  );

CREATE INDEX IF NOT EXISTS idx_salon_inventory_transactions_from_location_id
  ON public.salon_inventory_transactions (from_location_id);

CREATE INDEX IF NOT EXISTS idx_salon_inventory_transactions_to_location_id
  ON public.salon_inventory_transactions (to_location_id);

CREATE INDEX IF NOT EXISTS idx_salon_inventory_transactions_applied_at
  ON public.salon_inventory_transactions (applied_at);

CREATE UNIQUE INDEX IF NOT EXISTS idx_salon_inventory_transactions_payment_item_unique
  ON public.salon_inventory_transactions (reference_payment_id, inventory_item_id)
  WHERE reference_payment_id IS NOT NULL;

-- ── 6. Default locations helper ──────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.ensure_salon_inventory_defaults(p_salon_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_salon_id IS NULL THEN
    RAISE EXCEPTION 'salon_id is required';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.salon_inventory_locations
    WHERE salon_id = p_salon_id
      AND location_type = 'storage'
  ) THEN
    INSERT INTO public.salon_inventory_locations (
      salon_id, code, name, location_type, is_default, sort_order
    ) VALUES (
      p_salon_id, 'STOR', 'Storage', 'storage', TRUE, 10
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.salon_inventory_locations
    WHERE salon_id = p_salon_id
      AND location_type = 'station'
  ) THEN
    INSERT INTO public.salon_inventory_locations (
      salon_id, code, name, location_type, is_default, sort_order
    ) VALUES (
      p_salon_id, 'STN', 'Color Bar / Station', 'station', FALSE, 20
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.salon_inventory_locations
    WHERE salon_id = p_salon_id
      AND location_type = 'retail_shelf'
  ) THEN
    INSERT INTO public.salon_inventory_locations (
      salon_id, code, name, location_type, is_default, sort_order
    ) VALUES (
      p_salon_id, 'RETL', 'Retail Shelf', 'retail_shelf', FALSE, 30
    );
  END IF;
END;
$$;

-- ── 7. Ledger application (single source of truth) ───────────────────────────

CREATE OR REPLACE FUNCTION public.apply_inventory_ledger(p_transaction_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tx public.salon_inventory_transactions%ROWTYPE;
  v_item public.salon_inventory_items%ROWTYPE;
  v_new_qty NUMERIC(12, 3);
  v_from_qty NUMERIC(12, 3);
  v_default_storage_id UUID;
BEGIN
  SELECT *
  INTO v_tx
  FROM public.salon_inventory_transactions
  WHERE id = p_transaction_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Inventory transaction % not found', p_transaction_id;
  END IF;

  IF v_tx.applied_at IS NOT NULL THEN
    RETURN;
  END IF;

  SELECT *
  INTO v_item
  FROM public.salon_inventory_items
  WHERE id = v_tx.inventory_item_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Inventory item % not found', v_tx.inventory_item_id;
  END IF;

  IF v_tx.salon_id IS DISTINCT FROM v_item.salon_id THEN
    RAISE EXCEPTION 'Transaction salon_id does not match inventory item';
  END IF;

  PERFORM public.ensure_salon_inventory_defaults(v_tx.salon_id);

  SELECT l.id
  INTO v_default_storage_id
  FROM public.salon_inventory_locations l
  WHERE l.salon_id = v_tx.salon_id
    AND l.location_type = 'storage'
  ORDER BY l.is_default DESC, l.sort_order ASC, l.created_at ASC
  LIMIT 1;

  IF v_tx.transaction_type = 'transfer' THEN
    SELECT b.quantity_on_hand
    INTO v_from_qty
    FROM public.salon_inventory_location_balances b
    WHERE b.inventory_item_id = v_tx.inventory_item_id
      AND b.location_id = v_tx.from_location_id
    FOR UPDATE;

    IF NOT FOUND OR v_from_qty < v_tx.quantity THEN
      RAISE EXCEPTION 'Insufficient stock at source location for transfer';
    END IF;

    UPDATE public.salon_inventory_location_balances
    SET
      quantity_on_hand = quantity_on_hand - v_tx.quantity,
      updated_at = now()
    WHERE inventory_item_id = v_tx.inventory_item_id
      AND location_id = v_tx.from_location_id;

    INSERT INTO public.salon_inventory_location_balances (
      salon_id,
      inventory_item_id,
      location_id,
      quantity_on_hand
    ) VALUES (
      v_tx.salon_id,
      v_tx.inventory_item_id,
      v_tx.to_location_id,
      v_tx.quantity
    )
    ON CONFLICT (inventory_item_id, location_id) DO UPDATE
    SET
      quantity_on_hand = public.salon_inventory_location_balances.quantity_on_hand + EXCLUDED.quantity_on_hand,
      updated_at = now();
  ELSE
    v_new_qty := v_item.quantity_on_hand + v_tx.quantity;

    IF v_new_qty < 0 THEN
      RAISE EXCEPTION 'Insufficient stock for % on item %', v_tx.transaction_type, v_tx.inventory_item_id;
    END IF;

    UPDATE public.salon_inventory_items
    SET
      quantity_on_hand = v_new_qty,
      updated_at = now()
    WHERE id = v_tx.inventory_item_id;

    IF v_tx.quantity > 0 THEN
      INSERT INTO public.salon_inventory_location_balances (
        salon_id,
        inventory_item_id,
        location_id,
        quantity_on_hand
      ) VALUES (
        v_tx.salon_id,
        v_tx.inventory_item_id,
        COALESCE(v_tx.to_location_id, v_default_storage_id),
        v_tx.quantity
      )
      ON CONFLICT (inventory_item_id, location_id) DO UPDATE
      SET
        quantity_on_hand = public.salon_inventory_location_balances.quantity_on_hand + EXCLUDED.quantity_on_hand,
        updated_at = now();
    ELSIF v_tx.quantity < 0 THEN
      SELECT b.quantity_on_hand
      INTO v_from_qty
      FROM public.salon_inventory_location_balances b
      WHERE b.inventory_item_id = v_tx.inventory_item_id
        AND b.location_id = COALESCE(v_tx.from_location_id, v_default_storage_id)
      FOR UPDATE;

      IF NOT FOUND OR v_from_qty < abs(v_tx.quantity) THEN
        RAISE EXCEPTION 'Insufficient stock at location for %', v_tx.transaction_type;
      END IF;

      UPDATE public.salon_inventory_location_balances
      SET
        quantity_on_hand = quantity_on_hand + v_tx.quantity,
        updated_at = now()
      WHERE inventory_item_id = v_tx.inventory_item_id
        AND location_id = COALESCE(v_tx.from_location_id, v_default_storage_id);
    END IF;
  END IF;

  UPDATE public.salon_inventory_transactions
  SET applied_at = now()
  WHERE id = p_transaction_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_apply_inventory_ledger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.apply_inventory_ledger(NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_salon_inventory_transactions_apply_ledger
  ON public.salon_inventory_transactions;

CREATE TRIGGER trg_salon_inventory_transactions_apply_ledger
  AFTER INSERT ON public.salon_inventory_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_apply_inventory_ledger();

GRANT EXECUTE ON FUNCTION public.ensure_salon_inventory_defaults(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.apply_inventory_ledger(UUID) TO authenticated, service_role;

-- ── 8. Row Level Security (new tables) ───────────────────────────────────────

ALTER TABLE public.salon_inventory_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salon_inventory_location_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_inventory_consumption ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Salon owners view their inventory locations" ON public.salon_inventory_locations;
CREATE POLICY "Salon owners view their inventory locations"
  ON public.salon_inventory_locations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.salons s
      WHERE s.id = salon_inventory_locations.salon_id
        AND (
          lower(coalesce(s.owner_email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
          OR lower(coalesce(s.owner_gmail, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
        )
    )
  );

DROP POLICY IF EXISTS "Salon owners manage their inventory locations" ON public.salon_inventory_locations;
CREATE POLICY "Salon owners manage their inventory locations"
  ON public.salon_inventory_locations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.salons s
      WHERE s.id = salon_inventory_locations.salon_id
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
      WHERE s.id = salon_inventory_locations.salon_id
        AND (
          lower(coalesce(s.owner_email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
          OR lower(coalesce(s.owner_gmail, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
        )
    )
  );

DROP POLICY IF EXISTS "Platform admins manage salon_inventory_locations" ON public.salon_inventory_locations;
CREATE POLICY "Platform admins manage salon_inventory_locations"
  ON public.salon_inventory_locations
  FOR ALL
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

DROP POLICY IF EXISTS "Salon owners view their location balances" ON public.salon_inventory_location_balances;
CREATE POLICY "Salon owners view their location balances"
  ON public.salon_inventory_location_balances
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.salons s
      WHERE s.id = salon_inventory_location_balances.salon_id
        AND (
          lower(coalesce(s.owner_email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
          OR lower(coalesce(s.owner_gmail, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
        )
    )
  );

DROP POLICY IF EXISTS "Platform admins manage salon_inventory_location_balances" ON public.salon_inventory_location_balances;
CREATE POLICY "Platform admins manage salon_inventory_location_balances"
  ON public.salon_inventory_location_balances
  FOR ALL
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

DROP POLICY IF EXISTS "Checkout can view salon inventory locations" ON public.salon_inventory_locations;
CREATE POLICY "Checkout can view salon inventory locations"
  ON public.salon_inventory_locations
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Checkout can view salon inventory location balances" ON public.salon_inventory_location_balances;
CREATE POLICY "Checkout can view salon inventory location balances"
  ON public.salon_inventory_location_balances
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Checkout can upsert salon inventory location balances" ON public.salon_inventory_location_balances;
CREATE POLICY "Checkout can upsert salon inventory location balances"
  ON public.salon_inventory_location_balances
  FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Salon owners view their service inventory recipes" ON public.service_inventory_consumption;
CREATE POLICY "Salon owners view their service inventory recipes"
  ON public.service_inventory_consumption
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.services svc
      JOIN public.salons s ON s.id = svc.salon_id
      WHERE svc.id = service_inventory_consumption.service_id
        AND (
          lower(coalesce(s.owner_email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
          OR lower(coalesce(s.owner_gmail, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
        )
    )
  );

DROP POLICY IF EXISTS "Salon owners manage their service inventory recipes" ON public.service_inventory_consumption;
CREATE POLICY "Salon owners manage their service inventory recipes"
  ON public.service_inventory_consumption
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.services svc
      JOIN public.salons s ON s.id = svc.salon_id
      WHERE svc.id = service_inventory_consumption.service_id
        AND (
          lower(coalesce(s.owner_email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
          OR lower(coalesce(s.owner_gmail, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.services svc
      JOIN public.salon_inventory_items item ON item.id = service_inventory_consumption.inventory_item_id
      JOIN public.salons s ON s.id = svc.salon_id
      WHERE svc.id = service_inventory_consumption.service_id
        AND svc.salon_id = item.salon_id
        AND (
          lower(coalesce(s.owner_email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
          OR lower(coalesce(s.owner_gmail, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
        )
    )
  );

DROP POLICY IF EXISTS "Platform admins manage service_inventory_consumption" ON public.service_inventory_consumption;
CREATE POLICY "Platform admins manage service_inventory_consumption"
  ON public.service_inventory_consumption
  FOR ALL
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

DROP POLICY IF EXISTS "Checkout can view service inventory recipes" ON public.service_inventory_consumption;
CREATE POLICY "Checkout can view service inventory recipes"
  ON public.service_inventory_consumption
  FOR SELECT
  USING (true);

COMMIT;

SELECT 'Inventory Phase 2 applied (locations, barcodes, ledger RPC, service recipes).' AS status;
