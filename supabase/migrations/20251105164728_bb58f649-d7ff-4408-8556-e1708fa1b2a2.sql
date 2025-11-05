-- Fix RLS policies to protect user data and prevent unauthorized actions

-- 1. Fix referral_codes table
DROP POLICY IF EXISTS "Anyone can read referral codes" ON public.referral_codes;
DROP POLICY IF EXISTS "Anyone can create referral code" ON public.referral_codes;

CREATE POLICY "Users can read their own referral codes"
ON public.referral_codes
FOR SELECT
TO authenticated
USING (wallet_address = get_user_wallet());

CREATE POLICY "Users can create their own referral codes"
ON public.referral_codes
FOR INSERT
TO authenticated
WITH CHECK (wallet_address = get_user_wallet());

-- 2. Fix referral_earnings table
DROP POLICY IF EXISTS "Anyone can read referral earnings" ON public.referral_earnings;

CREATE POLICY "Users can read their own referral earnings"
ON public.referral_earnings
FOR SELECT
TO authenticated
USING (wallet_address = get_user_wallet());

-- 3. Fix referrals table
DROP POLICY IF EXISTS "Anyone can read referrals" ON public.referrals;
DROP POLICY IF EXISTS "Anyone can create referrals" ON public.referrals;

CREATE POLICY "Users can read their referrals"
ON public.referrals
FOR SELECT
TO authenticated
USING (referrer_wallet = get_user_wallet());

CREATE POLICY "Service role can create referrals"
ON public.referrals
FOR INSERT
TO service_role
WITH CHECK (true);

-- 4. Fix lottery_tickets table
DROP POLICY IF EXISTS "Anyone can read lottery tickets" ON public.lottery_tickets;

CREATE POLICY "Users can read their own lottery tickets"
ON public.lottery_tickets
FOR SELECT
TO authenticated
USING (wallet_address = get_user_wallet());

-- 5. Fix processed_transactions table
DROP POLICY IF EXISTS "Anyone can read processed transactions" ON public.processed_transactions;

CREATE POLICY "Users can read their own transactions"
ON public.processed_transactions
FOR SELECT
TO authenticated
USING (wallet_address = get_user_wallet());

-- 6. Fix tickets table
DROP POLICY IF EXISTS "Anyone can read tickets" ON public.tickets;

CREATE POLICY "Users can read their own tickets"
ON public.tickets
FOR SELECT
TO authenticated
USING (wallet_address = get_user_wallet());

-- 7. Fix withdrawal_requests table
DROP POLICY IF EXISTS "Anyone can create withdrawal requests" ON public.withdrawal_requests;

CREATE POLICY "Users can create their own withdrawal requests"
ON public.withdrawal_requests
FOR INSERT
TO authenticated
WITH CHECK (wallet_address = get_user_wallet());

CREATE POLICY "Users can read their own withdrawal requests"
ON public.withdrawal_requests
FOR SELECT
TO authenticated
USING (wallet_address = get_user_wallet());

-- 8. Fix test_mode_state table (restrict to admins only)
DROP POLICY IF EXISTS "Anyone can read test mode state" ON public.test_mode_state;

CREATE POLICY "Admins can read test mode state"
ON public.test_mode_state
FOR SELECT
TO authenticated
USING (has_role(get_user_wallet(), 'admin'::app_role));

-- Add public policy for unauthenticated users to check test mode status only
CREATE POLICY "Public can check if test mode is enabled"
ON public.test_mode_state
FOR SELECT
TO anon
USING (true);