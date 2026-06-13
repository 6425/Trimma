-- ==============================================================================
-- TRIMMA: AGENT REQUESTS PATCH
-- ==============================================================================
-- Stores public agent career applications from /careers and admin review workflow.
-- Run in Supabase SQL Editor. Safe to re-run.
-- ==============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.agent_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  province TEXT NOT NULL,
  district TEXT NOT NULL,
  city TEXT,
  address TEXT NOT NULL,
  nic_no TEXT NOT NULL,
  account_details TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'reviewing', 'approved', 'rejected', 'provisioned')),
  admin_notes TEXT,
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  assigned_regional_head_id UUID REFERENCES public.agents(id) ON DELETE SET NULL,
  commission_rate NUMERIC(5,2) NOT NULL DEFAULT 10,
  sub_agent_split_percent NUMERIC(5,2) DEFAULT 50,
  provisioned_user_email TEXT,
  provisioned_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_agent_requests_status ON public.agent_requests (status);
CREATE INDEX IF NOT EXISTS idx_agent_requests_email ON public.agent_requests (lower(email));
CREATE INDEX IF NOT EXISTS idx_agent_requests_created_at ON public.agent_requests (created_at DESC);

CREATE OR REPLACE FUNCTION public.touch_agent_requests_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_agent_requests_updated_at ON public.agent_requests;
CREATE TRIGGER trg_agent_requests_updated_at
  BEFORE UPDATE ON public.agent_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_agent_requests_updated_at();

ALTER TABLE public.agent_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Platform admins manage agent_requests" ON public.agent_requests;
CREATE POLICY "Platform admins manage agent_requests"
ON public.agent_requests FOR ALL
USING (public.is_platform_admin())
WITH CHECK (public.is_platform_admin());

-- Service role / server API inserts bypass RLS when using SUPABASE_SERVICE_ROLE_KEY.

COMMIT;

SELECT 'agent_requests table and RLS policies applied.' AS status;
