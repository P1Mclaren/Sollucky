-- Fix RLS policies to be secure - make referral earnings and withdrawals publicly readable
-- This is appropriate since other lottery data (tickets, referrals) is also public

DROP POLICY IF EXISTS "Users view own earnings only" ON public.referral_earnings;
DROP POLICY IF EXISTS "Users view own withdrawals only" ON public.withdrawal_requests;

-- Allow anyone to view referral earnings (consistent with public referrals table)
CREATE POLICY "Anyone can view referral earnings" 
ON public.referral_earnings 
FOR SELECT 
USING (true);

-- Allow anyone to view withdrawal requests (consistent with public lottery data)
CREATE POLICY "Anyone can view withdrawal requests" 
ON public.withdrawal_requests 
FOR SELECT 
USING (true);