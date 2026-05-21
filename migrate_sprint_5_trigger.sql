-- TRIMMA AI: Sprint 5 Financial Trigger Migration
-- Run this in your Supabase SQL Editor.

-- Drop trigger if it already exists
DROP TRIGGER IF EXISTS trigger_process_booking_commission ON public.bookings;
DROP FUNCTION IF EXISTS public.process_booking_commission();

-- Create the trigger function
CREATE OR REPLACE FUNCTION public.process_booking_commission()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_salon_id UUID;
    v_amount NUMERIC;
    v_platform_rate NUMERIC;
    v_salon_rate NUMERIC;
    v_platform_cut NUMERIC;
    v_salon_cut NUMERIC;
    v_active_master_id UUID;
    v_platform_user_id UUID := '00000000-0000-0000-0000-000000000000'; -- Placeholder for Platform Admin User ID, replace if needed
BEGIN
    -- ONLY process if the status CHANGED
    IF NEW.status = OLD.status THEN
        RETURN NEW;
    END IF;

    -- Store booking details
    v_salon_id := NEW.salon_id;
    v_amount := NEW.amount; -- Assuming bookings table has an 'amount' column

    -- ---------------------------------------------------------
    -- FORWARD COMMISSION (Booking Completed)
    -- ---------------------------------------------------------
    IF NEW.status = 'completed' THEN
        
        -- 1. Get Global Commission Rate (Fallback to 4/96 if none found)
        SELECT id, platform_percentage, salon_percentage 
        INTO v_active_master_id, v_platform_rate, v_salon_rate
        FROM public.commission_master 
        WHERE commission_type = 'booking' AND active = true 
        ORDER BY created_at DESC LIMIT 1;

        IF NOT FOUND THEN
            v_platform_rate := 4.0;
            v_salon_rate := 96.0;
        END IF;

        -- 2. Check for Salon Override
        SELECT override_rate INTO v_platform_rate
        FROM public.salon_commission_override
        WHERE salon_id = v_salon_id AND commission_id = v_active_master_id;

        IF FOUND THEN
            v_salon_rate := 100.0 - v_platform_rate;
        END IF;

        -- 3. Calculate Math
        v_platform_cut := ROUND((v_amount * (v_platform_rate / 100.0))::numeric, 2);
        v_salon_cut := v_amount - v_platform_cut; -- Ensures no penny rounding loss

        -- 4. Create Ledger Entries
        INSERT INTO public.commission_ledger (booking_id, entity_type, entity_id, amount, direction, description)
        VALUES 
            (NEW.id, 'platform', v_platform_user_id, v_platform_cut, 'credit', 'Platform fee for booking ' || NEW.id),
            (NEW.id, 'salon', v_salon_id, v_salon_cut, 'credit', 'Salon payout for booking ' || NEW.id);

        -- 5. Update Wallet Accounts (Upsert)
        INSERT INTO public.wallet_accounts (entity_type, entity_id, balance)
        VALUES ('platform', v_platform_user_id, v_platform_cut)
        ON CONFLICT (entity_type, entity_id) DO UPDATE 
        SET balance = wallet_accounts.balance + EXCLUDED.balance, updated_at = NOW();

        INSERT INTO public.wallet_accounts (entity_type, entity_id, balance)
        VALUES ('salon', v_salon_id, v_salon_cut)
        ON CONFLICT (entity_type, entity_id) DO UPDATE 
        SET balance = wallet_accounts.balance + EXCLUDED.balance, updated_at = NOW();

    -- ---------------------------------------------------------
    -- REVERSAL COMMISSION (Booking Refunded)
    -- ---------------------------------------------------------
    ELSIF NEW.status = 'refunded' AND OLD.status = 'completed' THEN
        
        -- Find original ledger amounts to reverse
        SELECT amount INTO v_platform_cut FROM public.commission_ledger 
        WHERE booking_id = NEW.id AND entity_type = 'platform' AND direction = 'credit' LIMIT 1;
        
        SELECT amount INTO v_salon_cut FROM public.commission_ledger 
        WHERE booking_id = NEW.id AND entity_type = 'salon' AND direction = 'credit' LIMIT 1;

        IF FOUND THEN
            -- Create Debit Ledger Entries
            INSERT INTO public.commission_ledger (booking_id, entity_type, entity_id, amount, direction, description)
            VALUES 
                (NEW.id, 'platform', v_platform_user_id, v_platform_cut, 'debit', 'Reversal platform fee for refunded booking ' || NEW.id),
                (NEW.id, 'salon', v_salon_id, v_salon_cut, 'debit', 'Reversal salon payout for refunded booking ' || NEW.id);

            -- Deduct from Wallet Accounts
            UPDATE public.wallet_accounts SET balance = balance - v_platform_cut, updated_at = NOW() 
            WHERE entity_type = 'platform' AND entity_id = v_platform_user_id;

            UPDATE public.wallet_accounts SET balance = balance - v_salon_cut, updated_at = NOW() 
            WHERE entity_type = 'salon' AND entity_id = v_salon_id;
        END IF;

    END IF;

    RETURN NEW;
END;
$$;

-- Attach the trigger to the bookings table
CREATE TRIGGER trigger_process_booking_commission
AFTER UPDATE OF status ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.process_booking_commission();
