-- Add 'assign_to' column to the salons table to support agent assignments
ALTER TABLE public.salons
ADD COLUMN IF NOT EXISTS assign_to TEXT REFERENCES public.users(email) ON DELETE SET NULL;

-- Create an index to improve query performance for agent assignment lookups
CREATE INDEX IF NOT EXISTS idx_salons_assign_to ON public.salons(assign_to);
