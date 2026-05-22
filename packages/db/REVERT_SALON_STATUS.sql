-- ==============================================================================
-- REVERT SALON STATUS FOR TESTING
-- ==============================================================================
-- Run this in your Supabase SQL Editor to move the salon back to 
-- the Agent's pipeline so you can test the "Complete Verification & Send Invite" flow.
-- ==============================================================================

UPDATE public.salons 
SET onboarding_status = 'ASSIGNED_TO_AGENT'
WHERE name = 'Sampath Barber Saloon (A/C)' 
  AND onboarding_status = 'AGENT_VERIFIED';

SELECT 'Salon successfully reverted to ASSIGNED_TO_AGENT for testing!' AS status;
