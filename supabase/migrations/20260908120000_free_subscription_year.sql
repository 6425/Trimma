-- Give every salon subscription package a fixed 365-day free-access period.
--
-- This migration deliberately does not create a recurring payment, store a card,
-- or schedule an automatic charge. A future paid renewal must be a separate,
-- explicitly authorised checkout.

BEGIN;

ALTER TABLE public.subscription_plans
  ADD COLUMN IF NOT EXISTS list_monthly_price NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS intro_monthly_price NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS monthly_price NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS annual_price NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_percentage NUMERIC DEFAULT 0;

UPDATE public.subscription_plans
SET
  list_monthly_price = 0,
  intro_monthly_price = 0,
  monthly_price = 0,
  annual_price = 0,
  discount_percentage = 0;

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID REFERENCES public.salons(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES public.subscription_plans(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'past_due', 'canceled', 'trialing')),
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS activation_source TEXT,
  ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- A salon receives this free period once. Changing package must never restart
-- the 365-day clock.
CREATE UNIQUE INDEX IF NOT EXISTS unique_subscriptions_free_365_per_salon
  ON public.subscriptions (salon_id)
  WHERE activation_source = 'free_365';

CREATE INDEX IF NOT EXISTS idx_subscriptions_free_365_expiry
  ON public.subscriptions (end_date)
  WHERE activation_source = 'free_365';

-- Keep future provisioning/admin paths inside the same one-time free-access
-- policy. The trigger never writes back to salons, so it cannot recurse. A
-- package switch updates only plan_id and audit state; dates are immutable.
CREATE OR REPLACE FUNCTION public.sync_free_subscription_from_salon_plan()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_now TIMESTAMPTZ := clock_timestamp();
  v_subscription_id UUID;
BEGIN
  IF NEW.subscription_plan_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT existing.id
  INTO v_subscription_id
  FROM public.subscriptions AS existing
  WHERE existing.salon_id = NEW.id
    AND existing.activation_source = 'free_365'
  ORDER BY existing.created_at ASC, existing.id ASC
  LIMIT 1
  FOR UPDATE;

  IF v_subscription_id IS NULL THEN
    INSERT INTO public.subscriptions (
      salon_id,
      plan_id,
      status,
      start_date,
      end_date,
      activation_source,
      auto_renew,
      updated_at
    )
    VALUES (
      NEW.id,
      NEW.subscription_plan_id,
      'active',
      v_now,
      v_now + INTERVAL '365 days',
      'free_365',
      FALSE,
      v_now
    )
    ON CONFLICT DO NOTHING;
  ELSE
    UPDATE public.subscriptions AS existing
    SET
      plan_id = NEW.subscription_plan_id,
      auto_renew = FALSE,
      updated_at = v_now
    WHERE existing.id = v_subscription_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_free_subscription_from_salon_plan
  ON public.salons;
CREATE TRIGGER sync_free_subscription_from_salon_plan
AFTER INSERT OR UPDATE OF subscription_plan_id
  ON public.salons
FOR EACH ROW
WHEN (NEW.subscription_plan_id IS NOT NULL)
EXECUTE FUNCTION public.sync_free_subscription_from_salon_plan();

REVOKE ALL ON FUNCTION public.sync_free_subscription_from_salon_plan() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.sync_free_subscription_from_salon_plan() FROM anon;
REVOKE ALL ON FUNCTION public.sync_free_subscription_from_salon_plan() FROM authenticated;

-- Existing salons with a selected package receive the full free year from the
-- time this migration is applied. Historical payment/subscription rows remain
-- untouched.
INSERT INTO public.subscriptions (
  salon_id,
  plan_id,
  status,
  start_date,
  end_date,
  activation_source,
  auto_renew,
  updated_at
)
SELECT
  salons.id,
  salons.subscription_plan_id,
  'active',
  transaction_timestamp(),
  transaction_timestamp() + INTERVAL '365 days',
  'free_365',
  FALSE,
  transaction_timestamp()
FROM public.salons AS salons
WHERE salons.subscription_plan_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM public.subscriptions AS existing
    WHERE existing.salon_id = salons.id
      AND existing.activation_source = 'free_365'
  )
ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.activate_free_salon_subscription(
  p_salon_id UUID,
  p_plan_id UUID
)
RETURNS TABLE (
  subscription_id UUID,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_now TIMESTAMPTZ := clock_timestamp();
  v_subscription_id UUID;
  v_start_date TIMESTAMPTZ;
  v_end_date TIMESTAMPTZ;
  v_status TEXT;
BEGIN
  IF p_salon_id IS NULL OR p_plan_id IS NULL THEN
    RAISE EXCEPTION 'Salon and subscription package are required.';
  END IF;

  -- Serialise simultaneous selections for the same salon.
  PERFORM 1
  FROM public.salons AS salon
  WHERE salon.id = p_salon_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Salon was not found.';
  END IF;

  PERFORM 1
  FROM public.subscription_plans AS plan
  WHERE plan.id = p_plan_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Subscription package was not found.';
  END IF;

  SELECT
    existing.id,
    existing.start_date,
    existing.end_date,
    existing.status
  INTO
    v_subscription_id,
    v_start_date,
    v_end_date,
    v_status
  FROM public.subscriptions AS existing
  WHERE existing.salon_id = p_salon_id
    AND existing.activation_source = 'free_365'
  ORDER BY existing.created_at ASC, existing.id ASC
  LIMIT 1
  FOR UPDATE;

  IF v_subscription_id IS NULL THEN
    INSERT INTO public.subscriptions (
      salon_id,
      plan_id,
      status,
      start_date,
      end_date,
      activation_source,
      auto_renew,
      updated_at
    )
    VALUES (
      p_salon_id,
      p_plan_id,
      'active',
      v_now,
      v_now + INTERVAL '365 days',
      'free_365',
      FALSE,
      v_now
    )
    RETURNING
      subscriptions.id,
      subscriptions.start_date,
      subscriptions.end_date,
      subscriptions.status
    INTO
      v_subscription_id,
      v_start_date,
      v_end_date,
      v_status;
  ELSE
    IF v_end_date <= v_now THEN
      RAISE EXCEPTION 'The 365-day free access period has ended. A new subscription must be activated.';
    END IF;

    UPDATE public.subscriptions AS existing
    SET
      plan_id = p_plan_id,
      status = 'active',
      auto_renew = FALSE,
      updated_at = v_now
    WHERE existing.id = v_subscription_id
    RETURNING
      existing.start_date,
      existing.end_date,
      existing.status
    INTO
      v_start_date,
      v_end_date,
      v_status;
  END IF;

  UPDATE public.salons AS salon
  SET subscription_plan_id = p_plan_id
  WHERE salon.id = p_salon_id;

  RETURN QUERY
  SELECT v_subscription_id, v_start_date, v_end_date, v_status;
END;
$$;

REVOKE ALL ON FUNCTION public.activate_free_salon_subscription(UUID, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.activate_free_salon_subscription(UUID, UUID) FROM anon;
REVOKE ALL ON FUNCTION public.activate_free_salon_subscription(UUID, UUID) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.activate_free_salon_subscription(UUID, UUID) TO service_role;

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Public pricing remains readable, but package mutations stay behind the
-- service-role-backed admin actions.
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage subscription plans" ON public.subscription_plans;
DROP POLICY IF EXISTS "Public can view subscription plans" ON public.subscription_plans;
CREATE POLICY "Public can view subscription plans"
  ON public.subscription_plans
  FOR SELECT
  USING (TRUE);

COMMIT;
