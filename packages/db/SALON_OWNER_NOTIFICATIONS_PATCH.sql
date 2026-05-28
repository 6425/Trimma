-- ==============================================================================
-- SALON OWNER IN-APP NOTIFICATIONS
-- ==============================================================================
-- Run in Supabase SQL Editor after bookings schema is in place.
-- Creates in-app notifications for salon owners (bell icon in dashboard).
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.salon_owner_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  notification_type TEXT NOT NULL DEFAULT 'booking_pending_confirm',
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_salon_owner_notifications_user_email
  ON public.salon_owner_notifications (lower(user_email), created_at DESC);

CREATE INDEX IF NOT EXISTS idx_salon_owner_notifications_salon_id
  ON public.salon_owner_notifications (salon_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_salon_owner_notifications_unread
  ON public.salon_owner_notifications (salon_id, read_at)
  WHERE read_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_salon_owner_notifications_booking_id
  ON public.salon_owner_notifications (booking_id);

ALTER TABLE public.salon_owner_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Salon owners can view their notifications" ON public.salon_owner_notifications;
CREATE POLICY "Salon owners can view their notifications"
ON public.salon_owner_notifications
FOR SELECT
USING (
  lower(user_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  AND salon_id IN (
    SELECT s.id
    FROM public.salons s
    WHERE lower(coalesce(s.owner_email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
       OR lower(coalesce(s.owner_gmail, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
);

DROP POLICY IF EXISTS "Salon owners can update their notifications" ON public.salon_owner_notifications;
CREATE POLICY "Salon owners can update their notifications"
ON public.salon_owner_notifications
FOR UPDATE
USING (
  lower(user_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  AND salon_id IN (
    SELECT s.id
    FROM public.salons s
    WHERE lower(coalesce(s.owner_email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
       OR lower(coalesce(s.owner_gmail, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
)
WITH CHECK (
  lower(user_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  AND salon_id IN (
    SELECT s.id
    FROM public.salons s
    WHERE lower(coalesce(s.owner_email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
       OR lower(coalesce(s.owner_gmail, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
);

-- Service role / server actions bypass RLS for inserts.
GRANT SELECT, UPDATE ON public.salon_owner_notifications TO authenticated;
GRANT ALL ON public.salon_owner_notifications TO service_role;

SELECT 'Salon owner notifications table ready.' AS status;

-- ==============================================================================
-- OPTIONAL: Backfill notifications for existing paid pending bookings
-- Run only after deploying the app code. Safe to re-run (skips duplicates).
-- ==============================================================================

INSERT INTO public.salon_owner_notifications (
  user_email,
  salon_id,
  booking_id,
  notification_type,
  title,
  body,
  metadata
)
SELECT
  lower(coalesce(s.owner_email, s.owner_gmail)) AS user_email,
  b.salon_id,
  b.id AS booking_id,
  'booking_pending_confirm',
  'New paid booking — ' || b.booking_no,
  coalesce(u.full_name, b.customer_email, 'Customer')
    || ' paid the reservation for booking '
    || b.booking_no
    || ' on '
    || b.booking_date
    || ' at '
    || left(b.booking_time::text, 5)
    || '. Confirm to lock the appointment.',
  jsonb_build_object(
    'booking_no', b.booking_no,
    'customer_email', b.customer_email,
    'customer_name', coalesce(u.full_name, b.customer_email),
    'booking_date', b.booking_date,
    'booking_time', b.booking_time,
    'amount', b.amount,
    'payment_status', b.payment_status,
    'booking_status', b.status
  )
FROM public.bookings b
JOIN public.salons s ON s.id = b.salon_id
LEFT JOIN public.users u ON lower(u.email) = lower(b.customer_email)
WHERE b.status = 'pending'
  AND b.payment_status = 'reservation_paid'
  AND coalesce(s.owner_email, s.owner_gmail) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM public.salon_owner_notifications n
    WHERE n.booking_id = b.id
      AND n.notification_type = 'booking_pending_confirm'
  );

SELECT count(*) AS backfilled_pending_paid_notifications
FROM public.salon_owner_notifications
WHERE notification_type = 'booking_pending_confirm';
