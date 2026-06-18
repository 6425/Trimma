-- ==============================================================================
-- TRIMMA: SALON REQUESTS PATCH (Contact form → Admin Salon Requests)
-- ==============================================================================
-- Stores public contact form submissions from /contact.
-- Run in Supabase SQL Editor. Safe to re-run.
-- Requires: public.is_platform_admin() (see GUEST_WRITE_RLS_PATCH.sql)
-- ==============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.salon_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  business_name TEXT,
  business_type TEXT,
  inquiry_type TEXT NOT NULL,
  message TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'contact_form',
  status TEXT NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'reviewing', 'contacted', 'converted', 'closed', 'spam')),
  admin_notes TEXT,
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  assign_to TEXT
);

CREATE INDEX IF NOT EXISTS idx_salon_requests_status ON public.salon_requests (status);
CREATE INDEX IF NOT EXISTS idx_salon_requests_email ON public.salon_requests (lower(email));
CREATE INDEX IF NOT EXISTS idx_salon_requests_created_at ON public.salon_requests (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_salon_requests_assign_to ON public.salon_requests (assign_to);

ALTER TABLE public.salon_requests ADD COLUMN IF NOT EXISTS assign_to TEXT;

CREATE OR REPLACE FUNCTION public.touch_salon_requests_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_salon_requests_updated_at ON public.salon_requests;
CREATE TRIGGER trg_salon_requests_updated_at
  BEFORE UPDATE ON public.salon_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_salon_requests_updated_at();

ALTER TABLE public.salon_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Platform admins manage salon_requests" ON public.salon_requests;
CREATE POLICY "Platform admins manage salon_requests"
ON public.salon_requests FOR ALL
USING (public.is_platform_admin())
WITH CHECK (public.is_platform_admin());

-- Service role inserts from /api/public/salon-requests bypass RLS.

COMMIT;

SELECT 'salon_requests table and RLS policies applied.' AS status;
