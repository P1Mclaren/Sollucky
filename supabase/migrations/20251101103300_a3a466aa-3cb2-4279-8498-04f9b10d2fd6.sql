-- Fix Issue #3: Prevent self-referrals with database constraint
ALTER TABLE public.referrals
ADD CONSTRAINT no_self_referral
CHECK (referrer_wallet != referred_wallet);

-- Fix Issue #1: Restrict admin data access via RLS policies

-- Update fund_splits to restrict direct client access
DROP POLICY IF EXISTS "Public can view fund splits" ON public.fund_splits;
CREATE POLICY "Service role only for fund_splits" ON public.fund_splits
  FOR SELECT USING (false);

-- Update withdrawal_requests to allow users to view only their own
DROP POLICY IF EXISTS "Users can view their own withdrawals" ON public.withdrawal_requests;
CREATE POLICY "Users view own withdrawals only" ON public.withdrawal_requests
  FOR SELECT USING (wallet_address = current_setting('request.headers', true)::json->>'x-wallet-address');

-- Update referral_earnings to allow users to view only their own
DROP POLICY IF EXISTS "Users can view their own earnings" ON public.referral_earnings;
DROP POLICY IF EXISTS "Service can manage earnings" ON public.referral_earnings;

CREATE POLICY "Users view own earnings only" ON public.referral_earnings
  FOR SELECT USING (wallet_address = current_setting('request.headers', true)::json->>'x-wallet-address');

CREATE POLICY "Service role manages earnings" ON public.referral_earnings
  FOR ALL USING (false) WITH CHECK (false);