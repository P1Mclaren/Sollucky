-- Fix RLS policies to use secure get_user_wallet() function instead of user_metadata
-- This prevents users from modifying their metadata to access other users' data

-- Fix referral_earnings policy
DROP POLICY IF EXISTS "Users can view own earnings" ON public.referral_earnings;
CREATE POLICY "Users can view own earnings" 
ON public.referral_earnings 
FOR SELECT 
USING (wallet_address = get_user_wallet());

-- Fix withdrawal_requests policy  
DROP POLICY IF EXISTS "Users can view own withdrawal requests" ON public.withdrawal_requests;
CREATE POLICY "Users can view own withdrawal requests" 
ON public.withdrawal_requests 
FOR SELECT 
USING (wallet_address = get_user_wallet());

-- Fix lottery_winners policy
DROP POLICY IF EXISTS "Public can view winners who opted in" ON public.lottery_winners;
CREATE POLICY "Public can view winners who opted in" 
ON public.lottery_winners 
FOR SELECT 
USING ((show_on_wall_of_fame = true) OR (wallet_address = get_user_wallet()));