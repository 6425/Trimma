-- ==============================================================================
-- UPDATE SALON GMAIL FOR ALREADY MOVED SALON
-- ==============================================================================
-- Run this in your Supabase SQL Editor to manually set the Owner Gmail 
-- for the salon that was already moved to the Pipeline.
-- ==============================================================================

UPDATE public.salons 
SET owner_gmail = 'sampath.trimma@gmail.com'
WHERE name = 'Sampath Barber Saloon (A/C)' 
  AND onboarding_status = 'ASSIGNED_TO_AGENT';

SELECT 'Salon owner_gmail updated successfully!' AS status;
