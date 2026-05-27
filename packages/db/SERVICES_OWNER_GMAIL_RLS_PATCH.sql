-- ==============================================================================
-- SERVICES OWNER GMAIL RLS PATCH
-- Salon owners invited via owner_gmail must manage services after Google login.
-- ==============================================================================

DROP POLICY IF EXISTS "Owners can insert their own services" ON public.services;
CREATE POLICY "Owners can insert their own services"
ON public.services FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.salons s
    WHERE s.id = services.salon_id
      AND (
        lower(coalesce(s.owner_email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
        OR lower(coalesce(s.owner_gmail, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
      )
  )
);

DROP POLICY IF EXISTS "Owners can update their own services" ON public.services;
CREATE POLICY "Owners can update their own services"
ON public.services FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.salons s
    WHERE s.id = services.salon_id
      AND (
        lower(coalesce(s.owner_email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
        OR lower(coalesce(s.owner_gmail, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
      )
  )
);

DROP POLICY IF EXISTS "Owners can delete their own services" ON public.services;
CREATE POLICY "Owners can delete their own services"
ON public.services FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.salons s
    WHERE s.id = services.salon_id
      AND (
        lower(coalesce(s.owner_email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
        OR lower(coalesce(s.owner_gmail, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
      )
  )
);

SELECT 'Services owner Gmail RLS policies applied.' AS status;
