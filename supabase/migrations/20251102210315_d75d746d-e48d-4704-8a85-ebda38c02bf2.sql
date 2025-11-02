-- Fix RLS policy for referral_earnings to use authenticated user's wallet address from metadata
DROP POLICY IF EXISTS "Users view own earnings only" ON public.referral_earnings;

CREATE POLICY "Users view own earnings only" 
ON public.referral_earnings 
FOR SELECT 
USING (
  wallet_address = COALESCE(
    auth.jwt() ->> 'wallet_address',
    (auth.jwt() -> 'user_metadata' ->> 'wallet_address')
  )
);

-- Also fix the withdrawal_requests policy
DROP POLICY IF EXISTS "Users view own withdrawals only" ON public.withdrawal_requests;

CREATE POLICY "Users view own withdrawals only" 
ON public.withdrawal_requests 
FOR SELECT 
USING (
  wallet_address = COALESCE(
    auth.jwt() ->> 'wallet_address',
    (auth.jwt() -> 'user_metadata' ->> 'wallet_address')
  )
);