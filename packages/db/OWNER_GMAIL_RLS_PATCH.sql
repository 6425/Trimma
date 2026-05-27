-- ==============================================================================
-- OWNER GMAIL RLS PATCH
-- ==============================================================================
-- Invited salon owners sign in with Google using owner_gmail before owner_email
-- is set. The original UPDATE policy only matched owner_email, blocking the
-- first-login link step after agent onboarding invites.
-- ==============================================================================

DROP POLICY IF EXISTS "Owners can update their own salon" ON public.salons;

CREATE POLICY "Owners can update their own salon"
ON public.salons
FOR UPDATE
USING (
  lower(coalesce(owner_email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
  OR lower(coalesce(owner_gmail, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
)
WITH CHECK (
  lower(coalesce(owner_email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
  OR lower(coalesce(owner_gmail, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
);

SELECT 'Owner Gmail salon update policy applied.' AS status;
