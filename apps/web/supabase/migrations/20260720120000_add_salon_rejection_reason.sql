-- Store admin/agent rejection comments on salon requests
ALTER TABLE public.salons
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
