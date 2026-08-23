-- Atomically claim a paid Stripe checkout before creating bookings, payments,
-- subscription changes, or commissions. This prevents concurrent completion
-- requests from processing the same PaymentIntent more than once.

ALTER TABLE public.stripe_checkout_pending
  DROP CONSTRAINT IF EXISTS stripe_checkout_pending_status_check;

ALTER TABLE public.stripe_checkout_pending
  ADD CONSTRAINT stripe_checkout_pending_status_check
  CHECK (status IN ('pending', 'processing', 'completed', 'expired'));

CREATE UNIQUE INDEX IF NOT EXISTS unique_stripe_checkout_pending_session
  ON public.stripe_checkout_pending (stripe_session_id)
  WHERE stripe_session_id IS NOT NULL;
