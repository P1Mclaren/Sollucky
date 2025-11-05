-- Fix RLS policies to use correct JWT user_metadata path for wallet authentication

-- Fix referrals table RLS policy
DROP POLICY IF EXISTS "Users can view own referrals" ON public.referrals;

CREATE POLICY "Users can view own referrals"
ON public.referrals FOR SELECT
TO authenticated
USING (referrer_wallet = (auth.jwt() -> 'user_metadata' ->> 'wallet_address'));

-- Fix referral_earnings table RLS policy  
DROP POLICY IF EXISTS "Users view own earnings only" ON public.referral_earnings;

CREATE POLICY "Users view own earnings only" 
ON public.referral_earnings FOR SELECT
TO authenticated
USING (wallet_address = (auth.jwt() -> 'user_metadata' ->> 'wallet_address'));

-- Fix fund_splits table RLS policy to use correct JWT path
DROP POLICY IF EXISTS "Only admins can view fund splits" ON public.fund_splits;

CREATE POLICY "Only admins can view fund splits"
ON public.fund_splits FOR SELECT
TO authenticated
USING (has_role((auth.jwt() -> 'user_metadata' ->> 'wallet_address'), 'admin'));

-- Fix audit_log RLS policy to use correct JWT path
DROP POLICY IF EXISTS "Admins can view audit log without wallet exposure" ON public.audit_log;

CREATE POLICY "Admins can view audit log without wallet exposure"
ON public.audit_log FOR SELECT
TO authenticated
USING (has_role((auth.jwt() -> 'user_metadata' ->> 'wallet_address'), 'admin'));